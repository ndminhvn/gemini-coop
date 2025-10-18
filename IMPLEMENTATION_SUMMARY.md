# Gemini Coop - Implementation Summary

## Overview

A collaborative chat application where multiple users can interact with the same Gemini AI bot while sharing the same conversation context. Built with FastAPI backend and designed to integrate with a Next.js frontend.

## Architecture

### Backend Structure

```
packages/ingress/
├── server/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, routes, WebSocket endpoint
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models (User, Chat, Message, etc.)
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── auth.py              # Authentication service (JWT, password hashing)
│   ├── chat_service.py      # Chat & message management
│   ├── gemini_service.py    # Gemini API integration with streaming
│   └── websocket_manager.py # WebSocket connection management
├── gemini/
│   └── gemini.py            # Original Gemini test script
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
├── README.md               # Backend documentation
├── test_api.py             # REST API test script
└── test_websocket.py       # WebSocket test script
```

## Key Features Implemented

### ✅ Authentication System

- User registration with username, email, password
- Login with JWT token generation
- Password hashing with bcrypt
- Token-based authentication for all protected routes
- Token validation for WebSocket connections

### ✅ Chat Management

- Create private or group chats
- Invite users to chats by username
- List all user's chats
- Get chat participants
- Persistent chat history

### ✅ Real-Time Messaging (WebSocket)

- Real-time message broadcasting to all chat participants
- User join/leave notifications
- Typing indicators
- Connection management per chat room

### ✅ Gemini AI Integration

- Streaming responses from Gemini API
- Chat history context preserved for coherent conversations
- `/bot <message>` command to interact with AI
- Real-time streaming to all participants in the chat
- Multiple users can see the same AI responses

### ✅ Database Layer

- SQLAlchemy ORM with SQLite (easily switchable to PostgreSQL)
- User, Chat, ChatParticipant, Message models
- Automatic table creation on startup
- Proper relationships and foreign keys

## How It Works

### 1. User Flow

```
1. User registers/logs in → receives JWT token
2. Creates or joins a chat room
3. Connects via WebSocket with token
4. Sends "join" message to enter chat room
5. Sends messages (regular or bot commands)
6. Receives real-time updates from other users and bot
```

### 2. Bot Command Flow

```
1. User sends: "/bot Explain AI"
2. Server extracts message, saves to DB
3. Broadcasts user message to all participants
4. Fetches chat history for context (last 20 messages)
5. Calls Gemini API with history
6. Streams response chunks to all participants in real-time
7. Saves complete bot response to DB
```

### 3. Message Broadcasting

```
User A → WebSocket → Server → Database
                       ↓
                  Broadcast
                  ↙   ↓   ↘
            User A  User B  User C
```

## WebSocket Protocol

### Client → Server Messages

**Join Chat:**

```json
{ "type": "join", "chat_id": 1 }
```

**Send Message:**

```json
{ "type": "message", "chat_id": 1, "content": "Hello!" }
```

**Bot Command:**

```json
{ "type": "message", "chat_id": 1, "content": "/bot Explain quantum computing" }
```

**Typing Indicator:**

```json
{ "type": "typing", "chat_id": 1 }
```

**Leave Chat:**

```json
{ "type": "leave", "chat_id": 1 }
```

### Server → Client Messages

**Regular Message:**

```json
{
  "type": "message",
  "chat_id": 1,
  "message_id": 123,
  "username": "john",
  "content": "Hello!",
  "is_bot": false,
  "created_at": "2025-10-18T10:30:00"
}
```

**Bot Streaming (chunks):**

```json
{
  "type": "bot_stream",
  "chat_id": 1,
  "message_id": 124,
  "chunk": "Quantum computing uses quantum bits...",
  "is_complete": false
}
```

**Bot Streaming (complete):**

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

**User Joined:**

```json
{ "type": "user_joined", "chat_id": 1, "username": "jane" }
```

**User Left:**

```json
{ "type": "user_left", "chat_id": 1, "username": "jane" }
```

**Typing:**

```json
{ "type": "typing", "chat_id": 1, "username": "john" }
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user (requires auth)

### Chats

- `POST /api/chats` - Create chat
- `GET /api/chats` - Get user's chats
- `GET /api/chats/{id}` - Get chat details
- `POST /api/chats/{id}/invite` - Invite user
- `GET /api/chats/{id}/messages` - Get messages
- `GET /api/chats/{id}/participants` - Get participants

### Health

- `GET /health` - Health check

### WebSocket

- `WS /ws?token={jwt}` - Real-time chat connection

## Database Schema

```sql
users
- id (PK)
- username (unique)
- email (unique)
- hashed_password
- created_at

