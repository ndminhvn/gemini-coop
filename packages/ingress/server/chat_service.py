from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas
from datetime import datetime


def create_chat(
    db: Session, owner_id: int, name: Optional[str] = None, is_group: bool = False
) -> models.Chat:
    """Create a new chat"""
    chat = models.Chat(owner_id=owner_id, name=name, is_group=is_group)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # Add owner as participant
    participant = models.ChatParticipant(chat_id=chat.id, user_id=owner_id)
    db.add(participant)
    db.commit()

    return chat


def get_chat(db: Session, chat_id: int) -> Optional[models.Chat]:
    """Get a chat by ID"""
    return db.query(models.Chat).filter(models.Chat.id == chat_id).first()


def get_user_chats(db: Session, user_id: int) -> List[models.Chat]:
    """Get all chats a user is participating in"""
    return (
        db.query(models.Chat)
        .join(models.ChatParticipant)
        .filter(models.ChatParticipant.user_id == user_id)
        .all()
    )


def add_participant(db: Session, chat_id: int, user_id: int) -> models.ChatParticipant:
    """Add a participant to a chat"""
    # Check if participant already exists
    existing = (
        db.query(models.ChatParticipant)
        .filter(
            models.ChatParticipant.chat_id == chat_id,
            models.ChatParticipant.user_id == user_id,
        )
        .first()
    )

    if existing:
        return existing

    participant = models.ChatParticipant(chat_id=chat_id, user_id=user_id)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def is_participant(db: Session, chat_id: int, user_id: int) -> bool:
    """Check if a user is a participant in a chat"""
    participant = (
        db.query(models.ChatParticipant)
        .filter(
            models.ChatParticipant.chat_id == chat_id,
            models.ChatParticipant.user_id == user_id,
        )
        .first()
    )
    return participant is not None


def get_chat_participants(db: Session, chat_id: int) -> List[models.User]:
    """Get all participants in a chat"""
    return (
        db.query(models.User)
        .join(models.ChatParticipant)
        .filter(models.ChatParticipant.chat_id == chat_id)
        .all()
    )


def create_message(
    db: Session,
    chat_id: int,
    content: str,
    user_id: Optional[int] = None,
    is_bot: bool = False,
) -> models.Message:
    """Create a new message"""
    message = models.Message(
        chat_id=chat_id, user_id=user_id, content=content, is_bot=is_bot
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_chat_messages(
    db: Session, chat_id: int, limit: int = 50
) -> List[models.Message]:
    """Get messages from a chat"""
    return (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.desc())
        .limit(limit)
        .all()
    )


def get_chat_history_for_gemini(
    db: Session, chat_id: int, limit: int = 20
) -> List[dict]:
    """
    Get chat history formatted for Gemini API
    Returns list of messages in format: [{'role': 'user'/'model', 'parts': [text]}]
    """
    messages = (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .limit(limit)
        .all()
    )

    history = []
    for msg in messages:
        if msg.is_bot:
            history.append({'role': 'model', 'parts': [msg.content]})
        else:
            history.append({'role': 'user', 'parts': [msg.content]})

    return history
