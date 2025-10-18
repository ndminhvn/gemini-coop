# Gemini Coop - Backend (Ingress)

FastAPI backend server for collaborative Gemini AI chat application.

## Features

- 🔐 JWT-based authentication (register/login)
- 💬 Real-time chat via WebSocket
- 🤖 Gemini AI integration with streaming responses
- 👥 Multi-user chat rooms with shared AI context
- 📝 Persistent chat history
- 🔄 Invite users to chat rooms

## Architecture

### Services

- **Auth Service** (`auth.py`) - User authentication & JWT tokens
- **Chat Service** (`chat_service.py`) - Chat room & message management
- **Gemini Service** (`gemini_service.py`) - Gemini API integration with streaming
- **WebSocket Manager** (`websocket_manager.py`) - Real-time connection management

### Database Models

- **User** - User accounts
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

```
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your-secret-jwt-key
DATABASE_URL=sqlite:///./gemini_coop.db
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 3. Run Server

```bash
python -m server.main
```

Server will start on `http://localhost:8000`

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
