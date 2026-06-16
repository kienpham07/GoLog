package database

import (
	"fmt"

	"github.com/kienpham07/GoLog/backend/models"
)

// InsertLogEntries saves a slice of parsed logs into PostgreSQL
func InsertLogEntries(entries []models.LogEntry) error {
	// Prepare the statement once for security and performance
	stmt, err := DB.Prepare("INSERT INTO logs (ip, method, endpoint, status) VALUES ($1, $2, $3, $4)")
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	// Loop through the slice and execute the prepared statement for each entry
	for _, entry := range entries {
		_, err := stmt.Exec(entry.IP, entry.Method, entry.Endpoint, entry.Status) // Executes the prepared SQL statement.
		if err != nil {
			return fmt.Errorf("failed to insert entry: %w", err)
		}
	}

	return nil
}

// GetLogs retrieves the most recent 100 log entries from the database
// Reading log data from PostgreSQL database and returning it as a Go slice.
func GetLogs() ([]models.LogEntry, error) {
	// Query the database, ordering by newest first
	rows, err := DB.Query("SELECT ip, method, endpoint, status FROM logs ORDER BY created_at DESC LIMIT 100")
	if err != nil {
		return nil, fmt.Errorf("failed to query logs: %w", err)
	}
	defer rows.Close()

	logs := []models.LogEntry{}

	// Loop through the result set
	for rows.Next() {
		var entry models.LogEntry
		if err := rows.Scan(&entry.IP, &entry.Method, &entry.Endpoint, &entry.Status); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
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
