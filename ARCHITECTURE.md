# Gemini Coop - System Architecture

## High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Next.js        │◄───────►│  FastAPI         │◄───────►│  Gemini API     │
│  Frontend       │  HTTP/  │  Backend         │  HTTPS  │  (Google)       │
│                 │  WS     │  (Ingress)       │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     │
                                     ▼
                            ┌──────────────────┐
                            │                  │
                            │  SQLite/         │
                            │  PostgreSQL      │
                            │  Database        │
                            │                  │
                            └──────────────────┘
```

## Backend Architecture (FastAPI)

```
┌────────────────────────────────────────────────────────────────┐
│                         FastAPI Server                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │              │  │              │  │              │        │
│  │  Auth        │  │  Chat        │  │  Gemini      │        │
│  │  Service     │  │  Service     │  │  Service     │        │
│  │              │  │              │  │              │        │
│  │ - Register   │  │ - Create     │  │ - Stream     │        │
│  │ - Login      │  │ - Invite     │  │ - Context    │        │
│  │ - JWT        │  │ - Messages   │  │ - Generate   │        │
│  │              │  │              │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                        │     │
│  │           WebSocket Manager                            │     │
│  │                                                        │     │
│  │  - Connection Management                               │     │
│  │  - Chat Rooms                                          │     │
│  │  - Broadcasting                                        │     │
│  │  - Streaming to Multiple Users                         │     │
│  │                                                        │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                        │     │
│  │           Database Layer (SQLAlchemy)                  │     │
│  │                                                        │     │
│  │  Models: User, Chat, ChatParticipant, Message         │     │
│  │                                                        │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication Flow

```
User
  │
  ├─► POST /api/auth/register
  │     │
  │     ├─► Hash password
  │     ├─► Save to DB
  │     └─► Return user info
  │
  └─► POST /api/auth/login
        │
        ├─► Verify password
        ├─► Generate JWT token
        └─► Return token
```

### 2. Chat Creation Flow

```
User (with JWT)
  │
  └─► POST /api/chats
        │
        ├─► Validate token
        ├─► Create chat in DB
        ├─► Add user as participant
        └─► Return chat info
```

### 3. Real-Time Messaging Flow

```
User A                    Server                     User B, C, D
  │                          │                            │
  ├─► Connect WebSocket      │                            │
  │   (with JWT token)       │                            │
  │                          │                            │
  ├─► Send "join" message    │                            │
  │   {"type":"join",        │                            │
  │    "chat_id":1}          │                            │
  │                          │                            │
  │                          ├─► Add to chat room         │
  │                          │                            │
  ├─► Send message           │                            │
  │   {"type":"message",     │                            │
  │    "content":"Hello"}    │                            │
  │                          │                            │
  │                          ├─► Save to DB               │
  │                          │                            │
  │                          ├─► Broadcast ──────────────►│
  │                          │                            │
  │◄─────────────────────────┘                            │
  │   Receive message                                     │
  │                                                        │
  │                                                   Receive message
```

### 4. Bot Command Flow

