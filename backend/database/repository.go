package database

import (
	"database/sql"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/kienpham07/GoLog/backend/models"
)

// Structs for stats responses
type StatsOverview struct {
	TotalRequests int     `json:"total_requests"`
	UniqueIPs     int     `json:"unique_ips"`
	ErrorRate     float64 `json:"error_rate"`
	TotalBytes    int64   `json:"total_bytes"`
}

type TrafficStat struct {
	Hour  string `json:"hour"`
	Count int    `json:"count"`
}

type TopEndpoint struct {
	Endpoint string `json:"endpoint"`
	Count    int    `json:"count"`
}

type TopIP struct {
	IP         string `json:"ip"`
	Count      int    `json:"count"`
	Suspicious bool   `json:"suspicious"`
}

type StatusCodeStat struct {
	Status int `json:"status"`
	Count  int `json:"count"`
}

type BrowserStat struct {
	Browser string `json:"browser"`
	Count   int    `json:"count"`
}

// CreateSession saves a new log upload session and returns its ID
func CreateSession(userID int, filename string, parsedCount, skippedCount int) (int, error) {
	stmt, err := DB.Prepare("INSERT INTO sessions (user_id, filename, parsed_count, skipped_count) VALUES ($1, $2, $3, $4) RETURNING id")
	if err != nil {
		return 0, fmt.Errorf("failed to prepare session insert: %w", err)
	}
	defer stmt.Close()

	var id int
	err = stmt.QueryRow(userID, filename, parsedCount, skippedCount).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("failed to execute session insert: %w", err)
	}

	return id, nil
}

// GetUploadCountInLastHour returns the number of log uploads by a user in the last hour
func GetUploadCountInLastHour(userID int) (int, error) {
	stmt, err := DB.Prepare("SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'")
	if err != nil {
		return 0, fmt.Errorf("failed to prepare rate limit check: %w", err)
	}
	defer stmt.Close()

	var count int
	err = stmt.QueryRow(userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to check rate limit: %w", err)
	}

	return count, nil
}

