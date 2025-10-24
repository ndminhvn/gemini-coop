# Gemini Coop Backend

FastAPI backend with PostgreSQL 17 and Gemini AI integration - fully Dockerized.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- Gemini API key ([Get one here](https://ai.google.dev/gemini-api/docs))

### Setup (3 steps)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 2. Start everything with Docker
docker compose up --build -d

# 3. Done! Access at http://localhost:8000/docs
```

## 📍 Access Points

- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Database** (for pgAdmin):
  - Host: `localhost`
  - Port: `5433`
  - Database: `gemini_coop`
  - User: `gemini_user`
  - Password: `gemini_password`

## 🐳 Docker Commands

```bash
# Start (foreground, with logs)
docker compose up

# Start in background
docker compose up -d

# Rebuild after changes
docker compose up --build

# View logs
docker compose logs -f
docker compose logs backend
docker compose logs postgres

# Stop
docker compose down

# Stop and remove data (⚠️ deletes database)
docker compose down -v

# Restart a service
docker compose restart backend
```

## 🛠️ Development

### Hot Reload

Code changes in `server/`, `services/`, and `shared/` are automatically detected and reloaded.

### Running Tests

```bash
# Inside container
docker compose exec backend python test_api.py
docker compose exec backend python test_websocket.py
```

### Database Access

```bash
# Connect with psql
docker compose exec postgres psql -U gemini_user -d gemini_coop

# Or use pgAdmin with the credentials above
```

## 📁 Project Structure

```
ingress/
├── docker-compose.yml    # Orchestrates backend + database
├── Dockerfile           # Backend container image
├── .env                 # Your config (create from .env.example)
│
├── server/              # FastAPI app
│   └── main.py          # API routes
│
├── services/            # Business logic
│   ├── auth/            # Authentication
│   ├── chat/            # Chat management
│   ├── database/        # Models & schemas
│   ├── gemini/          # AI integration
│   └── websocket/       # Real-time messaging
│
└── shared/              # Shared utilities
    ├── config.py        # Configuration
    ├── database.py      # DB connection
    └── utils.py         # Helpers
```

## 🌟 Features

- ✅ JWT Authentication
- ✅ Real-time WebSocket chat
- ✅ Gemini AI streaming (`/bot` command)
- ✅ Multi-user chat rooms
- ✅ Persistent PostgreSQL database
- ✅ One-command Docker setup
- ✅ Auto-generated API docs
- ✅ Hot reload for development

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (get JWT)
- `GET /api/auth/me` - Current user

### Chats

- `POST /api/chats` - Create chat
- `GET /api/chats` - List user's chats
- `GET /api/chats/{id}` - Chat details
- `POST /api/chats/{id}/invite` - Invite user
- `GET /api/chats/{id}/messages` - Chat messages
- `GET /api/chats/{id}/participants` - Chat members

### WebSocket

- `WS /ws?token={jwt}` - Real-time connection

## 🔧 Configuration

Edit `.env` file:

```bash
# Required
GEMINI_API_KEY=your-key-here

# Optional (defaults provided)
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🐛 Troubleshooting

### Port conflicts

Edit `docker-compose.yml`:

```yaml
backend:
  ports:
    - "8001:8000" # Change to different port

postgres:
  ports:
    - "5434:5432" # Change to different port
```

### Can't connect to database

```bash
docker compose down -v
docker compose up --build
```

### Code changes not reflecting

```bash
docker compose up --build backend
```

## 👥 Team Setup

Share with your team:

1. Clone repo
2. `cp .env.example .env` and add `GEMINI_API_KEY`
3. `docker compose up --build`

That's it! Everything else (PostgreSQL setup, user creation, etc.) is automatic.

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](../../LICENSE) file for details.

---

**Need help?** Check `docker compose logs` or see the auto-generated API docs at `/docs`
