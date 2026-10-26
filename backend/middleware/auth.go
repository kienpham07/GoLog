package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kienpham07/GoLog/backend/database"
	"github.com/kienpham07/GoLog/backend/utils"
)

// AuthRequired acts as a bouncer for protected routes
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Look for the Authorization header or token query parameter
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader != "" {
			parts := strings.Fields(authHeader)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				tokenString = parts[1]
			}
		}

		if tokenString == "" {
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header or token parameter missing"})
			return
		}

		// 3. Parse and validate the token
		token, err := utils.ValidateToken(tokenString)

		// 4. If the token is invalid or expired, reject the request
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// 4.5 Store username and verify user exists in database
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if username, ok := claims["username"].(string); ok {
				user, err := database.GetUserByUsername(username)
				if err != nil || user == nil {
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User does not exist or session expired. Please log in again."})
					return
				}
				c.Set("username", username)
				c.Set("user_id", user.ID)
			}
		}

		// 5. If everything is valid, pass the request to the actual endpoint
		c.Next()
	}
}

