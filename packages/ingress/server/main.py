import asyncio
import json
import os
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uvicorn
from contextlib import asynccontextmanager

# Import from new modular structure
from shared.database import get_db, init_db
from shared.config import CORS_ORIGINS, HOST, PORT
from services.database.models import User
from services.database.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ChatCreate,
    ChatResponse,
    ChatInvite,
    MessageResponse,
)
from services.auth.auth_service import (
    decode_token,
    get_user_by_username,
    get_user_by_email,
    authenticate_user,
    create_user,
    create_access_token,
)
from services.chat.chat_service import (
    create_chat,
    get_user_chats,
    get_chat,
    is_participant,
    add_participant,
    get_chat_messages,
    get_chat_participants,
    create_message,
    get_chat_history_for_gemini,
)
from services.gemini.gemini_service import gemini_service
from services.websocket.websocket_manager import websocket_manager

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Gemini Coop API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Initialize database on startup
@asynccontextmanager
async def lifespan(app):
    init_db()
    print("Database initialized")
    try:
        yield
    finally:
        # cleanup on shutdown if needed
        pass


# Attach lifespan to the existing FastAPI app
app.router.lifespan_context = lifespan


# @app.on_event("startup")
# async def startup_event():
#     init_db()
#     print("Database initialized")


# Dependency to get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current user from JWT token"""
    token = credentials.credentials
    username = decode_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============= AUTH ROUTES =============


@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    if get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    return create_user(db, user)


@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    db_user = authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


