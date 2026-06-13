package main

import (
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/kienpham07/GoLog/backend/database"
	"github.com/kienpham07/GoLog/backend/services"
)

func main() {
	// 1. Initialize the Database connection
	database.Connect()
	database.InitSchema()

	// 2. Set up the Gin router
	router := gin.Default()

	// Enable CORS for the frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},            //Next.js port
		AllowMethods: []string{"GET", "POST", "OPTIONS"},           // Identify which kinds of requests are allowed for FE
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"}, // Identify HTTP Headers permitted in request
	}))

	router.MaxMultipartMemory = 8 << 20

	// Limit the maximum memory for file uploads to 8 MB to prevent server crashes from massive files.
	router.MaxMultipartMemory = 8 << 20 // 8 x 2^20 byte = 8MB

	// GET health-check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// New File Upload Endpoint
	router.POST("/api/upload", func(c *gin.Context) {
		// 1. Retrieve the file from the form data (key must be "file")
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file received"})
			return
		}

		// 2. Define where to save the file
		// We use filepath.Base to prevent path traversal attacks
		filename := filepath.Base(file.Filename)
		destination := "./uploads/" + filename

		// 3. Save the uploaded file to the destination
		if err := c.SaveUploadedFile(file, destination); err != nil {
			log.Println("Error saving file:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// 4. Return a success response
		c.JSON(http.StatusOK, gin.H{
			"message":  "File uploaded successfully",
			"filename": filename,
		})

		// After saving, parse the file!
		parsedLogs, err := services.ParseLogFile(destination)
		if err != nil {
			log.Println("Error parsing file:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse log file"})
			return
		}

		// Save the parsed logs to the database!
		err = database.InsertLogEntries(parsedLogs)
		if err != nil {
			log.Println("Error saving to database:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logs to database"})
			return
		}

		// Return a success response
		c.JSON(http.StatusOK, gin.H{
			"message":      "File uploaded and parsed successfully",
			"filename":     filename,
			"parsed_count": len(parsedLogs),
		})
	})

	// Get Logs Endpoint
	router.GET("/api/logs", func(c *gin.Context) {
		logs, err := database.GetLogs()
		if err != nil {
			log.Println("Error fetching logs:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
			return
		}

		c.JSON(http.StatusOK, logs)
	})

	// Start the server
	router.Run(":8080")
}
