package models

// LogEntry represents a single parsed line from the web log.
// The backticks define JSON tags, which will be useful later when we send this to the frontend.
type LogEntry struct {
	IP       string `json:"ip"`
	Method   string `json:"method"`
	Endpoint string `json:"endpoint"`
	Status   int    `json:"status"`
}
