package models

import "time"

// ConnectedSite represents a linked external website/project for live log ingestion
type ConnectedSite struct {
	ID          int        `json:"id"`
	UserID      int        `json:"user_id"`
	Domain      string     `json:"domain"`
	APIKey      string     `json:"api_key"`
	IsConnected bool       `json:"is_connected"`
	LastPingAt  *time.Time `json:"last_ping_at"`
	CreatedAt   time.Time  `json:"created_at"`
}
