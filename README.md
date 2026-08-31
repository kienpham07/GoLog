# GoLog — Real-Time Web Log Analyzer & Analytics Dashboard

[![Go](https://img.shields.io/badge/Go-1.26+-00ADD8?style=flat-square&logo=go&logoColor=white)](https://golang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**GoLog** is a full-stack, real-time web log ingestion, streaming, and analytics platform. Built with a high-performance **Go (Gin)** backend, **PostgreSQL** database, and a cyber-themed **Next.js (React / TypeScript / Tailwind CSS)** dashboard, GoLog enables developers and DevOps engineers to ingest external HTTP access logs, visualize traffic patterns, inspect error logs, detect suspicious IPs, and monitor live streaming requests in real time via WebSockets.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
  - [Manual Local Development](#manual-local-development)
- [Connecting External Websites (Live Ingestion)](#connecting-external-websites-live-ingestion)
  - [Integration Code Snippets](#integration-code-snippets)
- [Log File Upload & Formats](#log-file-upload--formats)
- [API Reference](#api-reference)
  - [Authentication & User Management](#authentication--user-management)
  - [Site Connection & Ingestion](#site-connection--ingestion)
  - [Logs & Real-Time Streaming](#logs--real-time-streaming)
  - [Analytics & Aggregation Statistics](#analytics--aggregation-statistics)
- [Environment Configuration](#environment-configuration)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

- **Live Real-Time Log Streaming**: Instant WebSocket broadcasting (`/api/logs/stream`) of external incoming HTTP requests directly into the Live Log Feed with pause, resume, and clear controls.
- **External Website Connection & Verification**:
  - API Key generated per site with persistent storage in PostgreSQL (`connected_sites`).
  - Interactive verification handshake test ping.
  - Dynamic status indicator displaying the active linked domain (e.g., `🟢 Live (http://localhost:5000)` vs `🔴 Offline`).
  - Strict ingestion gatekeeping that automatically drops unauthorized or disconnected payloads with `403 Forbidden`.
- **Interactive Analytics Dashboard**:
  - **KPI Stat Cards**: Real-time Total Requests, Unique Visitors, Error Rate (%), and Total Bandwidth transferred.
  - **Traffic Over Time**: Dynamic timeline chart supporting minute-by-minute streaming resolution and multi-day historical aggregations.
  - **Status Code Breakdown**: Interactive donut chart grouping requests by HTTP status classes (2xx, 3xx, 4xx, 5xx).
  - **Top Pages & Endpoints**: Hit count ranking of the most requested routes.
  - **Top Client IPs & Security Flags**: Heuristic detection tagging suspicious client IP addresses.
  - **Browser & User Agent Distribution**: Horizontal bar chart breaking down client browser types.
  - **Geographic World Map**: Interactive SVG world map visualizing traffic density by country with GeoIP lookups.
- **Dedicated Dashboard Views**:
  - **Dashboard Overview**: Comprehensive executive dashboard with stats, live feed, donut charts, and top tables.
  - **Traffic Over Time Analytics**: Granular timeline trends and hourly request volume distribution.
  - **Error Logs Inspector**: Dedicated 4xx/5xx error log explorer with search, HTTP status code filtering, and pagination.
  - **Geographic Map**: Full-screen global traffic map and country leaderboard.
- **Batch Log File Upload**: Multi-format parser supporting NCSA Common Log Format, Combined Log Format, and custom space-separated logs with per-upload session tracking.
- **Security & Multi-Tenancy**: Scoped JWT user authentication, bcrypt password hashing, CORS policies, and preflight handling.

---

## Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │          External Applications          │
                     │  (Express.js / Flask / Next.js / cURL)  │
                     └────────────────────┬────────────────────┘
                                          │ POST /api/ingest (X-API-Key)
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   GoLog Backend (Go/Gin)                              │
│                                                                                        │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌──────────────────────────┐  │
│  │   Auth & Ingestion    │   │     Gorilla WS Hub    │   │    GeoIP & Parsers       │  │
│  │   (JWT, Gatekeeper)   │   │   (Broadcast Channel) │   │ (Common/Combined/Custom) │  │
│  └───────────┬───────────┘   └───────────┬───────────┘   └────────────┬─────────────┘  │
└──────────────┼───────────────────────────┼────────────────────────────┼────────────────┘
               │ PostgreSQL                │ ws://.../stream            │ SQL Queries
               ▼                           ▼                            ▼
┌─────────────────────────────┐  ┌───────────────────────────────────────────────────────┐
│     PostgreSQL Database     │  │                GoLog Frontend (Next.js 14)            │
│  - users                    │  │  - React 18 / TypeScript / Tailwind CSS               │
│  - sessions                 │  │  - Recharts / React-Simple-Maps / Lucide Icons        │
│  - logs                     │  │  - Real-Time WebSocket Listener Hook                  │
│  - connected_sites          │  │  - Cyberpunk Dark Theme UI                            │
└─────────────────────────────┘  └───────────────────────────────────────────────────────┘
```

- **Backend**: Go 1.26+, Gin Web Framework, Gorilla WebSocket, Golang-JWT, `lib/pq` PostgreSQL driver.
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, React-Simple-Maps.
- **Database**: PostgreSQL 18 Alpine.
- **Orchestration**: Docker & Docker Compose.

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- (Optional for manual local setup) [Go 1.26+](https://golang.org/dl/) and [Node.js 26+](https://nodejs.org/)

### Running with Docker Compose (Recommended)

1. Clone the repository:
   ```sh
   git clone https://github.com/kienpham07/GoLog.git
   cd GoLog
   ```

2. Create your environment configuration file from the template:
   ```sh
   cp .env.example .env
   ```

3. Configure credentials in `.env`:
   ```env
   DB_USER=log_user
   DB_PASSWORD=your_secure_password
   DB_NAME=log_analyzer
   DB_SSLMODE=disable
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. Build and start all services:
   ```sh
   docker compose up --build -d
   ```

5. Access the application:
   - **GoLog Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Backend REST API**: [http://localhost:8080](http://localhost:8080)
   - **API Health Check**: [http://localhost:8080/ping](http://localhost:8080/ping)

---

### Manual Local Development

#### 1. Backend Setup

```sh
cd backend
go mod download

# Set environment variables and run
DB_HOST=localhost \
DB_PORT=5432 \
DB_USER=log_user \
DB_PASSWORD=your_secure_password \
DB_NAME=log_analyzer \
DB_SSLMODE=disable \
JWT_SECRET=your_super_secret_jwt_key \
go run ./cmd/main.go
```

#### 2. Frontend Setup

```sh
cd frontend
npm install
npm run dev
```

The frontend will run on [http://localhost:3000](http://localhost:3000).

---

## Connecting External Websites (Live Ingestion)

GoLog allows any external web application to stream request logs into your dashboard in real time.

1. Open the dashboard at [http://localhost:3000](http://localhost:3000) and log in.
2. Click **Connect Website** in the top control bar.
3. Enter your external website domain (e.g. `http://localhost:5000` or `https://myapp.com`).
4. Copy the generated API Key (e.g. `golog_live_key_...`).
5. Click **Save Target Configuration** or **Send Verification Ping**.
6. Integrate the snippet into your web application middleware.

### Integration Code Snippets

#### Node.js / Express Middleware

```javascript
const GOLOG_INGEST_URL = "http://localhost:8080/api/ingest";
const GOLOG_API_KEY = "YOUR_GOLOG_API_KEY";

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    // Exclude static assets
    if (req.path.startsWith("/static") || req.path.startsWith("/favicon")) return;

    fetch(GOLOG_INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": GOLOG_API_KEY,
      },
      body: JSON.stringify({
        ip: req.ip || req.socket.remoteAddress || "127.0.0.1",
        method: req.method,
        endpoint: req.originalUrl,
        status: res.statusCode,
        response_time: Date.now() - start,
      }),
    }).catch((err) => console.error("GoLog ingestion error:", err.message));
  });

  next();
});
```

#### Python / Flask Hook

```python
import time
import requests
from flask import Flask, request, g

app = Flask(__name__)
GOLOG_INGEST_URL = "http://localhost:8080/api/ingest"
GOLOG_API_KEY = "YOUR_GOLOG_API_KEY"

@app.before_request
def start_timer():
    g.start = time.time()

@app.after_request
def send_golog_analytics(response):
    duration = int((time.time() - g.start) * 1000)
    payload = {
        "ip": request.remote_addr or "127.0.0.1",
        "method": request.method,
        "endpoint": request.path,
        "status": response.status_code,
        "response_time": duration
    }
    try:
        requests.post(
            GOLOG_INGEST_URL,
            json=payload,
            headers={"X-API-Key": GOLOG_API_KEY},
            timeout=1
        )
    except Exception:
        pass
    return response
```

#### cURL Test Command

```sh
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_GOLOG_API_KEY" \
  -d '{
    "ip": "203.0.113.195",
    "method": "GET",
    "endpoint": "/api/v1/products",
    "status": 200,
    "response_time": 32,
    "bytes": 1024
  }'
```

---

## Log File Upload & Formats

GoLog supports uploading raw access log files (up to 8 MB) through the **Upload Log** modal.

Supported formats:
1. **Common Log Format (CLF / NCSA / Apache / Nginx)**:
   ```txt
   127.0.0.1 - frank [10/Oct/2026:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
   ```
2. **Combined Log Format**:
   ```txt
   192.168.1.10 - - [10/Oct/2026:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 1024 "https://google.com" "Mozilla/5.0"
   ```
3. **Custom Simplified Format**:
   ```txt
   127.0.0.1 - GET /api/login 200
   10.0.0.5 - POST /checkout 500
   ```

---

## API Reference

### Authentication & User Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/ping` | None | Health check endpoint returning `{"message":"pong"}`. |
| `POST` | `/api/register` | None | Register a new user (`username`, `password`). |
| `POST` | `/api/login` | None | Authenticate user and receive a JWT bearer token. |

### Site Connection & Ingestion

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/site/config` | Bearer JWT | Retrieve the active connected website configuration and API key. |
| `POST` | `/api/site/connect` | Bearer JWT | Save target domain and link/activate API key. |
| `POST` | `/api/site/disconnect`| Bearer JWT | Disconnect website, deactivating ingestion. |
| `POST` | `/api/ingest` | `X-API-Key` | External log ingestion endpoint with gatekeeping and live broadcasting. |
| `OPTIONS`| `/api/ingest` | None | CORS preflight handler. |

### Logs & Real-Time Streaming

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/logs/stream` | None | Gorilla WebSocket endpoint for live log streaming. |
| `GET` | `/api/logs` | Bearer JWT | Retrieve paginated log entries with filters (`session_id`, `start_date`, `end_date`). |
| `GET` | `/api/logs/recent` | Bearer JWT | Fetch the newest 100 log entries for dashboard hydration. |
| `GET` | `/api/logs/errors` | Bearer JWT | Retrieve filtered 4xx and 5xx error log records with offset pagination. |
| `POST` | `/api/upload` | Bearer JWT | Upload and parse `.log` files (`multipart/form-data`). |
| `GET` | `/api/sessions` | Bearer JWT | Retrieve all file upload sessions for the authenticated user. |

### Analytics & Aggregation Statistics

All analytics endpoints accept query filters: `session_id`, `start_date`, and `end_date`.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats/overview` | Bearer JWT | Total requests, unique IPs, error rate, and bandwidth. |
| `GET` | `/api/stats/traffic` | Bearer JWT | Traffic over time aggregated by timestamp/hour. |
| `GET` | `/api/stats/status-codes`| Bearer JWT | Breakdown count per HTTP status code. |
| `GET` | `/api/stats/top-endpoints`| Bearer JWT | Top requested paths ranked by hit count. |
| `GET` | `/api/stats/top-ips` | Bearer JWT | Top client IP addresses with security classification. |
| `GET` | `/api/stats/browsers` | Bearer JWT | Distribution of user agents and browser engines. |
| `GET` | `/api/stats/geographic` | Bearer JWT | Country distribution and coordinates for map visualization. |

---

## Environment Configuration

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `db` | PostgreSQL host address. |
| `DB_PORT` | `5432` | PostgreSQL port number. |
| `DB_USER` | `log_user` | PostgreSQL database user. |
| `DB_PASSWORD` | `your_secure_password` | PostgreSQL database password. |
| `DB_NAME` | `log_analyzer` | PostgreSQL database name. |
| `DB_SSLMODE` | `disable` | PostgreSQL SSL connection mode. |
| `JWT_SECRET` | `secret` | Secret key used for signing and validating JWTs. |
| `NEXT_PUBLIC_API_URL`| `http://localhost:8080`| Base URL for backend API requests from frontend. |

---

## Maintainers

- **Kien Pham** — [@kienpham07](https://github.com/kienpham07)

---

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository and create your feature branch: `git checkout -b feature/my-feature`.
2. Commit your changes with clear messages.
3. Test both backend Go tests and Next.js frontend builds before pushing.
4. Submit a Pull Request.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
