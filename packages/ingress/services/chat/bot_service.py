"""
Bot Service
Manages Gemini AI bot users and their participation in chats
"""

from sqlalchemy.orm import Session
from services.database.models import User, ChatParticipant
from services.auth.auth_service import get_password_hash


# Bot configuration
BOT_USERNAME = "gemini-ai"
BOT_EMAIL = "gemini@system.bot"
BOT_PASSWORD = "system-bot-no-login"  # Cannot be used for login


def get_or_create_bot_user(db: Session) -> User:
    """
    Get or create the system bot user

    Args:
        db: Database session

    Returns:
        Bot user instance
    """
    # Check if bot user exists
    bot_user = db.query(User).filter(User.username == BOT_USERNAME).first()

    if not bot_user:
        # Create bot user
        bot_user = User(
            username=BOT_USERNAME,
            email=BOT_EMAIL,
            hashed_password=get_password_hash(BOT_PASSWORD),
        )
        db.add(bot_user)
        db.commit()
        db.refresh(bot_user)

    return bot_user


def add_bot_to_chat(db: Session, chat_id: int) -> ChatParticipant:
    """
    Add the bot as a participant to a chat if not already added

    Args:
        db: Database session
        chat_id: Chat ID to add bot to

    Returns:
        ChatParticipant instance for the bot
    """
    bot_user = get_or_create_bot_user(db)

    # Check if bot is already a participant
    existing = (
        db.query(ChatParticipant)
        .filter(
            ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == bot_user.id
        )
        .first()
    )

    if existing:
        return existing

    # Add bot as participant
    participant = ChatParticipant(chat_id=chat_id, user_id=bot_user.id)
    db.add(participant)
    db.commit()
    db.refresh(participant)

    return participant


def is_bot_user(user_id: int, db: Session) -> bool:
    """
    Check if a user ID belongs to the bot

    Args:
        user_id: User ID to check
        db: Database session

    Returns:
        True if user is the bot, False otherwise
    """
    bot_user = get_or_create_bot_user(db)
    return user_id == bot_user.id
