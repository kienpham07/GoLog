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
	query := `
	CREATE TABLE IF NOT EXISTS logs (
		id SERIAL PRIMARY KEY,
		ip VARCHAR(50),
		method VARCHAR(10),
		endpoint TEXT,
		status INTEGER,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := DB.Exec(query)
	if err != nil {
		log.Fatal("Failed to initialize database schema: ", err)
	}
	fmt.Println("✅ Database schema initialized!")
}