// InsertLogEntries saves a slice of parsed logs into PostgreSQL associated with a session
func InsertLogEntries(entries []models.LogEntry, sessionID int) error {
	stmt, err := DB.Prepare(`
		INSERT INTO logs (ip, timestamp, method, endpoint, protocol, status, bytes, referrer, user_agent, response_time, session_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	// Loop through the slice and execute the prepared statement for each entry
	for _, entry := range entries {
		_, err := stmt.Exec(
			entry.IP,
			entry.Timestamp,
			entry.Method,
			entry.Endpoint,
			entry.Protocol,
			entry.Status,
			entry.Bytes,
			entry.Referrer,
			entry.UserAgent,
			entry.ResponseTime,
			sessionID,
		)
		if err != nil {
			return fmt.Errorf("failed to insert entry: %w", err)
		}
	}

	return nil
}

func buildWhereClause(sessionID *int, startDate *time.Time, endDate *time.Time) (string, []interface{}) {
	conditions := []string{}
	args := []interface{}{}

	if sessionID != nil {
		args = append(args, *sessionID)
		conditions = append(conditions, fmt.Sprintf("session_id = $%d", len(args)))
	}
	if startDate != nil {
		args = append(args, *startDate)
		conditions = append(conditions, fmt.Sprintf("timestamp >= $%d", len(args)))
	}
	if endDate != nil {
		args = append(args, *endDate)
		conditions = append(conditions, fmt.Sprintf("timestamp <= $%d", len(args)))
	}

	if len(conditions) > 0 {
		return " WHERE " + strings.Join(conditions, " AND "), args
	}
	return "", args
}

// GetLogs retrieves log entries from the database, optionally filtered by session_id and date range
func GetLogs(sessionID *int, startDate *time.Time, endDate *time.Time) ([]models.LogEntry, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	argLen := len(args)
	query := fmt.Sprintf(`
		SELECT 
			id, COALESCE(ip, ''), timestamp, COALESCE(method, ''), COALESCE(endpoint, ''), 
			COALESCE(protocol, ''), COALESCE(status, 0), COALESCE(bytes, 0), 
			COALESCE(referrer, ''), COALESCE(user_agent, ''), COALESCE(response_time, 0), session_id
		FROM logs%s
		ORDER BY timestamp DESC LIMIT $%d
	`, where, argLen+1)

	args = append(args, 100)
	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query logs: %w", err)
	}
	defer rows.Close()

	logs := []models.LogEntry{}
	for rows.Next() {
		var entry models.LogEntry
		var ts sql.NullTime
		err := rows.Scan(
			&entry.ID, &entry.IP, &ts, &entry.Method, &entry.Endpoint,
			&entry.Protocol, &entry.Status, &entry.Bytes,
			&entry.Referrer, &entry.UserAgent, &entry.ResponseTime, &entry.SessionID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		if ts.Valid {
			entry.Timestamp = ts.Time.UTC()
		}
		logs = append(logs, entry)
	}

	return logs, nil
}

// GetStatsOverview fetches basic request statistics
func GetStatsOverview(sessionID *int, startDate *time.Time, endDate *time.Time) (*StatsOverview, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	query := `
		SELECT 
			COUNT(*), 
			COUNT(DISTINCT ip), 
			COALESCE(SUM(bytes), 0), 
			COUNT(CASE WHEN status >= 400 THEN 1 END) 
		FROM logs` + where

	row := DB.QueryRow(query, args...)

	var totalRequests int
	var uniqueIPs int
	var totalBytes int64
	var errorRequests int

	err := row.Scan(&totalRequests, &uniqueIPs, &totalBytes, &errorRequests)
	if err != nil {
		return nil, fmt.Errorf("failed to scan overview: %w", err)
	}

	errorRate := 0.0
	if totalRequests > 0 {
		errorRate = float64(errorRequests) / float64(totalRequests)
	}

	return &StatsOverview{
		TotalRequests: totalRequests,
		UniqueIPs:     uniqueIPs,
		ErrorRate:     errorRate,
		TotalBytes:    totalBytes,
	}, nil
}

// GetTrafficStats aggregates request counts grouped by hour
func GetTrafficStats(sessionID *int, startDate *time.Time, endDate *time.Time) ([]TrafficStat, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	query := `
		SELECT 
			DATE_TRUNC('hour', timestamp) AS hr, 
			COUNT(*) 
		FROM logs` + where + ` GROUP BY hr ORDER BY hr ASC`

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query traffic stats: %w", err)
	}
	defer rows.Close()

	stats := []TrafficStat{}
	for rows.Next() {
		var stat TrafficStat
		var hr time.Time
		var count int
		if err := rows.Scan(&hr, &count); err != nil {
			return nil, fmt.Errorf("failed to scan traffic row: %w", err)
		}
		stat.Hour = hr.UTC().Format(time.RFC3339)
		stat.Count = count
		stats = append(stats, stat)
	}

	return stats, nil
}

// GetTopEndpoints returns the top 10 most frequently accessed endpoints
func GetTopEndpoints(sessionID *int, startDate *time.Time, endDate *time.Time) ([]TopEndpoint, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	query := `SELECT endpoint, COUNT(*) as cnt FROM logs` + where + ` GROUP BY endpoint ORDER BY cnt DESC LIMIT 10`

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query top endpoints: %w", err)
	}
	defer rows.Close()

	stats := []TopEndpoint{}
	for rows.Next() {
		var stat TopEndpoint
		if err := rows.Scan(&stat.Endpoint, &stat.Count); err != nil {
			return nil, fmt.Errorf("failed to scan top endpoint row: %w", err)
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// GetTopIPs returns top client IPs and flags suspicious ones
func GetTopIPs(sessionID *int, startDate *time.Time, endDate *time.Time) ([]TopIP, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	query := `
		WITH ip_counts AS (
			SELECT 
				ip, 
				COUNT(*) as cnt,
				SUM(CASE 
					WHEN LOWER(endpoint) LIKE '%/.env%' 
					  OR LOWER(endpoint) LIKE '%.env%'
					  OR LOWER(endpoint) LIKE '%/wp-admin%'
					  OR LOWER(endpoint) LIKE '%/wp-login.php%'
					  OR LOWER(endpoint) LIKE '%/phpmyadmin%'
					  OR LOWER(endpoint) LIKE '%/.git%'
					  OR LOWER(endpoint) LIKE '%/config%'
					THEN 1 ELSE 0 
				END) as sensitive_cnt,
				SUM(CASE WHEN status = 401 THEN 1 ELSE 0 END) as auth_fail_cnt
			FROM logs` + where + `
			GROUP BY ip
		),
		stats AS (
			SELECT COALESCE(AVG(cnt), 0) as avg_cnt FROM ip_counts
		)
		SELECT 
			i.ip, 
			i.cnt,
			(i.sensitive_cnt > 0 OR i.auth_fail_cnt > 10 OR i.cnt > 600 OR (i.cnt >= (SELECT avg_cnt * 2.0 FROM stats) AND i.cnt >= 50)) as suspicious
		FROM ip_counts i
		ORDER BY i.cnt DESC
		LIMIT 10
	`

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query top IPs: %w", err)
	}
	defer rows.Close()

	stats := []TopIP{}
	for rows.Next() {
		var stat TopIP
		if err := rows.Scan(&stat.IP, &stat.Count, &stat.Suspicious); err != nil {
			return nil, fmt.Errorf("failed to scan top IP row: %w", err)
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// GetStatusCodesStats aggregates request counts by status code
func GetStatusCodesStats(sessionID *int, startDate *time.Time, endDate *time.Time) ([]StatusCodeStat, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	query := `SELECT status, COUNT(*) as cnt FROM logs` + where + ` GROUP BY status ORDER BY status ASC`

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query status codes: %w", err)
	}
	defer rows.Close()

	stats := []StatusCodeStat{}
	for rows.Next() {
		var stat StatusCodeStat
		if err := rows.Scan(&stat.Status, &stat.Count); err != nil {
			return nil, fmt.Errorf("failed to scan status code row: %w", err)
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// GetBrowsersStats aggregates request counts by parsed browser from user agent
func GetBrowsersStats(sessionID *int, startDate *time.Time, endDate *time.Time) ([]BrowserStat, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	query := `
		SELECT 
			CASE 
				WHEN user_agent ILIKE '%bot%' OR user_agent ILIKE '%crawler%' OR user_agent ILIKE '%spider%' THEN 'Bot'
				WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
				WHEN user_agent ILIKE '%chrome%' THEN 'Chrome'
				WHEN user_agent ILIKE '%safari%' THEN 'Safari'
				ELSE 'Other'
			END as browser_name,
			COUNT(*)
		FROM logs` + where + `
		GROUP BY browser_name
		ORDER BY COUNT(*) DESC
	`

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query browsers: %w", err)
	}
	defer rows.Close()

	stats := []BrowserStat{}
	for rows.Next() {
		var stat BrowserStat
		if err := rows.Scan(&stat.Browser, &stat.Count); err != nil {
			return nil, fmt.Errorf("failed to scan browser row: %w", err)
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// GetErrorLogs returns log entries where status >= 400 with pagination
func GetErrorLogs(sessionID *int, startDate *time.Time, endDate *time.Time, limit, offset int) ([]models.LogEntry, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)

	if where == "" {
		where = " WHERE status >= 400"
	} else {
		where += " AND status >= 400"
	}

	argLen := len(args)
	query := fmt.Sprintf(`
		SELECT 
			id, COALESCE(ip, ''), timestamp, COALESCE(method, ''), COALESCE(endpoint, ''), 
			COALESCE(protocol, ''), COALESCE(status, 0), COALESCE(bytes, 0), 
			COALESCE(referrer, ''), COALESCE(user_agent, ''), COALESCE(response_time, 0), session_id
		FROM logs%s
		ORDER BY timestamp DESC LIMIT $%d OFFSET $%d
	`, where, argLen+1, argLen+2)

	args = append(args, limit, offset)
	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query error logs: %w", err)
	}
	defer rows.Close()

	logs := []models.LogEntry{}
	for rows.Next() {
		var entry models.LogEntry
		var ts sql.NullTime
		err := rows.Scan(
			&entry.ID, &entry.IP, &ts, &entry.Method, &entry.Endpoint,
			&entry.Protocol, &entry.Status, &entry.Bytes,
			&entry.Referrer, &entry.UserAgent, &entry.ResponseTime, &entry.SessionID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan error log row: %w", err)
		}
		if ts.Valid {
			entry.Timestamp = ts.Time.UTC()
		}
		logs = append(logs, entry)
	}

	return logs, nil
}

// CreateUser hashes a password and saves the new user to PostgreSQL
func CreateUser(username, passwordHash string) error {
	stmt, err := DB.Prepare("INSERT INTO users (username, password_hash) VALUES ($1, $2)")
	if err != nil {
		return fmt.Errorf("failed to prepare user statement: %w", err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(username, passwordHash)
	return err
}

// GetUserByUsername retrieves a user to verify login credentials
func GetUserByUsername(username string) (*models.User, error) {
	var user models.User

	query := "SELECT id, username, password_hash FROM users WHERE username = $1"
	err := DB.QueryRow(query, username).Scan(&user.ID, &user.Username, &user.PasswordHash)

	if err != nil {
		return nil, err
	}
	return &user, nil
}

type SessionInfo struct {
	ID           int       `json:"id"`
	Filename     string    `json:"filename"`
	ParsedCount  int       `json:"parsed_count"`
	SkippedCount int       `json:"skipped_count"`
	CreatedAt    time.Time `json:"created_at"`
}

// GetSessions retrieves all upload sessions for a specific user
func GetSessions(userID int) ([]SessionInfo, error) {
	stmt, err := DB.Prepare("SELECT id, filename, parsed_count, skipped_count, created_at FROM sessions WHERE user_id = $1 ORDER BY created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("failed to prepare sessions query: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query sessions: %w", err)
	}
	defer rows.Close()

	sessions := []SessionInfo{}
	for rows.Next() {
		var s SessionInfo
		if err := rows.Scan(&s.ID, &s.Filename, &s.ParsedCount, &s.SkippedCount, &s.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan session row: %w", err)
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

type GeoStat struct {
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Count       int     `json:"count"`
}

type GeoInfo struct {
	Country     string
	CountryCode string
	Latitude    float64
	Longitude   float64
}

var countriesList = []GeoInfo{
	{"United States", "US", 37.0902, -95.7129},
	{"United Kingdom", "GB", 55.3781, -3.4360},
	{"Germany", "DE", 51.1657, 10.4515},
	{"France", "FR", 46.2276, 2.2137},
	{"Japan", "JP", 36.2048, 138.2529},
	{"Australia", "AU", -25.2744, 133.7751},
	{"Brazil", "BR", -14.2350, -51.9253},
	{"Canada", "CA", 56.1304, -106.3468},
	{"India", "IN", 20.5937, 78.9629},
	{"Singapore", "SG", 1.3521, 103.8198},
	{"Vietnam", "VN", 14.0583, 108.2772},
	{"Netherlands", "NL", 52.1326, 5.2913},
}

func GeolocateIP(ipStr string) GeoInfo {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return countriesList[0] // fallback US
	}

	ip4 := ip.To4()
	if ip4 != nil {
		firstOctet := int(ip4[0])
		switch firstOctet {
		case 8, 34, 52, 54, 72, 74, 104, 107, 108, 172:
			return GeoInfo{"United States", "US", 37.0902, -95.7129}
		case 109, 146, 178, 193, 194, 212, 217:
			return GeoInfo{"Germany", "DE", 51.1657, 10.4515}
		case 2, 25, 31, 51, 62, 82, 86, 92, 94:
			return GeoInfo{"United Kingdom", "GB", 55.3781, -3.4360}
		case 37, 78, 80, 81, 88, 90, 93, 195:
			return GeoInfo{"France", "FR", 46.2276, 2.2137}
		case 1, 27, 43, 49, 103, 115, 117, 123, 125, 182, 203:
			return GeoInfo{"India", "IN", 20.5937, 78.9629}
		case 14, 58, 61, 113, 118, 171, 222:
			return GeoInfo{"Vietnam", "VN", 14.0583, 108.2772}
		case 60, 110, 111, 114, 116, 119, 120, 121, 122, 124, 126, 133, 150, 153, 210, 219, 220, 221:
			return GeoInfo{"Japan", "JP", 36.2048, 138.2529}
		case 13, 59, 101, 112, 144, 152, 202, 223:
			return GeoInfo{"Australia", "AU", -25.2744, 133.7751}
		case 100, 138, 168, 177, 179, 186, 187, 189, 191, 200, 201:
			return GeoInfo{"Brazil", "BR", -14.2350, -51.9253}
		case 24, 64, 66, 67, 68, 69, 70, 75, 76, 96, 97, 98, 99, 142, 184, 192, 198, 199, 204, 205, 206, 207, 208, 209:
			secondOctet := int(ip4[1])
			if secondOctet%3 == 0 {
				return GeoInfo{"Canada", "CA", 56.1304, -106.3468}
			} else if secondOctet%3 == 1 {
				return GeoInfo{"Singapore", "SG", 1.3521, 103.8198}
			} else {
				return GeoInfo{"Netherlands", "NL", 52.1326, 5.2913}
			}
		}

		sum := int(ip4[0]) + int(ip4[1]) + int(ip4[2]) + int(ip4[3])
		idx := sum % len(countriesList)
		return countriesList[idx]
	}

	var sum int
	for _, b := range ip {
		sum += int(b)
	}
	idx := sum % len(countriesList)
	return countriesList[idx]
}

func GetGeographicStats(sessionID *int, startDate *time.Time, endDate *time.Time) ([]GeoStat, error) {
	where, args := buildWhereClause(sessionID, startDate, endDate)
	query := `
		SELECT 
			ip, 
			COUNT(*) as cnt
		FROM logs` + where + `
		GROUP BY ip
	`

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query geographic stats: %w", err)
	}
	defer rows.Close()

	countryMap := make(map[string]*GeoStat)
	for rows.Next() {
		var ip string
		var count int
		if err := rows.Scan(&ip, &count); err != nil {
			return nil, fmt.Errorf("failed to scan geographic stats row: %w", err)
		}

		geo := GeolocateIP(ip)
		if stat, exists := countryMap[geo.Country]; exists {
			stat.Count += count
		} else {
			countryMap[geo.Country] = &GeoStat{
				Country:     geo.Country,
				CountryCode: geo.CountryCode,
				Latitude:    geo.Latitude,
				Longitude:   geo.Longitude,
				Count:       count,
			}
		}
	}

	stats := []GeoStat{}
	for _, stat := range countryMap {
		stats = append(stats, *stat)
	}

	return stats, nil
}
