package models

// User represents a registered user in the system
type User struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"` // The "-" skips that field when converting the struct to JSON.
}

// Credentials is used to parse incoming login/register requests
type Credentials struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}
