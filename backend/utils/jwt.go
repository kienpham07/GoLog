package utils

import (
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey []byte

// InitJWT ensures the JWT_SECRET is set and meets security requirements.
func InitJWT() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	if len(secret) < 32 {
		log.Println("Warning: JWT_SECRET is shorter than 32 characters. Consider using a stronger secret.")
	}
	secretKey = []byte(secret)
}

// GenerateToken creates a JWT containing the username and an expiration time
func GenerateToken(username string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	})

	// Sign the token with our secret key
	return token.SignedString(secretKey)
}

// ValidateToken parses and validates a JWT signed by this application.
func ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 { // Ensure the signing method matches
			return nil, jwt.ErrSignatureInvalid
		}
		return secretKey, nil
	})
}