```
User A                    Server                    Gemini API         Users B, C
  │                          │                            │                │
  ├─► Send bot command       │                            │                │
  │   "/bot Explain AI"      │                            │                │
  │                          │                            │                │
  │                          ├─► Parse command            │                │
  │                          ├─► Save user msg to DB      │                │
  │                          ├─► Broadcast user msg ──────┼───────────────►│
  │                          │                            │                │
  │                          ├─► Get chat history         │                │
  │                          ├─► Build context            │                │
  │                          │                            │                │
  │                          ├─► Request streaming ──────►│                │
  │                          │                            │                │
  │                          │◄─── Stream chunk 1 ────────┤                │
  │◄─────────────────────────┤                            │                │
  │   "AI is..."             ├─► Broadcast ──────────────┼───────────────►│
  │                          │                            │                │
  │                          │◄─── Stream chunk 2 ────────┤                │
  │◄─────────────────────────┤                            │                │
  │   "a field..."           ├─► Broadcast ──────────────┼───────────────►│
  │                          │                            │                │
  │                          │◄─── Stream chunk N ────────┤                │
  │◄─────────────────────────┤                            │                │
  │   "of study..."          ├─► Broadcast ──────────────┼───────────────►│
  │                          │                            │                │
  │                          ├─► Save bot msg to DB       │                │
  │                          │                            │                │
  │◄─────────────────────────┤                                             │
  │   Complete message       ├─► Broadcast complete ─────┼───────────────►│
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────┐                                              │
│  │     users      │                                              │
│  ├────────────────┤                                              │
│  │ id (PK)        │                                              │
│  │ username       │◄──────────┐                                  │
│  │ email          │           │                                  │
│  │ hashed_pwd     │           │                                  │
│  │ created_at     │           │                                  │
│  └────────────────┘           │                                  │
│         │                     │                                  │
│         │                     │                                  │
│         │    ┌────────────────┴──────────┐                       │
│         │    │                           │                       │
│         │    │   ┌───────────────────┐   │                       │
│         │    │   │ chat_participants │   │                       │
│         │    │   ├───────────────────┤   │                       │
│         │    └───┤ id (PK)           │   │                       │
│         │        │ chat_id (FK)      │───┼────┐                  │
│         └────────┤ user_id (FK)      │   │    │                  │
│                  │ joined_at         │   │    │                  │
│                  └───────────────────┘   │    │                  │
│                                          │    │                  │
│  ┌────────────────┐                      │    │                  │
│  │     chats      │                      │    │                  │
│  ├────────────────┤◄─────────────────────┘    │                  │
│  │ id (PK)        │                            │                  │
│  │ name           │                            │                  │
│  │ owner_id (FK)  │────────────────────────────┼──┐               │
│  │ is_group       │                            │  │               │
│  │ created_at     │                            │  │               │
│  └────────────────┘                            │  │               │
│         │                                      │  │               │
│         │                                      │  │               │
│         │    ┌───────────────────┐             │  │               │
│         │    │     messages      │             │  │               │
│         │    ├───────────────────┤             │  │               │
│         └────┤ id (PK)           │             │  │               │
│              │ chat_id (FK)      │◄────────────┘  │               │
│              │ user_id (FK)      │◄───────────────┘               │
│              │ content           │                                │
│              │ is_bot            │                                │
│              │ created_at        │                                │
│              └───────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## WebSocket Room Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    Connection Manager                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  active_connections: {                                           │
│    1: {ws_A, ws_B, ws_C},  # Chat room 1                        │
│    2: {ws_A, ws_D},         # Chat room 2                        │
│    3: {ws_B, ws_E, ws_F}    # Chat room 3                        │
│  }                                                               │
│                                                                  │
│  websocket_users: {                                              │
│    ws_A: user_id_1,                                              │
│    ws_B: user_id_2,                                              │
│    ws_C: user_id_3,                                              │
│    ...                                                           │
│  }                                                               │
│                                                                  │
│  websocket_usernames: {                                          │
│    ws_A: "john",                                                 │
│    ws_B: "jane",                                                 │
│    ws_C: "bob",                                                  │
│    ...                                                           │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Message Types & Handlers

```
┌──────────────────────────────────────────────────────────────────┐
│                      Message Routing                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Received Message Type       Handler                Action        │
│  ─────────────────────       ───────                ──────        │
│                                                                   │
│  "join"                      join_chat()            Add to room   │
│                                                                   │
│  "leave"                     leave_chat()           Remove room   │
│                                                                   │
│  "message"                   handle_message()       Save & broadcast
│    - Regular                                        to all        │
│    - Bot command (/bot)      call_gemini()         Stream to all │
│                                                                   │
│  "typing"                    broadcast_typing()     Send to others│
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         Security Layers                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Authentication                                               │
│     ├─► Password hashing (bcrypt)                               │
│     ├─► JWT token generation                                    │
│     └─► Token validation on each request                        │
│                                                                  │
│  2. Authorization                                                │
│     ├─► User must be chat participant                           │
│     ├─► Token required for WebSocket                            │
│     └─► Per-endpoint permission checks                          │
│                                                                  │
│  3. Data Protection                                              │
│     ├─► CORS configured                                         │
│     ├─► SQL injection protected (SQLAlchemy)                    │
│     └─► Input validation (Pydantic)                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
Current (Single Server):
┌─────────────────┐
│   FastAPI       │
│   + WebSocket   │
│   + SQLite      │
└─────────────────┘

Future (Scaled):
┌─────────────────┐     ┌─────────────────┐
│   FastAPI 1     │     │   FastAPI 2     │
│   + WebSocket   │     │   + WebSocket   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼──────────┐
         │   Redis (PubSub)     │
         │   for WebSocket      │
         │   broadcasting       │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   PostgreSQL         │
         │   (Replicated)       │
         └──────────────────────┘
```

## Performance Metrics

```
Expected Performance (Single Server):
├─► Concurrent Users: 100-500
├─► Messages/sec: 100-1000
├─► WebSocket Connections: 500+
├─► Bot Response Time: 2-5 seconds (streaming)
└─► Database Queries: <50ms
```

---

This architecture provides:

- ✅ Real-time communication
- ✅ Persistent storage
- ✅ Secure authentication
- ✅ Scalable design
- ✅ AI integration
- ✅ Multi-user collaboration
