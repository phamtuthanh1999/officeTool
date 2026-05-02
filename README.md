# APP_MAIN — Production-Ready Node.js REST API

A **Node.js + Express + MySQL** REST API architected for production workloads:
high concurrency via **clustering**, **connection pooling**, **rate limiting**, **JWT auth**, and centralized logging.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MySQL 8 (via `mysql2` connection pool) |
| Auth | JWT (access + refresh tokens) |
| Validation | Joi |
| Logging | Winston + daily-rotate-file |
| Security | Helmet, CORS, express-rate-limit |
| Clustering | Node.js built-in `cluster` module |
| CI/CD | GitHub Actions |
| Code quality | ESLint (airbnb-base) + Prettier |

---

## Project Structure

```
APP_MAIN/
├── cluster.js                  # Entry point — forks workers per CPU core
├── src/
│   ├── app.js                  # Express app (middleware, routes, error handler)
│   ├── config/
│   │   ├── env.js              # Environment variable validation (Joi)
│   │   ├── database.js         # MySQL connection pool
│   │   └── logger.js           # Winston logger
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── error.middleware.js     # Centralized error handler
│   │   ├── rateLimiter.middleware.js
│   │   └── security.middleware.js  # Helmet, CORS, compression
│   ├── modules/
│   │   ├── auth/               # Register & Login
│   │   ├── users/              # User CRUD
│   │   └── tasks/              # Task CRUD
│   ├── routes/
│   │   └── index.js            # Aggregates all module routes
│   └── utils/
│       ├── AppError.js         # Custom operational error class
│       ├── catchAsync.js       # Async error wrapper
│       └── response.js         # Standardised JSON responses
├── database/
│   └── migrations/             # Raw SQL migration files
├── logs/                       # Auto-created at runtime
├── .env.example
├── .eslintrc.js
├── .prettierrc
└── .github/workflows/ci.yml
```

---

## Quick Start — Local Development

### 1. Prerequisites

- Node.js ≥ 18
- MySQL 8 running locally

### 2. Clone & install

```bash
git clone <repo-url>
cd APP_MAIN
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set DB credentials and strong JWT secrets (≥ 32 chars)
```

### 4. Run database migrations

```bash
mysql -u root -p your_database < database/migrations/001_create_users_table.sql
mysql -u root -p your_database < database/migrations/002_create_tasks_table.sql
```

### 5. Start development server

```bash
npm run dev       # Uses nodemon, single process
```

---

## Production Deployment

```bash
npm start         # Launches cluster.js — one worker per CPU core
```

### With PM2 (recommended)

```bash
npm install -g pm2
pm2 start cluster.js --name app-main
pm2 save
pm2 startup       # Configure auto-restart on reboot
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Server health & uptime |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | None | Register new user |
| POST | `/api/v1/auth/login` | None | Login, returns tokens |

**Register body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

**Response (both):**
```json
{
  "status": "success",
  "data": {
    "tokens": {
      "accessToken": "<jwt>",
      "refreshToken": "<jwt>"
    }
  }
}
```

### Users *(requires `Authorization: Bearer <accessToken>`)*

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/v1/users` | admin | List all users |
| GET | `/api/v1/users/:id` | any | Get user by ID |
| PATCH | `/api/v1/users/me` | any | Update own profile |
| DELETE | `/api/v1/users/:id` | self / admin | Delete user |

### Tasks *(requires `Authorization: Bearer <accessToken>`)*

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/tasks` | List own tasks (`?page=1&limit=20&status=pending`) |
| GET | `/api/v1/tasks/:id` | Get task |
| POST | `/api/v1/tasks` | Create task |
| PATCH | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |

**Create/Update task body:**
```json
{
  "title": "Write unit tests",
  "description": "Cover all service methods",
  "status": "pending",
  "due_date": "2026-05-15T00:00:00Z"
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `PORT` | No | `3000` | HTTP listen port |
| `DB_HOST` | **Yes** | — | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | **Yes** | — | MySQL user |
| `DB_PASSWORD` | **Yes** | — | MySQL password |
| `DB_NAME` | **Yes** | — | MySQL database name |
| `DB_CONNECTION_LIMIT` | No | `10` | Pool connection limit |
| `JWT_SECRET` | **Yes** | — | ≥ 32 chars |
| `JWT_EXPIRES_IN` | No | `1d` | Access token TTL |
| `JWT_REFRESH_SECRET` | **Yes** | — | ≥ 32 chars |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate-limit window (ms) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |

---

## Code Quality

```bash
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix ESLint issues
npm run format        # Prettier format
```

---

## Security Highlights

- **Helmet** — sets secure HTTP headers
- **Rate limiting** — global (100 req/15 min) + strict auth (10 req/15 min)
- **bcryptjs** — passwords hashed with cost factor 12
- **JWT** — short-lived access tokens (1d) + refresh tokens (7d)
- **Joi validation** — all request bodies validated before processing
- **Parameterised queries** — prevents SQL injection via `mysql2` placeholders
- **Body size limit** — 10 KB max to prevent payload attacks
