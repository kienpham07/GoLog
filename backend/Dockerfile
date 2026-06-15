# Step 1: Build the Go executable using the official Go image
FROM golang:1.26-alpine AS builder
WORKDIR /app

# Copy dependency files and download them
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the code and build it
COPY . .
RUN go build -o main ./cmd/main.go

# Step 2: Create a tiny, clean image to actually run the app
FROM alpine:latest
WORKDIR /app

# Copy the compiled binary from the builder stage to Alpine
COPY --from=builder /app/main .

# Create the uploads folder so the server doesn't crash when receiving files
RUN mkdir uploads

# Expose the API port
EXPOSE 8080

# Run the executable
CMD ["./main"]