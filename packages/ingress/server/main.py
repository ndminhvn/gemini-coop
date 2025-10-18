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
from typing import List
import uvicorn

from . import models, schemas, auth, chat_service
from .database import get_db, init_db
from .websocket_manager import manager
from .gemini_service import gemini_service

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Gemini Coop API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("Database initialized")


# Dependency to get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    """Get current user from JWT token"""
    token = credentials.credentials
    username = auth.decode_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    user = auth.get_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============= AUTH ROUTES =============


@app.post("/api/auth/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    if auth.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if auth.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    return auth.create_user(db, user)


@app.post("/api/auth/login", response_model=schemas.Token)
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    db_user = auth.authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


# ============= CHAT ROUTES =============


@app.post("/api/chats", response_model=schemas.ChatResponse)
async def create_chat(
    chat: schemas.ChatCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat"""
    return chat_service.create_chat(db, current_user.id, chat.name, chat.is_group)


@app.get("/api/chats", response_model=List[schemas.ChatResponse])
async def get_my_chats(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all chats for current user"""
    return chat_service.get_user_chats(db, current_user.id)


@app.get("/api/chats/{chat_id}", response_model=schemas.ChatResponse)
async def get_chat(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific chat"""
    chat = chat_service.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Check if user is participant
    if not chat_service.is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    return chat


@app.post("/api/chats/{chat_id}/invite")
async def invite_to_chat(
    chat_id: int,
    invite: schemas.ChatInvite,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a user to a chat"""
    # Check if chat exists and user is participant
    chat = chat_service.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if not chat_service.is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find user to invite
    invited_user = auth.get_user_by_username(db, invite.username)
    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add participant
    chat_service.add_participant(db, chat_id, invited_user.id)

    return {"message": f"User {invite.username} invited to chat"}


@app.get("/api/chats/{chat_id}/messages", response_model=List[schemas.MessageResponse])
async def get_messages(
    chat_id: int,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get messages from a chat"""
    # Check if user is participant
    if not chat_service.is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = chat_service.get_chat_messages(db, chat_id, limit)
    return list(reversed(messages))  # Return in chronological order


@app.get("/api/chats/{chat_id}/participants", response_model=List[schemas.UserResponse])
async def get_participants(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get participants in a chat"""
    if not chat_service.is_participant(db, chat_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    return chat_service.get_chat_participants(db, chat_id)


# ============= WEBSOCKET =============


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, token: str, db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time chat"""
    # Authenticate user
    username = auth.decode_token(token)
    if not username:
        await websocket.close(code=1008)  # Policy violation
        return

    user = auth.get_user_by_username(db, username)
    if not user:
        await websocket.close(code=1008)
        return

    # Connect
    await manager.connect(websocket, user.id, user.username)

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message_type = message_data.get("type")
            chat_id = message_data.get("chat_id")

            # Verify user is participant
            if not chat_service.is_participant(db, chat_id, user.id):
                await manager.send_personal_message(
                    json.dumps({"error": "Not authorized"}), websocket
                )
                continue

            # Handle different message types
            if message_type == "join":
                # Join chat room
                await manager.join_chat(websocket, chat_id)
                await manager.broadcast_to_chat(
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
                await manager.leave_chat(websocket, chat_id)
                await manager.broadcast_to_chat(
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
                    user_msg = chat_service.create_message(
                        db, chat_id, content, user.id, is_bot=False
                    )

                    # Broadcast user message
                    await manager.broadcast_to_chat(
                        {
                            "type": "message",
                            "chat_id": chat_id,
                            "message_id": user_msg.id,
                            "username": user.username,
                            "content": content,
                            "is_bot": False,
                            "created_at": user_msg.created_at.isoformat(),
                        },
                        chat_id,
                    )

                    # Get chat history for context
                    history = chat_service.get_chat_history_for_gemini(
                        db, chat_id, limit=20
                    )

                    # Create placeholder for bot message
                    bot_msg = chat_service.create_message(
                        db, chat_id, "", user_id=None, is_bot=True
                    )

                    # Stream Gemini response
                    stream = gemini_service.generate_stream_response(
                        bot_message, history
                    )
                    full_response = await manager.stream_to_chat(
                        chat_id, bot_msg.id, stream
                    )

                    # Update bot message with full response
                    bot_msg.content = full_response
                    db.commit()

                else:
                    # Regular message
                    msg = chat_service.create_message(
                        db, chat_id, content, user.id, is_bot=False
                    )

                    # Broadcast message
                    await manager.broadcast_to_chat(
                        {
                            "type": "message",
                            "chat_id": chat_id,
                            "message_id": msg.id,
                            "username": user.username,
                            "content": content,
                            "is_bot": False,
                            "created_at": msg.created_at.isoformat(),
                        },
                        chat_id,
                    )

            elif message_type == "typing":
                # Broadcast typing indicator
                await manager.broadcast_to_chat(
                    {"type": "typing", "chat_id": chat_id, "username": user.username},
                    chat_id,
                    exclude=websocket,
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"User {user.username} disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ============= HEALTH CHECK =============


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
