package models

import "time"

// LogEntry represents a single parsed line from the web log.
// The backticks define JSON tags, which will be useful later when we send this to the frontend.
type LogEntry struct {
	ID           int       `json:"id"`
	IP           string    `json:"ip"`
	Timestamp    time.Time `json:"timestamp"`
	Method       string    `json:"method"`
	Endpoint     string    `json:"endpoint"`
	Protocol     string    `json:"protocol"`
	Status       int       `json:"status"`
	Bytes        int       `json:"bytes"`
	Referrer     string    `json:"referrer"`
	UserAgent    string    `json:"user_agent"`
	ResponseTime int       `json:"response_time"`
	SessionID    *int      `json:"session_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

