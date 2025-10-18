# 🚀 Getting Started with Gemini Coop

Welcome to Gemini Coop! This guide will help you get up and running quickly.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Running the Server](#running-the-server)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

## Prerequisites

### Required

- **Python 3.13+** - [Download](https://www.python.org/downloads/)
- **Gemini API Key** - [Get one here](https://makersuite.google.com/app/apikey)

### Optional (for frontend development)

- **Node.js 22+** - [Download](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`

## Quick Start

### Option 1: Using the Start Script (Recommended)

```bash
cd packages/ingress
./start.sh
```

This script will:

1. Check for `.env` file (create from template if needed)
2. Create Python virtual environment
3. Install dependencies
4. Start the server

### Option 2: Manual Setup

```bash
# 1. Navigate to backend directory
cd packages/ingress

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment (see Configuration section)
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 5. Run the server
python -m server.main
```

## Configuration

### Environment Variables

Edit `packages/ingress/.env`:

```bash
# REQUIRED: Your Gemini API Key
GEMINI_API_KEY=your_api_key_here

# REQUIRED: Secret key for JWT tokens (change in production!)
SECRET_KEY=your-secret-key-change-this-in-production

# OPTIONAL: Database URL (defaults to SQLite)
DATABASE_URL=sqlite:///./gemini_coop.db

# OPTIONAL: Server settings
HOST=0.0.0.0
PORT=8000
```

### Getting Your Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

## Running the Server

### Development Mode (with auto-reload)

```bash
cd packages/ingress
source venv/bin/activate
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
cd packages/ingress
source venv/bin/activate
python -m server.main
```

### Verify Server is Running

Open your browser and go to:

- **Health Check:** http://localhost:8000/health
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **ReDoc:** http://localhost:8000/redoc

You should see:

```json
{ "status": "healthy" }
```

## Testing

### Test 1: REST API

```bash
cd packages/ingress
python test_api.py
```

This will:

- ✅ Test health endpoint
- ✅ Register a test user
- ✅ Login and get JWT token
- ✅ Create a chat
- ✅ Get chat list
- ✅ Get messages

**Expected Output:**

```
==================================================
Gemini Coop API Test Suite
==================================================

1. Testing health check...
   Status: 200
   Response: {'status': 'healthy'}

2. Testing user registration...
   Status: 200
   Response: {'id': 1, 'username': 'testuser', ...}

...

✅ All tests passed!
```

### Test 2: WebSocket Connection

First, get your token and chat_id from the API test, then:

```bash
python test_websocket.py <token> <chat_id>
```

**Example:**

```bash
python test_websocket.py eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... 1
```

This will:

- ✅ Connect to WebSocket
- ✅ Join chat room
- ✅ Send a regular message
- ✅ Send a bot command (`/bot Tell me a joke`)
- ✅ Receive streaming bot response
- ✅ Leave chat

### Test 3: Bot Command (Manual)

You can also test using curl or your browser's console:

```javascript
// In browser console (http://localhost:8000/docs)
const ws = new WebSocket("ws://localhost:8000/ws?token=YOUR_TOKEN");

ws.onopen = () => {
  // Join chat
  ws.send(
    JSON.stringify({
      type: "join",
      chat_id: 1,
    })
  );

  // Send bot command
  ws.send(
    JSON.stringify({
      type: "message",
      chat_id: 1,
      content: "/bot Explain quantum computing in simple terms",
    })
  );
};

ws.onmessage = (event) => {
  console.log("Received:", JSON.parse(event.data));
};
```

## Troubleshooting

### Issue: Import errors (sqlalchemy, jose, passlib)

**Solution:** Install dependencies

```bash
cd packages/ingress
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: "Invalid authentication credentials"

**Solution:** Check your JWT token is valid and not expired (24h expiry)

```bash
# Get a new token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpassword123"}'
```

### Issue: "Error: [Gemini API error message]"

**Solution:** Check your Gemini API key

1. Verify `.env` file has correct `GEMINI_API_KEY`
2. Check key is valid at https://makersuite.google.com/app/apikey
3. Ensure you have API quota remaining

### Issue: WebSocket connection fails

**Solution:**

1. Check server is running: `curl http://localhost:8000/health`
2. Verify token is included: `ws://localhost:8000/ws?token=YOUR_TOKEN`
3. Check CORS settings in `server/main.py`

### Issue: "Port 8000 already in use"

**Solution:** Kill existing process or use different port

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn server.main:app --port 8001
```

### Issue: Database locked error

**Solution:** Delete the database file and restart

```bash
rm gemini_coop.db
python -m server.main
```

## Next Steps

### 1. Explore the API

Visit http://localhost:8000/docs to see all available endpoints:

- Authentication (`/api/auth/*`)
- Chats (`/api/chats/*`)
- WebSocket (`/ws`)

### 2. Create Multiple Users

Test the multi-user chat feature:

```bash
# Register users
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"password123"}'

curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@example.com","password":"password123"}'
```

### 3. Test Multi-User Chat

1. Login as Alice → Create a chat → Get token and chat_id
2. Invite Bob to the chat
3. Login as Bob → Get token
4. Connect both via WebSocket
5. Send messages from both accounts
6. Try `/bot` command from either account
7. Watch both receive the streaming response!

### 4. Build the Frontend

Now that the backend is working, you can:

1. **Connect Next.js frontend** (in `packages/web/`)
2. **Create authentication pages**
3. **Build chat interface**
4. **Implement WebSocket client**
5. **Add real-time updates**

See `IMPLEMENTATION_SUMMARY.md` for frontend integration guide.

### 5. Read the Documentation

- **README.md** - Backend overview and API documentation
- **ARCHITECTURE.md** - System architecture and data flow
- **IMPLEMENTATION_SUMMARY.md** - Complete implementation details
- **ROADMAP.md** - Future features and development plan

## Project Structure

```
gemini-coop/
├── packages/
│   ├── ingress/              # Backend (FastAPI)
│   │   ├── server/
│   │   │   ├── main.py       # Main application
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── chat_service.py
│   │   │   ├── gemini_service.py
│   │   │   ├── websocket_manager.py
│   │   │   ├── models.py     # Database models
│   │   │   ├── schemas.py    # Pydantic schemas
│   │   │   └── database.py   # DB configuration
│   │   ├── requirements.txt
│   │   ├── .env              # Configuration
│   │   ├── test_api.py       # API tests
│   │   └── test_websocket.py # WebSocket tests
│   │
│   └── web/                  # Frontend (Next.js)
│       └── [Next.js files]
│
├── ARCHITECTURE.md           # System architecture
├── IMPLEMENTATION_SUMMARY.md # Implementation details
├── ROADMAP.md               # Development roadmap
└── README.md                # This file
```

## Common Commands

```bash
# Start server
python -m server.main

# Start with auto-reload
uvicorn server.main:app --reload

# Run tests
python test_api.py
python test_websocket.py <token> <chat_id>

# Format code
black server/

# Check for issues
python -m pylint server/

# View logs (if using logging)
tail -f logs/app.log
```

## Environment Setup Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file configured with `GEMINI_API_KEY`
- [ ] Server starts successfully
- [ ] Health check returns 200
- [ ] API test passes
- [ ] WebSocket test passes
- [ ] Bot command works

## Support & Resources

- **Gemini API Docs:** https://ai.google.dev/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **WebSocket Guide:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org/

## Security Reminders

⚠️ **Before deploying to production:**

1. Change `SECRET_KEY` in `.env` to a strong random value
2. Use PostgreSQL instead of SQLite
3. Enable HTTPS/WSS
4. Set proper CORS origins
5. Add rate limiting
6. Enable logging and monitoring
7. Regular security audits

---

## Success! 🎉

If you've completed all the tests successfully, you're ready to:

1. ✅ Accept API requests
2. ✅ Handle real-time WebSocket connections
3. ✅ Process bot commands with Gemini
4. ✅ Manage multi-user chats
5. ✅ Stream AI responses to multiple users

**Next:** Start building the frontend to create a beautiful UI for your users!

Need help? Check the documentation or open an issue on GitHub.

Happy coding! 🚀
