package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kienpham07/GoLog/backend/utils"
)

// AuthRequired acts as a bouncer for protected routes
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Look for the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			return
		}

		// 2. Ensure it follows the "Bearer <token>" format
		parts := strings.Fields(authHeader)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			return
		}

		tokenString := parts[1]

		// 3. Parse and validate the token
		token, err := utils.ValidateToken(tokenString)

		// 4. If the token is invalid or expired, reject the request
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// 5. If everything is valid, pass the request to the actual endpoint
		c.Next()
	}
}
