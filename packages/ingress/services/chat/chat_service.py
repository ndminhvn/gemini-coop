"""
Chat Service
Handles chat rooms, participants, and messages
"""

from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from services.database.models import Chat, ChatParticipant, Message, User


def create_chat(
    db: Session,
    owner_id: int,
    name: Optional[str] = None,
    is_group: bool = False,
    is_ai_chat: bool = False,
) -> Chat:
    """Create a new chat"""
    # Auto-generate name for AI chats if not provided
    if is_ai_chat and not name:
        name = "AI Chat"

    chat = Chat(owner_id=owner_id, name=name, is_group=is_group)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # Add owner as participant
    participant = ChatParticipant(chat_id=chat.id, user_id=owner_id)
    db.add(participant)
    db.commit()

    return chat


def get_chat(db: Session, chat_id: int) -> Optional[Chat]:
    """Get a chat by ID"""
    stmt = select(Chat).where(Chat.id == chat_id)
    return db.execute(stmt).scalar_one_or_none()


def get_user_chats(db: Session, user_id: int) -> List[Chat]:
    """Get all chats a user is participating in, sorted by most recent activity"""
    # Subquery to get the latest message timestamp for each chat
    latest_message_subquery = (
        select(Message.chat_id, func.max(Message.created_at).label("last_message_at"))
        .group_by(Message.chat_id)
        .subquery()
    )

    # Main query with left join to include chats without messages
    stmt = (
        select(Chat)
        .join(ChatParticipant)
        .outerjoin(
            latest_message_subquery, Chat.id == latest_message_subquery.c.chat_id
        )
        .where(ChatParticipant.user_id == user_id)
        .order_by(
            # Sort by last message time if exists, otherwise by creation time
            func.coalesce(
                latest_message_subquery.c.last_message_at, Chat.created_at
            ).desc()
        )
    )
    return db.execute(stmt).scalars().all()


def add_participant(db: Session, chat_id: int, user_id: int) -> ChatParticipant:
    """Add a participant to a chat"""
    # Check if participant already exists
    stmt = select(ChatParticipant).where(
        ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == user_id
    )
    existing = db.execute(stmt).scalar_one_or_none()

    if existing:
        return existing

    participant = ChatParticipant(chat_id=chat_id, user_id=user_id)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def is_participant(db: Session, chat_id: int, user_id: int) -> bool:
    """Check if a user is a participant in a chat"""
    stmt = select(ChatParticipant).where(
        ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == user_id
    )
    participant = db.execute(stmt).scalar_one_or_none()
    return participant is not None


def get_chat_participants(db: Session, chat_id: int) -> List[User]:
    """Get all participants in a chat"""
    stmt = select(User).join(ChatParticipant).where(ChatParticipant.chat_id == chat_id)
    return db.execute(stmt).scalars().all()


def create_message(
    db: Session,
    chat_id: int,
    content: str,
    user_id: Optional[int] = None,
    is_bot: bool = False,
) -> Message:
    """Create a new message"""
    message = Message(chat_id=chat_id, user_id=user_id, content=content, is_bot=is_bot)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_chat_messages(db: Session, chat_id: int, limit: int = 50) -> List[Message]:
    """Get messages from a chat"""
    stmt = (
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()


def get_chat_history_for_gemini(
    db: Session, chat_id: int, limit: int = 20
) -> List[dict]:
    """
    Get chat history formatted for Gemini API
    Returns list of messages in format: [{'role': 'user'/'model', 'parts': [text]}]
    """
    stmt = (
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    messages = db.execute(stmt).scalars().all()

    history = []
    for msg in messages:
        if msg.is_bot:
            history.append({'role': 'model', 'parts': [msg.content]})
        else:
            history.append({'role': 'user', 'parts': [msg.content]})

    return history
