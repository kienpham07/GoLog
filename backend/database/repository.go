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