chats
- id (PK)
- name (optional)
- owner_id (FK)
- is_group
- created_at

chat_participants (junction table)
- id (PK)
- chat_id (FK)
- user_id (FK)
- joined_at

messages
- id (PK)
- chat_id (FK)
- user_id (FK, nullable for bot)
- content
- is_bot
- created_at
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd packages/ingress
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run Server

```bash
python -m server.main
```

Server starts on `http://localhost:8000`

### 4. Test API

```bash
# Test REST endpoints
python test_api.py

# Test WebSocket (use token and chat_id from previous test)
python test_websocket.py <token> <chat_id>
```

## Frontend Integration Guide

### 1. Authentication Flow

```typescript
// Register
const response = await fetch("http://localhost:8000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, email, password }),
});

// Login
const { access_token } = await fetch("http://localhost:8000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
}).then((r) => r.json());

// Store token in localStorage or state management
```

### 2. WebSocket Connection

```typescript
const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);

ws.onopen = () => {
  // Join chat
  ws.send(JSON.stringify({ type: "join", chat_id: chatId }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "message") {
    // Add message to UI
  } else if (data.type === "bot_stream") {
    if (data.is_complete) {
      // Bot finished streaming
    } else {
      // Append chunk to bot message
    }
  }
};

// Send message
ws.send(
  JSON.stringify({
    type: "message",
    chat_id: chatId,
    content: message,
  })
);

// Send bot command
ws.send(
  JSON.stringify({
    type: "message",
    chat_id: chatId,
    content: `/bot ${userMessage}`,
  })
);
```

### 3. Chat List

```typescript
const chats = await fetch("http://localhost:8000/api/chats", {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());
```

### 4. Message History

```typescript
const messages = await fetch(
  `http://localhost:8000/api/chats/${chatId}/messages`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
).then((r) => r.json());
```

## Next Steps

### Backend Enhancements

- [ ] Add rate limiting
- [ ] Implement message pagination
- [ ] Add file upload support
- [ ] Webhooks for notifications
- [ ] User presence (online/offline)
- [ ] Message read receipts
- [ ] Search functionality
- [ ] User profiles with avatars

### Frontend Tasks

1. Create authentication pages (login/register)
2. Implement chat list view (like Messenger)
3. Build chat interface with message history
4. Add WebSocket connection management
5. Implement real-time message updates
6. Handle bot streaming responses
7. Add user invite functionality
8. Create typing indicators
9. Add notification system

### Production Considerations

- Use PostgreSQL instead of SQLite
- Add proper error handling and logging
- Implement rate limiting
- Use environment-specific configs
- Add HTTPS/WSS for production
- Implement proper CORS policies
- Add monitoring and analytics
- Set up CI/CD pipeline

## Testing the Implementation

1. **Start Server:**

   ```bash
   python -m server.main
   ```

2. **Test REST API:**

   ```bash
   python test_api.py
   ```

3. **Test WebSocket:**

   ```bash
   # Use token and chat_id from previous test
   python test_websocket.py <token> <chat_id>
   ```

4. **Test Bot Command:**
   - Connect via WebSocket
   - Send: `{"type": "message", "chat_id": 1, "content": "/bot Hello"}`
   - Watch streaming response

## Troubleshooting

### Common Issues

1. **Import errors:** Run `pip install -r requirements.txt`
2. **Gemini API errors:** Check your GEMINI_API_KEY in .env
3. **WebSocket connection fails:** Ensure valid JWT token
4. **Database errors:** Delete `gemini_coop.db` and restart server

### Debug Mode

```bash
# Run with auto-reload for development
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

## Security Notes

- JWT tokens expire after 24 hours
- Passwords are hashed with bcrypt
- WebSocket connections require valid JWT
- Users can only access chats they're participants in
- Change SECRET_KEY in production!

## Performance Considerations

- WebSocket connections are persistent
- Bot responses stream in real-time
- Message history limited to 20 messages for Gemini context
- Chat history queries limited to 50 messages by default
- SQLite suitable for development, use PostgreSQL for production

---

**Status:** ✅ Backend fully implemented and ready for frontend integration!
