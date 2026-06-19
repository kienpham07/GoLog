# GoLog Web Log Analyzer

A full-stack web log analyzer for uploading, parsing, storing, and visualizing HTTP access logs.

GoLog combines a Go/Gin API, PostgreSQL persistence, JWT authentication, and a Next.js dashboard. It parses simple log lines, stores valid entries, and displays searchable log data with charts for request methods and status-code distribution.

This repository contains:

1. A Go backend API for authentication, file upload, log parsing, and log retrieval.
2. A PostgreSQL database schema initialized by the backend on startup.
3. A Next.js frontend dashboard with login, registration, filtering, tables, and charts.
4. Docker configuration for running the full stack locally.

## Table of Contents

- [GoLog Web Log Analyzer](#golog-web-log-analyzer)
  - [Table of Contents](#table-of-contents)
  - [Background](#background)
  - [Install](#install)
  - [Usage](#usage)
    - [Log Format](#log-format)
    - [API Endpoints](#api-endpoints)
    - [Local Development](#local-development)
  - [Configuration](#configuration)
  - [Maintainers](#maintainers)
  - [Contributing](#contributing)
  - [License](#license)

## Background

Web server logs are useful for understanding traffic patterns, failed requests, and endpoint usage, but raw log files are hard to scan manually. GoLog provides a small analytics workflow:

1. Register or log in from the frontend.
2. Upload log files through the backend API.
3. Parse log lines into structured records.
4. Store parsed entries in PostgreSQL.
5. View the latest logs in a dashboard with search, status filtering, and charts.

The backend accepts log entries matching this pattern:

```txt
IP - METHOD ENDPOINT STATUS
```

For example:

```txt
127.0.0.1 - GET /login 404
192.168.1.10 - POST /api/users 200
```

Invalid lines are ignored by the parser.

## Install

The recommended local setup uses Docker Compose.

Requirements:

- Docker
- Docker Compose

Create a local environment file from the example:

```sh
cp .env.example .env
```

Update the placeholder values in `.env`, especially `DB_PASSWORD` and `JWT_SECRET`.

Start the full stack:

```sh
docker compose up --build
```

The services will be available at:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8080>
- Health check: <http://localhost:8080/ping>

## Usage

Open <http://localhost:3000>, create an account, then sign in. The dashboard fetches the newest 100 stored log entries and shows:

- A searchable log table.
- A status-code filter.
- A bar chart of requests by HTTP method.
- A pie chart of status-code distribution.

### Log Format

Uploaded files should contain one log entry per line:

```txt
127.0.0.1 - GET /home 200
127.0.0.1 - POST /login 200
10.0.0.5 - GET /missing-page 404
```

The parser extracts:

- `ip`
- `method`
- `endpoint`
- `status`

The backend limits uploaded files to 8 MB.

### API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/ping` | Health check endpoint. |
| `POST` | `/api/register` | Create a user account. |
| `POST` | `/api/login` | Authenticate and receive a JWT. |
| `POST` | `/api/upload` | Upload and parse a log file using multipart form field `file`. |
| `GET` | `/api/logs` | Return the newest 100 log entries. Requires `Authorization: Bearer <token>`. |

Example login request:

```sh
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

Example upload request:

```sh
curl -X POST http://localhost:8080/api/upload \
  -F "file=@sample.log"
```

Example protected log request:

```sh
curl http://localhost:8080/api/logs \
  -H "Authorization: Bearer <token>"
```

### Local Development

You can also run the frontend and backend separately.

Backend requirements:

- Go 1.26.4
- PostgreSQL

Run the backend:

```sh
cd backend
go mod download
DB_HOST=localhost \
DB_PORT=5432 \
DB_USER=name_user \
DB_PASSWORD=change_me \
DB_NAME=name_analyzer \
DB_SSLMODE=disable \
JWT_SECRET=secret_key \
go run ./cmd/main.go
```

Frontend requirements:

- Node.js 26
- npm

Run the frontend:

```sh
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` if the backend is not running at `http://localhost:8080`.

## Configuration

The root `.env.example` file documents the variables used by Docker Compose:

| Variable | Description |
| --- | --- |
| `DB_USER` | PostgreSQL username. |
| `DB_PASSWORD` | PostgreSQL password. |
| `DB_NAME` | PostgreSQL database name. |
| `DB_SSLMODE` | PostgreSQL SSL mode. Defaults to `disable` in Docker. |
| `JWT_SECRET` | Secret used to sign JWT access tokens. |

The frontend also supports:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL for the backend API. Defaults to `http://localhost:8080`. |

## Maintainers

[@kienpham07](https://github.com/kienpham07)

## Contributing

Feel free to open an issue or submit a pull request. Keep changes focused, update documentation when behavior changes, and test the affected backend or frontend workflow before submitting.

## License

No license file is currently included in this repository.
