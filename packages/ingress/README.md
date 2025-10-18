# Gemini Coop Backend

FastAPI backend with PostgreSQL 17 and Gemini AI integration - fully Dockerized.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Setup (3 steps)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 2. Start everything with Docker
docker compose up --build

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

MIT

---

**Need help?** Check `docker compose logs` or see the auto-generated API docs at `/docs`

FastAPI backend server for collaborative Gemini AI chat application with modular service architecture.

## Features

- 🔐 JWT-based authentication (register/login)
- 💬 Real-time chat via WebSocket
- 🤖 Gemini AI integration with streaming responses
- 👥 Multi-user chat rooms with shared AI context
- 📝 Persistent chat history
- 🔄 Invite users to chat rooms
- 🗄️ PostgreSQL database support for better performance
- 📦 Modular service-based architecture

## Architecture

### Modular Structure

```
packages/ingress/
├── shared/                      # Shared utilities & config
│   ├── config.py                # Centralized configuration
│   ├── database.py              # Database engine & session
│   └── utils.py                 # Common utilities
│
├── services/                    # Business logic services
│   ├── auth/                    # Authentication service
│   │   └── auth_service.py      # JWT, password hashing
│   │
│   ├── chat/                    # Chat management service
│   │   └── chat_service.py      # Chat CRUD operations
│   │
│   ├── database/                # Database models & schemas
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   └── schemas.py           # Pydantic validation
│   │
│   ├── gemini/                  # Gemini AI service
│   │   └── gemini_service.py    # AI generation & streaming
│   │
│   └── websocket/               # WebSocket service
│       └── websocket_manager.py # Real-time connections
│
└── server/
    └── main.py                  # FastAPI app & routes
```

### Services Overview

- **Auth Service** - User authentication, JWT tokens, password hashing
- **Chat Service** - Chat room & message management, participant handling
- **Gemini Service** - Gemini API integration with streaming responses
- **WebSocket Service** - Real-time connection & broadcast management
- **Database Service** - SQLAlchemy models and Pydantic schemas

### Database Models

- **User** - User accounts with authentication
- **Chat** - Chat rooms (private or group)
- **ChatParticipant** - Many-to-many relationship for chat members
- **Message** - Chat messages (user or bot)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Database (PostgreSQL recommended)
DATABASE_URL=postgresql://gemini_user:gemini_password@localhost:5432/gemini_coop

# Or use SQLite for development
# DATABASE_URL=sqlite:///./gemini_coop.db

# Authentication
SECRET_KEY=your-secret-jwt-key

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Setup Database

#### PostgreSQL with Docker (Recommended)

**Quick Start**: Use Docker Compose for PostgreSQL 17 + pgAdmin

```bash
# Start PostgreSQL 17 and pgAdmin
docker-compose up -d

# Check status
docker-compose ps

# View in pgAdmin: http://localhost:5050
# Login: admin@gemini.local / admin
```

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for complete Docker setup and pgAdmin configuration.

See [POSTGRESQL_SETUP.md](./POSTGRESQL_SETUP.md) for manual PostgreSQL installation.

#### SQLite (Development)

No setup required - database file will be created automatically.

```bash
DATABASE_URL=sqlite:///./gemini_coop.db
```

### 4. Run the Server

#### Using the Run Script (Recommended)

```bash
# Make script executable (first time only)
chmod +x run.sh

# Run the server
./run.sh
```

The script will:

- Check for `.env` file
- Activate virtual environment
- Install dependencies if needed
- Start uvicorn with auto-reload

#### Manual Start

```bash
# Activate virtual environment
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Run with uvicorn
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

#### Access the Server

- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **WebSocket**: ws://localhost:8000/ws
- **pgAdmin** (if using Docker): http://localhost:5050

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user info

### Chats

- `POST /api/chats` - Create new chat
- `GET /api/chats` - Get user's chats
- `GET /api/chats/{chat_id}` - Get chat details
- `POST /api/chats/{chat_id}/invite` - Invite user to chat
- `GET /api/chats/{chat_id}/messages` - Get chat messages
- `GET /api/chats/{chat_id}/participants` - Get chat participants

### WebSocket

- `WS /ws?token={jwt_token}` - WebSocket connection for real-time chat

## WebSocket Protocol

Connect: `ws://localhost:8000/ws?token={jwt_token}`

### Message Types

#### Join Chat

```json
{
  "type": "join",
  "chat_id": 1
}
```

#### Send Message

```json
{
  "type": "message",
  "chat_id": 1,
  "content": "Hello everyone!"
}
```

#### Bot Command

```json
{
  "type": "message",
  "chat_id": 1,
  "content": "/bot Explain quantum computing"
}
```

#### Typing Indicator

```json
{
  "type": "typing",
  "chat_id": 1
}
```

#### Leave Chat

```json
{
  "type": "leave",
  "chat_id": 1
}
```

### Received Messages

#### Regular Message

```json
{
  "type": "message",
  "chat_id": 1,
  "message_id": 123,
  "username": "john_doe",
  "content": "Hello!",
  "is_bot": false,
  "created_at": "2025-10-18T10:30:00"
}
```

#### Bot Stream (Chunk)

```json
{
  "type": "bot_stream",
  "chat_id": 1,
  "message_id": 124,
  "chunk": "Quantum computing is...",
  "is_complete": false
}
```

#### Bot Stream (Complete)

```json
{
  "type": "bot_stream",
  "chat_id": 1,
  "message_id": 124,
  "chunk": "",
  "is_complete": true,
  "full_response": "Complete response text..."
}
```

## Usage Flow

1. **Register/Login**

   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"john","email":"john@example.com","password":"password123"}'
   ```

2. **Create Chat**

   ```bash
   curl -X POST http://localhost:8000/api/chats \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"name":"My Chat","is_group":true}'
   ```

3. **Invite Friend**

   ```bash
   curl -X POST http://localhost:8000/api/chats/1/invite \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"username":"jane"}'
   ```

4. **Connect via WebSocket** and send messages with `/bot` command

## Development

### Run with hot reload

```bash
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### Code formatting

```bash
black server/
```

## Tech Stack

- **FastAPI** - Modern async web framework
- **SQLAlchemy** - ORM for database
- **SQLite** - Lightweight database (can use PostgreSQL)
- **WebSockets** - Real-time communication
- **Gemini API** - Google's AI model
- **JWT** - Authentication
- **Passlib** - Password hashing

## Database Schema

```
users
├── id (PK)
├── username (unique)
├── email (unique)
├── hashed_password
└── created_at

chats
├── id (PK)
├── name
├── owner_id (FK -> users.id)
├── is_group
└── created_at

chat_participants
├── id (PK)
├── chat_id (FK -> chats.id)
├── user_id (FK -> users.id)
└── joined_at

messages
├── id (PK)
├── chat_id (FK -> chats.id)
├── user_id (FK -> users.id, nullable)
├── content
├── is_bot
└── created_at
```

## Future Enhancements

- [ ] Message read receipts
- [ ] User presence (online/offline)
- [ ] File/image sharing
- [ ] Voice messages
- [ ] Webhooks for notifications
- [ ] Rate limiting
- [ ] Message reactions
- [ ] Chat search
- [ ] User profiles with avatars
- [ ] OAuth integration (Google, GitHub)
