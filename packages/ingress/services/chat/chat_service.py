"""
Chat Service
Handles chat rooms, participants, and messages
"""

from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional, Dict
from datetime import datetime, timezone

from services.database.models import (
    Chat,
    ChatParticipant,
    Message,
    User,
    MessageReadReceipt,
)


def ensure_timezone_aware(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware (UTC)"""
    if dt.tzinfo is None:
        # Assume naive datetimes are UTC
        return dt.replace(tzinfo=timezone.utc)
    return dt


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


def get_unread_count(db: Session, chat_id: int, user_id: int) -> int:
    """
    Get count of unread messages in a chat for a user
    """
    # Get user's last_read_at timestamp
    stmt = select(ChatParticipant).where(
        ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == user_id
    )
    participant = db.execute(stmt).scalar_one_or_none()

    if not participant:
        return 0

    # Count messages created after last_read_at
    count_stmt = select(func.count(Message.id)).where(
        Message.chat_id == chat_id,
        Message.created_at > participant.last_read_at,
        Message.user_id != user_id,  # Don't count user's own messages
    )
    count = db.execute(count_stmt).scalar()

    return count or 0


def mark_chat_as_read(db: Session, chat_id: int, user_id: int) -> bool:
    """
    Mark a chat as read for a user by updating last_read_at to current time
    """
    stmt = select(ChatParticipant).where(
        ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == user_id
    )
    participant = db.execute(stmt).scalar_one_or_none()

    if not participant:
        return False

    participant.last_read_at = datetime.now(timezone.utc)
    db.commit()

    # Also create read receipts for all unread messages in this chat
    mark_messages_as_read(db, chat_id, user_id)

    return True


def mark_messages_as_read(db: Session, chat_id: int, user_id: int) -> None:
    """
    Mark all messages in a chat as read by a user by creating read receipts
    """
    # Get all messages in the chat that don't have a read receipt from this user
    # and aren't sent by this user
    stmt = (
        select(Message)
        .where(Message.chat_id == chat_id, Message.user_id != user_id)
        .outerjoin(
            MessageReadReceipt,
            (MessageReadReceipt.message_id == Message.id)
            & (MessageReadReceipt.user_id == user_id),
        )
        .where(MessageReadReceipt.id == None)
    )
    unread_messages = db.execute(stmt).scalars().all()

    # Create read receipts for all unread messages
    for message in unread_messages:
        receipt = MessageReadReceipt(message_id=message.id, user_id=user_id)
        db.add(receipt)

    db.commit()


def get_message_read_receipts(db: Session, message_id: int) -> List[Dict]:
    """
    Get all read receipts for a message with user information
    """
    stmt = (
        select(MessageReadReceipt, User)
        .join(User, MessageReadReceipt.user_id == User.id)
        .where(MessageReadReceipt.message_id == message_id)
        .order_by(MessageReadReceipt.read_at.asc())
    )
    results = db.execute(stmt).all()

    receipts = []
    for receipt, user in results:
        receipts.append(
            {
                "user_id": user.id,
                "username": user.username,
                "read_at": receipt.read_at,
            }
        )

    return receipts


def get_chat_read_receipts(db: Session, chat_id: int) -> Dict[int, List[Dict]]:
    """
    Get read receipts for all messages in a chat
    Returns dict mapping message_id -> list of read receipts
    """
    # Get all messages in the chat
    messages_stmt = select(Message).where(Message.chat_id == chat_id)
    messages = db.execute(messages_stmt).scalars().all()

    # Get all read receipts for these messages
    message_ids = [msg.id for msg in messages]
    if not message_ids:
        return {}

    receipts_stmt = (
        select(MessageReadReceipt, User)
        .join(User, MessageReadReceipt.user_id == User.id)
        .where(MessageReadReceipt.message_id.in_(message_ids))
        .order_by(MessageReadReceipt.read_at.asc())
    )
    results = db.execute(receipts_stmt).all()

    # Organize by message_id
    receipts_by_message = {}
    for receipt, user in results:
        if receipt.message_id not in receipts_by_message:
            receipts_by_message[receipt.message_id] = []

        receipts_by_message[receipt.message_id].append(
            {
                "user_id": user.id,
                "username": user.username,
                "read_at": receipt.read_at,
            }
        )

    return receipts_by_message
