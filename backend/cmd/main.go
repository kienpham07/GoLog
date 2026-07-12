package main

import (
	"errors"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/kienpham07/GoLog/backend/database"
	"github.com/kienpham07/GoLog/backend/middleware"
	"github.com/kienpham07/GoLog/backend/models"
	"github.com/kienpham07/GoLog/backend/services"
	"github.com/kienpham07/GoLog/backend/utils"
	"golang.org/x/crypto/bcrypt"
)

const (
	maxUploadSize      int64 = 8 << 20                   // 8 x 2^20 (Limit file upload)
	maxRequestBodySize int64 = maxUploadSize + (1 << 20) // (Limit of the entire http request)
)

func main() {
	// 1. Initialize the Database connection
	database.Connect()
	database.InitSchema()

	// 2. Initialize JWT settings
	utils.InitJWT()

	// 3. Set up the Gin router
	router := gin.Default()

	// Enable CORS for the frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},                             //Next.js port
		AllowMethods: []string{"GET", "POST", "OPTIONS"},                            // Identify which kinds of requests are allowed for FE
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"}, // Identify HTTP Headers permitted in request
	}))

	// Limit the maximum memory for file uploads to 8 MB to prevent server crashes from massive files.
	router.MaxMultipartMemory = maxUploadSize

	// GET health-check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// --------------------------------------------------------
	// AUTHENTICATION ENDPOINTS
	// --------------------------------------------------------

	// User Registration
	router.POST("/api/register", func(c *gin.Context) {
		var creds models.Credentials

		// Bind the incoming JSON to our Credentials struct
		if err := c.ShouldBindJSON(&creds); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Hash the password using bcrypt (Cost of 14 is a strong default)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), 14)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
			return
		}

		// Save to PostgreSQL
		err = database.CreateUser(creds.Username, string(hashedPassword))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Username already exists"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
	})

	// User Login
	router.POST("/api/login", func(c *gin.Context) {
		var creds models.Credentials
		if err := c.ShouldBindJSON(&creds); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Look up the user in the database
		user, err := database.GetUserByUsername(creds.Username)
		if err != nil {
			// Always return a generic error for security (don't reveal if the username exists)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}

		// Compare the provided password against the stored hash
		err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(creds.Password))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}

		// Password is correct! Generate the JWT.
		token, err := utils.GenerateToken(user.Username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// Send the token back to the frontend
		c.JSON(http.StatusOK, gin.H{"token": token})
	})

	// New File Upload Endpoint
	router.POST("/api/upload", func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxRequestBodySize)

		// 1. Retrieve the file from the form data (key must be "file")
		file, err := c.FormFile("file")
		if err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "File is too large"})
				return
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file received"})
			return
		}
		if file.Size > maxUploadSize {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "File is too large"})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logs"})
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
	router.GET("/api/logs", middleware.AuthRequired(), func(c *gin.Context) {
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
