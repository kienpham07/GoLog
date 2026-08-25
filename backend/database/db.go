package database

import (
	"database/sql"
	"fmt"
	"log"
	"net"
	"net/url"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func requiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("%s environment variable is required", key)
	}
	return value
}

func optionalEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func Connect() {
	host := requiredEnv("DB_HOST")
	port := requiredEnv("DB_PORT")
	user := requiredEnv("DB_USER")
	password := requiredEnv("DB_PASSWORD")
	dbName := requiredEnv("DB_NAME")
	sslMode := optionalEnv("DB_SSLMODE", "disable")

	dsn := url.URL{ // Building Data Source Name and constructing URL (Ex: postgres://user:password@localhost:6767/name_db?sslmode=disable)
		Scheme: "postgres",
		User:   url.UserPassword(user, password),
		Host:   net.JoinHostPort(host, port),
		Path:   "/" + dbName,
	}

	query := dsn.Query()
	query.Set("sslmode", sslMode)
	dsn.RawQuery = query.Encode()

	var err error
	DB, err = sql.Open("postgres", dsn.String())
	if err != nil {
		log.Fatal("Error opening database connection: ", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("Error connecting to the database: ", err)
	}

	fmt.Println("Successfully connected to PostgreSQL!")
}

// InitSchema ensures our database tables exist before the app starts running
func InitSchema() {
	// 1. Create the users table
	userQuery := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := DB.Exec(userQuery)
	if err != nil {
		log.Fatal("Failed to initialize users schema: ", err)
	}

	// 2. Create the sessions table
	sessionsQuery := `
	CREATE TABLE IF NOT EXISTS sessions (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		filename TEXT NOT NULL,
		parsed_count INTEGER NOT NULL,
		skipped_count INTEGER NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(sessionsQuery)
	if err != nil {
		log.Fatal("Failed to initialize sessions schema: ", err)
	}

	// 3. Create the logs table
	logQuery := `
	CREATE TABLE IF NOT EXISTS logs (
		id SERIAL PRIMARY KEY,
		ip VARCHAR(50),
		method VARCHAR(10),
		endpoint TEXT,
		protocol VARCHAR(50),
		status INTEGER,
		timestamp TIMESTAMP,
		bytes INTEGER,
		referrer TEXT,
		user_agent TEXT,
		response_time INTEGER,
		session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(logQuery)
	if err != nil {
		log.Fatal("Failed to initialize logs schema: ", err)
	}

	// 4. Alter logs table to add missing columns in case it already existed
	alterQueries := []string{
		"ALTER TABLE logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP",
		"ALTER TABLE logs ADD COLUMN IF NOT EXISTS protocol VARCHAR(50)",
		"ALTER TABLE logs ADD COLUMN IF NOT EXISTS bytes INTEGER",
		"ALTER TABLE logs ADD COLUMN IF NOT EXISTS referrer TEXT",
		"ALTER TABLE logs ADD COLUMN IF NOT EXISTS user_agent TEXT",
		"ALTER TABLE logs ADD COLUMN IF NOT EXISTS response_time INTEGER",
		"ALTER TABLE logs ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE",
	}
	for _, q := range alterQueries {
		_, err = DB.Exec(q)
		if err != nil {
			log.Println("Note during database migration: ", err)
		}
	}

	// 5. Add indexes on timestamp, status, ip for fast aggregation queries
	indexQueries := []string{
		"CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)",
		"CREATE INDEX IF NOT EXISTS idx_logs_status ON logs(status)",
		"CREATE INDEX IF NOT EXISTS idx_logs_ip ON logs(ip)",
		"CREATE INDEX IF NOT EXISTS idx_logs_session_id ON logs(session_id)",
	}
	for _, q := range indexQueries {
		_, err = DB.Exec(q)
		if err != nil {
			log.Fatal("Failed to create index: ", err)
		}
	}

	// 6. Create connected_sites table
	connectedSitesQuery := `
	CREATE TABLE IF NOT EXISTS connected_sites (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		domain VARCHAR(255) NOT NULL,
		api_key VARCHAR(100) UNIQUE NOT NULL,
		is_connected BOOLEAN DEFAULT FALSE,
		last_ping_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	_, err = DB.Exec(connectedSitesQuery)
	if err != nil {
		log.Println("Note during connected_sites schema initialization: ", err)
	}

	fmt.Println("✅ Database schemas initialized and migrated!")
}
