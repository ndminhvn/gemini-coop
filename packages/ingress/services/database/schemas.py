"""
Database service - Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Chat schemas
class ChatCreate(BaseModel):
    name: Optional[str] = None
    is_group: bool = False


class ChatInvite(BaseModel):
    username: str


class ChatResponse(BaseModel):
    id: int
    name: Optional[str]
    owner_id: int
    created_at: datetime
    is_group: bool

    class Config:
        from_attributes = True


class ChatWithParticipants(ChatResponse):
    participants: List[UserResponse]


# Message schemas
class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    chat_id: int


class MessageResponse(MessageBase):
    id: int
    chat_id: int
    user_id: Optional[int]
    is_bot: bool
    created_at: datetime

    class Config:
        from_attributes = True


# WebSocket message types
class WSMessage(BaseModel):
    type: str  # 'message', 'bot_command', 'typing', 'join', 'leave'
    chat_id: int
    content: Optional[str] = None
    username: Optional[str] = None
