package main

import (
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/kienpham07/GoLog/database"
)

func main() {
	// 1. Initialize the Database connection
	database.Connect()

	// 2. Set up the Gin router
	router := gin.Default()
	router.MaxMultipartMemory = 8 << 20

	// Limit the maximum memory for file uploads to 8 MB to prevent server crashes from massive files.
	router.MaxMultipartMemory = 8 << 20

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
	})

	// Start the server
	router.Run(":8080")
}