@app.get("/api/users/search", response_model=List[UserResponse])
async def search_users(
    query: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search users by username or email"""
    if len(query) < 2:
        return []

    # Search for users matching the query using SQLAlchemy 2.0 style
    stmt = (
        select(User)
        .where((User.username.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%")))
        .where(User.id != current_user.id)  # Exclude current user
        .limit(limit)
    )
    users = db.execute(stmt).scalars().all()

    print(f"Search query: '{query}', Found {len(users)} users")
    return users


# ============= CHAT ROUTES =============


@app.post("/api/chats", response_model=ChatResponse)
async def create_chat_endpoint(
    chat: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat"""
    # Create the chat
    new_chat = create_chat(
        db, current_user.id, chat.name, chat.is_group, chat.is_ai_chat
    )

    # Collect all participant user IDs for notifications
    participant_ids = []

    # Add additional participants if provided
    if chat.participant_usernames:
        for username in chat.participant_usernames:
            invited_user = get_user_by_username(db, username)
            if invited_user:
                add_participant(db, new_chat.id, invited_user.id)
                participant_ids.append(invited_user.id)

    # If it's an AI chat, send an initial greeting message
    if chat.is_ai_chat:
        create_message(
            db,
            chat_id=new_chat.id,
            content="Hello! I'm your AI assistant. How can I help you today?",
            user_id=None,
            is_bot=True,
        )

    # Notify all invited users about the new chat
    if participant_ids:
        await websocket_manager.notify_users(
            participant_ids,
            {
                "type": "chat_created",
                "chat": {
                    "id": new_chat.id,
                    "name": new_chat.name,
                    "owner_id": new_chat.owner_id,
                    "created_at": new_chat.created_at.isoformat(),
                    "is_group": new_chat.is_group,
                },
                "notification": f"You've been added to a new chat by {current_user.username}",
            },
        )

    return new_chat


@app.get("/api/chats", response_model=List[ChatResponse])
async def get_my_chats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all chats for current user"""
    return get_user_chats(db, current_user.id)


@app.get("/api/chats/{chat_id}", response_model=ChatResponse)
async def get_chat_endpoint(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific chat"""
    chat = get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Check if user is participant
    if not is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    return chat


@app.post("/api/chats/{chat_id}/invite")
async def invite_to_chat(
    chat_id: int,
    invite: ChatInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a user to a chat"""
    # Check if chat exists and user is participant
    chat = get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if not is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find user to invite
    invited_user = get_user_by_username(db, invite.username)
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add participant
    add_participant(db, chat_id, invited_user.id)

    # Notify the invited user
    await websocket_manager.notify_user(
        invited_user.id,
        {
            "type": "chat_invite",
            "chat": {
                "id": chat.id,
                "name": chat.name,
                "owner_id": chat.owner_id,
                "created_at": chat.created_at.isoformat(),
                "is_group": chat.is_group,
            },
            "notification": f"{current_user.username} added you to {chat.name or 'a chat'}",
        },
    )

    return {"message": f"User {invite.username} invited to chat"}


@app.get("/api/chats/{chat_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    chat_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get messages from a chat"""
    # Check if user is participant
    if not is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = get_chat_messages(db, chat_id, limit)

    # Add username to each message
    result = []
    for msg in reversed(messages):  # Return in chronological order
        msg_dict = {
            "id": msg.id,
            "chat_id": msg.chat_id,
            "user_id": msg.user_id,
            "content": msg.content,
            "is_bot": msg.is_bot,
            "created_at": msg.created_at,
            "username": msg.user.username if msg.user else "AI Assistant",
        }
        result.append(msg_dict)

    return result


@app.get("/api/chats/{chat_id}/participants", response_model=List[UserResponse])
async def get_participants(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get participants in a chat"""
    if not is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    return get_chat_participants(db, chat_id)


# ============= WEBSOCKET =============


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, token: str, db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time chat"""
    # Authenticate user
    username = decode_token(token)
    if not username:
        await websocket.close(code=1008)  # Policy violation
        return

    user = get_user_by_username(db, username)
    if not user:
        await websocket.close(code=1008)
        return

    # Connect
    await websocket_manager.connect(websocket, user.id, user.username)

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message_type = message_data.get("type")
            chat_id = message_data.get("chat_id")

            # Verify user is participant
            if not is_participant(db, chat_id, user.id):
                await websocket_manager.send_personal_message(
                    json.dumps({"error": "Not authorized"}), websocket
                )
                continue

            # Handle different message types
            if message_type == "join":
                # Join chat room
                await websocket_manager.join_chat(websocket, chat_id)
                await websocket_manager.broadcast_to_chat(
                    {
                        "type": "user_joined",
                        "chat_id": chat_id,
                        "username": user.username,
                    },
                    chat_id,
                    exclude=websocket,
                )

            elif message_type == "leave":
                # Leave chat room
                await websocket_manager.leave_chat(websocket, chat_id)
                await websocket_manager.broadcast_to_chat(
                    {
                        "type": "user_left",
                        "chat_id": chat_id,
                        "username": user.username,
                    },
                    chat_id,
                )

            elif message_type == "message":
                content = message_data.get("content", "")

                # Check if it's a bot command
                if content.startswith("/bot "):
                    bot_message = content[5:].strip()  # Remove "/bot " prefix

                    # Save user message
                    user_msg = create_message(
                        db, chat_id, content, user.id, is_bot=False
                    )

                    # Broadcast user message
                    await websocket_manager.broadcast_to_chat(
                        {
                            "type": "message",
                            "message": {
                                "id": user_msg.id,
                                "chat_id": chat_id,
                                "user_id": user.id,
                                "username": user.username,
                                "content": content,
                                "is_bot": False,
                                "created_at": user_msg.created_at.isoformat(),
                            },
                        },
                        chat_id,
                    )

                    # Get chat history for context
                    history = get_chat_history_for_gemini(db, chat_id, limit=20)

                    # Create placeholder for bot message
                    bot_msg = create_message(db, chat_id, "", user_id=None, is_bot=True)

                    # Stream Gemini response
                    stream = gemini_service.generate_stream_response(
                        bot_message, history
                    )
                    full_response = await websocket_manager.stream_to_chat(
                        chat_id, bot_msg.id, stream
                    )

                    # Update bot message with full response
                    bot_msg.content = full_response
                    db.commit()

                else:
                    # Regular message
                    msg = create_message(db, chat_id, content, user.id, is_bot=False)

                    # Broadcast message
                    await websocket_manager.broadcast_to_chat(
                        {
                            "type": "message",
                            "message": {
                                "id": msg.id,
                                "chat_id": chat_id,
                                "user_id": user.id,
                                "username": user.username,
                                "content": content,
                                "is_bot": False,
                                "created_at": msg.created_at.isoformat(),
                            },
                        },
                        chat_id,
                    )

            elif message_type == "typing":
                # Broadcast typing indicator
                await websocket_manager.broadcast_to_chat(
                    {"type": "typing", "chat_id": chat_id, "username": user.username},
                    chat_id,
                    exclude=websocket,
                )

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
        print(f"User {user.username} disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)


# ============= HEALTH CHECK =============


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
