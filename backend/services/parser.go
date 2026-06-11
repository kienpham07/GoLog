package services

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strconv"

	"github.com/kienpham07/GoLog/backend/models"
)

// ParseLogFile function opens a log file, reads it line by line, and extracts the data.
func ParseLogFile(filePath string) ([]models.LogEntry, error) {
	var entries []models.LogEntry

	// Open the file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	// Ensure the file is closed when the function finishes (similar to a finally block in Java)
	defer file.Close()

	// Define a Regex pattern to match: "IP - METHOD ENDPOINT STATUS"
	// Example target: "127.0.0.1 - GET /login 404"
	logPattern := regexp.MustCompile(`^(\S+)\s+-\s+(\w+)\s+(\S+)\s+(\d+)$`)

	// Create a scanner to read the file line by line
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()

		// Find the matches using our Regex
		matches := logPattern.FindStringSubmatch(line)

		// If we get exactly 5 items (the full string + 4 capture groups), it's a valid line
		// Ex: matches[0]: "127.0.0.1 - GET /login 404", matches[1]: "127.0.0.1"
		if len(matches) == 5 {
			// Convert the status code from string to integer
			status, _ := strconv.Atoi(matches[4])

			// Create a new LogEntry struct
			entry := models.LogEntry{
				IP:       matches[1],
				Method:   matches[2],
				Endpoint: matches[3],
				Status:   status,
			}

			entries = append(entries, entry)
		}
	}

	// Check if the scanner encountered any errors during reading
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	return entries, nil
}
