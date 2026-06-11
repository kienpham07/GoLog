package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq" // The blank identifier "_" imports the driver without using it directly
)

// DB is a global variable holding the database connection pool
var DB *sql.DB

func Connect() {
	// Update these values to match your PostgreSQL setup
	connStr := "host=localhost port=5432 user=log_user password=Kienpham_35894091 dbname=log_analyzer sslmode=disable"

	var err error
	// sql.Open validates the connection string but doesn't actually connect
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error opening database connection: ", err)
	}

	// Ping actually opens the connection and verifies the credentials
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
