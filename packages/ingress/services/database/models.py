"""
Database service - Models
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from shared.database import Base


def utc_now():
    """Return current UTC time with timezone awareness"""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    owned_chats = relationship(
        "Chat", back_populates="owner", foreign_keys="Chat.owner_id"
    )
    chat_participants = relationship("ChatParticipant", back_populates="user")
    messages = relationship("Message", back_populates="user")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)  # Optional name for group chats
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    is_group = Column(Boolean, default=False)

    # Relationships
    owner = relationship("User", back_populates="owned_chats", foreign_keys=[owner_id])
    participants = relationship(
        "ChatParticipant", back_populates="chat", cascade="all, delete-orphan"
    )
    messages = relationship(
        "Message", back_populates="chat", cascade="all, delete-orphan"
    )


class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), default=utc_now)
    last_read_at = Column(
        DateTime(timezone=True), default=utc_now
    )  # Track when user last read messages

    # Relationships
    chat = relationship("Chat", back_populates="participants")
    user = relationship("User", back_populates="chat_participants")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )  # Null for bot messages
    content = Column(Text, nullable=False)
    is_bot = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    user = relationship("User", back_populates="messages")
    read_receipts = relationship(
        "MessageReadReceipt", back_populates="message", cascade="all, delete-orphan"
    )


class MessageReadReceipt(Base):
    __tablename__ = "message_read_receipts"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    read_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    message = relationship("Message", back_populates="read_receipts")
    user = relationship("User")
