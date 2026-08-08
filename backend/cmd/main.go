package main

import (
	"encoding/json"
	"errors"
	"log"
	"math/rand"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/kienpham07/GoLog/backend/database"
	"github.com/kienpham07/GoLog/backend/internal"
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

	// Enable CORS for frontend applications
	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// Limit the maximum memory for file uploads to 8 MB to prevent server crashes from massive files.
	router.MaxMultipartMemory = maxUploadSize

	// Initialize WebSocket Hub
	hub := internal.NewHub()
	go hub.Run()

	// Middleware to broadcast all live incoming HTTP requests to WebSocket clients
	router.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()

		// Do not broadcast the WebSocket connection handshakes or internal simulate calls to prevent duplicates
		if strings.HasPrefix(c.Request.URL.Path, "/api/logs/stream") || c.Request.URL.Path == "/api/simulate" {
			return
		}

		duration := time.Since(start).Milliseconds()
		bytesSent := int64(c.Writer.Size())
		if bytesSent < 0 {
			bytesSent = 0
		}

		payload, err := json.Marshal(gin.H{
			"type": "log_entry",
			"data": gin.H{
				"ip":            c.ClientIP(),
				"method":        c.Request.Method,
				"endpoint":      c.Request.URL.Path,
				"status":        c.Writer.Status(),
				"bytes":         bytesSent,
				"referrer":      c.Request.Referer(),
				"user_agent":    c.Request.UserAgent(),
				"response_time": duration,
				"timestamp":     time.Now().UTC().Format(time.RFC3339),
			},
		})
		if err == nil {
			hub.Broadcast <- payload
		}
	})

	// GET health-check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// POST traffic simulation endpoint for live dashboard demo
	router.POST("/api/simulate", func(c *gin.Context) {
		var reqBody struct {
			IP           string `json:"ip"`
			Method       string `json:"method"`
			Endpoint     string `json:"endpoint"`
			Status       int    `json:"status"`
			Bytes        int    `json:"bytes"`
			ResponseTime int    `json:"response_time"`
		}

		_ = c.ShouldBindJSON(&reqBody)

		endpoints := []string{"/api/products", "/api/auth/login", "/checkout", "/dashboard", "/api/users", "/search?q=shoes", "/api/cart"}
		methods := []string{"GET", "POST", "PUT", "DELETE"}
		statuses := []int{200, 200, 200, 304, 401, 404, 500}
		ips := []string{"185.220.101.3", "45.33.32.156", "66.249.66.1", "192.0.2.55", "1.2.3.4"}

		ep := reqBody.Endpoint
		if ep == "" {
			ep = endpoints[rand.Intn(len(endpoints))]
		}

		method := reqBody.Method
		if method == "" {
			method = methods[rand.Intn(len(methods))]
		}

		status := reqBody.Status
		if status == 0 {
			status = statuses[rand.Intn(len(statuses))]
		}

		ip := reqBody.IP
		if ip == "" {
			ip = ips[rand.Intn(len(ips))]
		}

		bytesSent := reqBody.Bytes
		if bytesSent == 0 {
			bytesSent = rand.Intn(15000) + 120
		}

		responseTime := reqBody.ResponseTime
		if responseTime == 0 {
			responseTime = rand.Intn(250) + 15
		}

		payload, err := json.Marshal(gin.H{
			"type": "log_entry",
			"data": gin.H{
				"ip":            ip,
				"method":        method,
				"endpoint":      ep,
				"status":        status,
				"bytes":         bytesSent,
				"referrer":      "https://google.com",
				"user_agent":    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
				"response_time": responseTime,
				"timestamp":     time.Now().UTC().Format(time.RFC3339),
			},
		})
		if err == nil {
			hub.Broadcast <- payload
		}

		c.JSON(http.StatusOK, gin.H{"message": "Simulated log broadcasted"})
	})

	// GET WebSocket Log Streaming Endpoint (JWT protected)
	router.GET("/api/logs/stream", middleware.AuthRequired(), func(c *gin.Context) {
		internal.ServeWs(hub, c)
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

	// Protected File Upload Endpoint
	router.POST("/api/upload", middleware.AuthRequired(), func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxRequestBodySize)

		// 1. Retrieve current user and verify existence
		username := c.GetString("username")
		user, err := database.GetUserByUsername(username)
		if err != nil {
			log.Println("Error verifying user for upload:", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user session"})
			return
		}

		// 2. Rate limit check: 5 uploads per user per hour
		count, err := database.GetUploadCountInLastHour(user.ID)
		if err != nil {
			log.Println("Error checking upload count:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check upload limits"})
			return
		}
		if count >= 5 {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded. Maximum 5 uploads per hour allowed."})
			return
		}

		// 3. Retrieve the file from the form data
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

		// File type validation - reject uploads where the file does not have a .log extension or plain text content type
		ext := strings.ToLower(filepath.Ext(file.Filename))
		contentType := file.Header.Get("Content-Type")
		if ext != ".log" || (contentType != "text/plain" && !strings.HasPrefix(contentType, "text/")) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only .log files with plain text content type are allowed."})
			return
		}

		// 4. Define where to save the file
		filename := filepath.Base(file.Filename)
		destination := "./uploads/" + filename

		// 5. Save the uploaded file to the destination
		if err := c.SaveUploadedFile(file, destination); err != nil {
			log.Println("Error saving file:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// 6. Parse the file
		parsedLogs, skippedCount, err := services.ParseLogFile(destination)
		if err != nil {
			log.Println("Error parsing file:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse log file"})
			return
		}

		// 7. Create database upload session
		sessionID, err := database.CreateSession(user.ID, filename, len(parsedLogs), skippedCount)
		if err != nil {
			log.Println("Error creating upload session:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload session"})
			return
		}

		// 8. Save the parsed logs to the database
		err = database.InsertLogEntries(parsedLogs, sessionID)
		if err != nil {
			log.Println("Error saving logs to database:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save logs"})
			return
		}

		// Emit newly ingested log entries to WebSocket subscribers
		for _, entry := range parsedLogs {
			logPayload, err := json.Marshal(gin.H{
				"type": "log_entry",
				"data": gin.H{
					"ip":            entry.IP,
					"method":        entry.Method,
					"endpoint":      entry.Endpoint,
					"status":        entry.Status,
					"bytes":         entry.Bytes,
					"referrer":      entry.Referrer,
					"user_agent":    entry.UserAgent,
					"response_time": entry.ResponseTime,
					"timestamp":     entry.Timestamp.UTC().Format(time.RFC3339),
				},
			})
			if err == nil {
				hub.Broadcast <- logPayload
			}
		}

		// Broadcast stats_update event after all lines are parsed and inserted
		overview, err := database.GetStatsOverview(nil, nil, nil)
		if err == nil && overview != nil {
			statsPayload, err := json.Marshal(gin.H{
				"type": "stats_update",
				"data": gin.H{
					"total_requests": overview.TotalRequests,
					"error_rate":     overview.ErrorRate * 100.0,
					"total_bytes":    overview.TotalBytes,
				},
			})
			if err == nil {
				hub.Broadcast <- statsPayload
			}
		}

		// Calculate date range from parsed logs
		dateRange := "N/A"
		if len(parsedLogs) > 0 {
			minTime := parsedLogs[0].Timestamp.UTC()
			maxTime := parsedLogs[0].Timestamp.UTC()
			for _, entry := range parsedLogs {
				t := entry.Timestamp.UTC()
				if t.Before(minTime) {
					minTime = t
				}
				if t.After(maxTime) {
					maxTime = t
				}
			}
			dateRange = minTime.Format("02/Jan/2006 15:04:05 UTC") + " - " + maxTime.Format("02/Jan/2006 15:04:05 UTC")
		}

		// Return success response
		c.JSON(http.StatusOK, gin.H{
			"message":       "File uploaded and parsed successfully",
			"filename":      filename,
			"parsed_count":  len(parsedLogs),
			"skipped_count": skippedCount,
			"session_id":    sessionID,
			"date_range":    dateRange,
		})
	})

	// Helper to parse query parameters (session_id, start_date, end_date)
	parseQueryParams := func(c *gin.Context) (*int, *time.Time, *time.Time) {
		sessionIDStr := c.Query("session_id")
		var sessionID *int
		if sessionIDStr != "" {
			if val, err := strconv.Atoi(sessionIDStr); err == nil {
				sessionID = &val
			}
		}

		var startDate *time.Time
		startStr := c.Query("start_date")
		if startStr != "" {
			if t, err := time.Parse(time.RFC3339, startStr); err == nil {
				tUTC := t.UTC()
				startDate = &tUTC
			} else if t, err := time.Parse("2006-01-02", startStr); err == nil {
				tUTC := t.UTC()
				startDate = &tUTC
			}
		}

		var endDate *time.Time
		endStr := c.Query("end_date")
		if endStr != "" {
			if t, err := time.Parse(time.RFC3339, endStr); err == nil {
				tUTC := t.UTC()
				endDate = &tUTC
			} else if t, err := time.Parse("2006-01-02", endStr); err == nil {
				tUTC := time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 999999999, time.UTC)
				endDate = &tUTC
			}
		}

		return sessionID, startDate, endDate
	}

	// Get Logs Endpoint
	router.GET("/api/logs", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		logs, err := database.GetLogs(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching logs:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
			return
		}

		c.JSON(http.StatusOK, logs)
	})

	// Get Sessions Endpoint
	router.GET("/api/sessions", middleware.AuthRequired(), func(c *gin.Context) {
		username := c.GetString("username")
		user, err := database.GetUserByUsername(username)
		if err != nil {
			log.Println("Error verifying user for sessions:", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user session"})
			return
		}

		sessions, err := database.GetSessions(user.ID)
		if err != nil {
			log.Println("Error fetching sessions:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sessions"})
			return
		}

		c.JSON(http.StatusOK, sessions)
	})

	// --------------------------------------------------------
	// AGGREGATION STATS ENDPOINTS
	// --------------------------------------------------------

	// Stats Overview Endpoint
	router.GET("/api/stats/overview", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		stats, err := database.GetStatsOverview(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching overview stats:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch overview stats"})
			return
		}
		c.JSON(http.StatusOK, stats)
	})

	// Traffic Over Time Endpoint
	router.GET("/api/stats/traffic", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		stats, err := database.GetTrafficStats(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching traffic stats:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch traffic stats"})
			return
		}
		c.JSON(http.StatusOK, stats)
	})

	// Top Endpoints Endpoint
	router.GET("/api/stats/top-endpoints", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		stats, err := database.GetTopEndpoints(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching top endpoints:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top endpoints"})
			return
		}
		c.JSON(http.StatusOK, stats)
	})

	// Top IPs Endpoint
	router.GET("/api/stats/top-ips", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		stats, err := database.GetTopIPs(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching top IPs:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top IPs"})
			return
		}
		c.JSON(http.StatusOK, stats)
	})

	// Status Codes Breakdown Endpoint
	router.GET("/api/stats/status-codes", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		stats, err := database.GetStatusCodesStats(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching status codes stats:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch status codes stats"})
			return
		}
		c.JSON(http.StatusOK, stats)
	})

	// Browser Breakdown Endpoint
	router.GET("/api/stats/browsers", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		stats, err := database.GetBrowsersStats(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching browser stats:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch browser stats"})
			return
		}
		c.JSON(http.StatusOK, stats)
	})

	// Geographic Stats Endpoint
	router.GET("/api/stats/geographic", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		stats, err := database.GetGeographicStats(sessionID, startDate, endDate)
		if err != nil {
			log.Println("Error fetching geographic stats:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch geographic stats"})
			return
		}
		c.JSON(http.StatusOK, stats)
	})

	// Error Logs with Pagination Endpoint
	router.GET("/api/logs/errors", middleware.AuthRequired(), func(c *gin.Context) {
		sessionID, startDate, endDate := parseQueryParams(c)

		limitStr := c.DefaultQuery("limit", "10")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			limit = 10
		}
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		logs, err := database.GetErrorLogs(sessionID, startDate, endDate, limit, offset)
		if err != nil {
			log.Println("Error fetching error logs:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch error logs"})
			return
		}
		c.JSON(http.StatusOK, logs)
	})

	// Start the server
	router.Run(":8080")
}
