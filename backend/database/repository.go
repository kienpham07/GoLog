package database

import (
	"database/sql"
	"fmt"
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

// GetLogs retrieves the most recent 100 log entries from the database, optionally filtered by session_id
func GetLogs(sessionID *int) ([]models.LogEntry, error) {
	var stmt *sql.Stmt
	var rows *sql.Rows
	var err error

	if sessionID != nil {
		stmt, err = DB.Prepare(`
			SELECT 
				id, COALESCE(ip, ''), timestamp, COALESCE(method, ''), COALESCE(endpoint, ''), 
				COALESCE(protocol, ''), COALESCE(status, 0), COALESCE(bytes, 0), 
				COALESCE(referrer, ''), COALESCE(user_agent, ''), COALESCE(response_time, 0), session_id
			FROM logs 
			WHERE session_id = $1 
			ORDER BY timestamp DESC 
			LIMIT 100
		`)
		if err != nil {
			return nil, fmt.Errorf("failed to prepare get logs query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(*sessionID)
	} else {
		stmt, err = DB.Prepare(`
			SELECT 
				id, COALESCE(ip, ''), timestamp, COALESCE(method, ''), COALESCE(endpoint, ''), 
				COALESCE(protocol, ''), COALESCE(status, 0), COALESCE(bytes, 0), 
				COALESCE(referrer, ''), COALESCE(user_agent, ''), COALESCE(response_time, 0), session_id
			FROM logs 
			ORDER BY timestamp DESC 
			LIMIT 100
		`)
		if err != nil {
			return nil, fmt.Errorf("failed to prepare get logs query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query()
	}

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
			entry.Timestamp = ts.Time
		}
		logs = append(logs, entry)
	}

	return logs, nil
}

// GetStatsOverview fetches basic request statistics
func GetStatsOverview(sessionID *int) (*StatsOverview, error) {
	var stmt *sql.Stmt
	var row *sql.Row
	var err error

	baseQuery := `
		SELECT 
			COUNT(*), 
			COUNT(DISTINCT ip), 
			COALESCE(SUM(bytes), 0), 
			COUNT(CASE WHEN status >= 400 THEN 1 END) 
		FROM logs
	`

	if sessionID != nil {
		stmt, err = DB.Prepare(baseQuery + " WHERE session_id = $1")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare overview query: %w", err)
		}
		defer stmt.Close()
		row = stmt.QueryRow(*sessionID)
	} else {
		stmt, err = DB.Prepare(baseQuery)
		if err != nil {
			return nil, fmt.Errorf("failed to prepare overview query: %w", err)
		}
		defer stmt.Close()
		row = stmt.QueryRow()
	}

	var totalRequests int
	var uniqueIPs int
	var totalBytes int64
	var errorRequests int

	err = row.Scan(&totalRequests, &uniqueIPs, &totalBytes, &errorRequests)
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
func GetTrafficStats(sessionID *int) ([]TrafficStat, error) {
	var stmt *sql.Stmt
	var rows *sql.Rows
	var err error

	baseQuery := `
		SELECT 
			DATE_TRUNC('hour', timestamp) AS hr, 
			COUNT(*) 
		FROM logs
	`

	if sessionID != nil {
		stmt, err = DB.Prepare(baseQuery + " WHERE session_id = $1 GROUP BY hr ORDER BY hr ASC")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare traffic query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(*sessionID)
	} else {
		stmt, err = DB.Prepare(baseQuery + " GROUP BY hr ORDER BY hr ASC")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare traffic query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query()
	}

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
		stat.Hour = hr.Format(time.RFC3339)
		stat.Count = count
		stats = append(stats, stat)
	}

	return stats, nil
}

// GetTopEndpoints returns the top 10 most frequently accessed endpoints
func GetTopEndpoints(sessionID *int) ([]TopEndpoint, error) {
	var stmt *sql.Stmt
	var rows *sql.Rows
	var err error

	baseQuery := "SELECT endpoint, COUNT(*) as cnt FROM logs"

	if sessionID != nil {
		stmt, err = DB.Prepare(baseQuery + " WHERE session_id = $1 GROUP BY endpoint ORDER BY cnt DESC LIMIT 10")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare top endpoints query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(*sessionID)
	} else {
		stmt, err = DB.Prepare(baseQuery + " GROUP BY endpoint ORDER BY cnt DESC LIMIT 10")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare top endpoints query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query()
	}

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
func GetTopIPs(sessionID *int) ([]TopIP, error) {
	var stmt *sql.Stmt
	var rows *sql.Rows
	var err error

	baseQuery := `
		SELECT 
			ip, 
			COUNT(*) as cnt,
			(COUNT(*) > 200 OR SUM(CASE WHEN endpoint = '/.env' OR endpoint = '/wp-admin' OR endpoint = '/phpmyadmin' OR endpoint LIKE '%/.env%' OR endpoint LIKE '%/wp-admin%' OR endpoint LIKE '%/phpmyadmin%' THEN 1 ELSE 0 END) > 0) as suspicious
		FROM logs
	`

	if sessionID != nil {
		stmt, err = DB.Prepare(baseQuery + " WHERE session_id = $1 GROUP BY ip ORDER BY cnt DESC LIMIT 10")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare top IPs query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(*sessionID)
	} else {
		stmt, err = DB.Prepare(baseQuery + " GROUP BY ip ORDER BY cnt DESC LIMIT 10")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare top IPs query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query()
	}

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
func GetStatusCodesStats(sessionID *int) ([]StatusCodeStat, error) {
	var stmt *sql.Stmt
	var rows *sql.Rows
	var err error

	baseQuery := "SELECT status, COUNT(*) as cnt FROM logs"

	if sessionID != nil {
		stmt, err = DB.Prepare(baseQuery + " WHERE session_id = $1 GROUP BY status ORDER BY status ASC")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare status codes query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(*sessionID)
	} else {
		stmt, err = DB.Prepare(baseQuery + " GROUP BY status ORDER BY status ASC")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare status codes query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query()
	}

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
func GetBrowsersStats(sessionID *int) ([]BrowserStat, error) {
	var stmt *sql.Stmt
	var rows *sql.Rows
	var err error

	baseQuery := `
		SELECT 
			CASE 
				WHEN user_agent ILIKE '%bot%' OR user_agent ILIKE '%crawler%' OR user_agent ILIKE '%spider%' THEN 'Bot'
				WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
				WHEN user_agent ILIKE '%chrome%' THEN 'Chrome'
				WHEN user_agent ILIKE '%safari%' THEN 'Safari'
				ELSE 'Other'
			END as browser_name,
			COUNT(*)
		FROM logs
	`

	if sessionID != nil {
		stmt, err = DB.Prepare(baseQuery + " WHERE session_id = $1 GROUP BY browser_name ORDER BY COUNT(*) DESC")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare browsers query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(*sessionID)
	} else {
		stmt, err = DB.Prepare(baseQuery + " GROUP BY browser_name ORDER BY COUNT(*) DESC")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare browsers query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query()
	}

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
func GetErrorLogs(sessionID *int, limit, offset int) ([]models.LogEntry, error) {
	var stmt *sql.Stmt
	var rows *sql.Rows
	var err error

	baseQuery := `
		SELECT 
			id, COALESCE(ip, ''), timestamp, COALESCE(method, ''), COALESCE(endpoint, ''), 
			COALESCE(protocol, ''), COALESCE(status, 0), COALESCE(bytes, 0), 
			COALESCE(referrer, ''), COALESCE(user_agent, ''), COALESCE(response_time, 0), session_id
		FROM logs
		WHERE status >= 400
	`

	if sessionID != nil {
		stmt, err = DB.Prepare(baseQuery + " AND session_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare error logs query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(*sessionID, limit, offset)
	} else {
		stmt, err = DB.Prepare(baseQuery + " ORDER BY timestamp DESC LIMIT $1 OFFSET $2")
		if err != nil {
			return nil, fmt.Errorf("failed to prepare error logs query: %w", err)
		}
		defer stmt.Close()
		rows, err = stmt.Query(limit, offset)
	}

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
			entry.Timestamp = ts.Time
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
