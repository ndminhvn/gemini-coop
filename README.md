# Gemini Coop

A real-time collaborative chat application where multiple users can interact with each other and an AI assistant powered by Google's Gemini API. Built with modern web technologies for seamless real-time communication.

## ✨ Features

### 💬 Real-Time Messaging

- **WebSocket-based** instant messaging
- **Live updates** across all participants
- **Message read receipts** with user avatars (Messenger-style)
- **Typing indicators** showing who's typing
- **Unread message badges** and filtering

### 🤖 AI Integration

- **Gemini AI assistant** in group chats
- **Streaming responses** for natural conversation flow
- **Shared AI context** - everyone sees the same responses
- **Bot commands** via `/bot <message>` syntax

### 👥 Chat Management

- **Group chats** with multiple participants
- **Private AI chats** for one-on-one AI conversations
- **Invite users** by username
- **Member management** (add/remove participants)
- **Chat info panel** (Messenger-style) with member list
- **Leave or delete** chats with confirmation

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** and **pnpm**
- **Python 3.13+**
- **Docker** (recommended for database)
- **Gemini API Key** - [Get one here](https://ai.google.dev/gemini-api/docs)

### 1. Clone Repository

```bash
git clone https://github.com/ndminhvn/gemini-coop.git
cd gemini-coop
```

### 2. Start Backend

```bash
cd packages/ingress

# Copy environment template
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start with Docker (recommended)
docker compose up --build -d
```

Backend runs on **http://localhost:8000**

### 3. Start Frontend

```bash
cd packages/web

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Frontend runs on **http://localhost:3000**

### 4. Create Account & Start Chatting!

1. Visit http://localhost:3000
2. Register a new account
3. Create a group chat or start an AI chat
4. Invite friends or chat with the AI bot using `/bot <message>`

## 📸 Screenshots

### Main Chat Interface

<img width="1512" height="754" alt="Main chat page with sidebar and messages" src="https://github.com/user-attachments/assets/647c09c7-288a-4dce-be51-e7152ce8f60c" />

### Create Group Chats

<img width="1512" height="755" alt="Create group dialog with AI option" src="https://github.com/user-attachments/assets/9d033e27-6518-4d11-a32e-be4ff8a45e8e" />

### Real-Time Features

<img width="1512" height="982" alt="Read receipts and unread indicators" src="https://github.com/user-attachments/assets/e4868f3d-949a-4f44-bb24-afd478ac1e45" />

### Member Management

<img width="631" height="758" alt="Chat info panel with member management" src="https://github.com/user-attachments/assets/db49fa0a-42b0-4c35-af2f-f34fa41058e5" />

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js 15    │◄───────►│   FastAPI        │◄───────►│  Gemini API     │
│   Frontend      │  HTTP/  │   Backend        │  HTTPS  │  (Google)       │
│   + React 19    │  WS     │   + PostgreSQL   │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Tech Stack

**Frontend:**

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- WebSocket client

**Backend:**

- FastAPI (Python)
- PostgreSQL 17
- SQLAlchemy 2.0 ORM
- WebSocket (real-time)
- JWT authentication
- Google Gemini API

## 📁 Project Structure

```
gemini-coop/
├── packages/
│   ├── ingress/              # Backend (FastAPI + PostgreSQL)
│   │   ├── server/           # API routes
│   │   ├── services/         # Business logic (auth, chat, gemini, websocket)
│   │   ├── shared/           # Config & utilities
│   │   ├── docker-compose.yml
│   │   └── README.md         # Backend documentation
│   │
│   └── web/                  # Frontend (Next.js + React)
│       ├── app/              # Pages (App Router)
│       ├── components/       # UI components
│       ├── contexts/         # React contexts (auth, chat, websocket)
│       ├── hooks/            # Custom hooks
│       └── lib/              # Utilities & API client
│
├── ARCHITECTURE.md           # System architecture details
└── README.md                # This file
```

## 📚 Documentation

- **[Architecture Guide](ARCHITECTURE.md)** - System design and data flow
- **[Backend README](packages/ingress/README.md)** - API setup and endpoints

## 🔑 Key Features Implemented

✅ User authentication (JWT)  
✅ Real-time WebSocket messaging  
✅ Gemini AI integration with streaming  
✅ Group chats with multiple users  
✅ Message read receipts (Messenger-style)  
✅ Typing indicators  
✅ Unread message badges and filtering  
✅ Chat info panel with member management  
✅ Invite/remove participants  
✅ Leave/delete chats  
✅ Auto-expanding message input  
✅ Responsive sidebar with chat list

## 🚧 Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development plans.

**Upcoming:**

- [ ] Search in chat messages
- [ ] Media/files/links sections
- [ ] Dark mode
- [ ] File upload support
- [ ] Voice messages
- [ ] Push notifications
- [ ] Multiple AI models

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- shadcn/ui for beautiful UI components
- FastAPI for the excellent Python framework
