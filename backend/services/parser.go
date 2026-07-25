package services

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/kienpham07/GoLog/backend/models"
)

// ParseLogFile function opens a log file, reads it line by line, and extracts the data.
func ParseLogFile(filePath string) ([]models.LogEntry, int, error) {
	var entries []models.LogEntry
	skippedCount := 0

	// Open the file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to open file: %w", err)
	}
	// Ensure the file is closed when the function finishes
	defer file.Close()

	// Define a Regex pattern to match Apache Combined Log format with response time
	// Example: 192.168.1.1 - - [01/Jul/2026:00:03:05 +0000] "GET /home HTTP/1.1" 200 1024 "-" "Mozilla/Firefox" 76
	logPattern := regexp.MustCompile(`^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(.*?)\s+(\S+)"\s+(\d+)\s+(\d+|-)\s+"([^"]*)"\s+"([^"]*)"\s+(\d+)$`)

	// Create a scanner to read the file line by line
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()

		// Find the matches using our Regex
		matches := logPattern.FindStringSubmatch(line)

		// If we get exactly 11 items (the full string + 10 capture groups), it's a valid line
		if len(matches) == 11 {
			// Parse timestamp
			timestamp, err := time.Parse("02/Jan/2006:15:04:05 -0700", matches[2])
			if err != nil {
				skippedCount++
				continue
			}
			timestamp = timestamp.UTC()

			// Convert status code from string to integer
			status, err := strconv.Atoi(matches[6])
			if err != nil {
				skippedCount++
				continue
			}

			// Convert bytes from string to integer (handle "-" as 0)
			bytes := 0
			if matches[7] != "-" && matches[7] != "" {
				b, err := strconv.Atoi(matches[7])
				if err != nil {
					skippedCount++
					continue
				}
				bytes = b
			}

			// Convert response time from string to integer
			responseTime, err := strconv.Atoi(matches[10])
			if err != nil {
				skippedCount++
				continue
			}

			// Create a new LogEntry struct
			entry := models.LogEntry{
				IP:           matches[1],
				Timestamp:    timestamp,
				Method:       matches[3],
				Endpoint:     matches[4],
				Protocol:     matches[5],
				Status:       status,
				Bytes:        bytes,
				Referrer:     matches[8],
				UserAgent:    matches[9],
				ResponseTime: responseTime,
			}

			entries = append(entries, entry)
		} else {
			skippedCount++
		}
	}

	// Check if the scanner encountered any errors during reading
	if err := scanner.Err(); err != nil {
		return nil, 0, fmt.Errorf("error reading file: %w", err)
	}

	return entries, skippedCount, nil
}

