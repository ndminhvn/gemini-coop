"""
WebSocket Service
Manages WebSocket connections and real-time message broadcasting
"""

from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio


class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""

    def __init__(self):
        # Maps: chat_id -> set of websockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Maps: websocket -> user_id
        self.websocket_users: Dict[WebSocket, int] = {}
        # Maps: websocket -> username
        self.websocket_usernames: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.websocket_users[websocket] = user_id
        self.websocket_usernames[websocket] = username

    def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection"""
        # Remove from all chats
        for chat_id, connections in self.active_connections.items():
            if websocket in connections:
                connections.remove(websocket)

        # Clean up empty chat rooms
        self.active_connections = {
            chat_id: connections
            for chat_id, connections in self.active_connections.items()
            if connections
        }

        # Remove user mapping
        if websocket in self.websocket_users:
            del self.websocket_users[websocket]
        if websocket in self.websocket_usernames:
            del self.websocket_usernames[websocket]

    async def join_chat(self, websocket: WebSocket, chat_id: int):
        """Add a websocket to a chat room"""
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = set()
        self.active_connections[chat_id].add(websocket)

    async def leave_chat(self, websocket: WebSocket, chat_id: int):
        """Remove a websocket from a chat room"""
        if chat_id in self.active_connections:
            self.active_connections[chat_id].discard(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific websocket"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")

    async def broadcast_to_chat(
        self, message: dict, chat_id: int, exclude: WebSocket = None
    ):
        """
        Broadcast a message to all connections in a chat room

        Args:
            message: Message dict to broadcast
            chat_id: Chat room ID
            exclude: Optional websocket to exclude from broadcast
        """
        if chat_id not in self.active_connections:
            return

        message_json = json.dumps(message)
        disconnected = set()

        for connection in self.active_connections[chat_id]:
            if connection == exclude:
                continue
            try:
                await connection.send_text(message_json)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                disconnected.add(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            self.active_connections[chat_id].discard(connection)

    async def stream_to_chat(self, chat_id: int, message_id: int, stream_generator):
        """
        Stream Gemini response to all connections in a chat room

        Args:
            chat_id: Chat room ID
            message_id: Message ID for the bot response
            stream_generator: Async generator yielding text chunks
        """
        if chat_id not in self.active_connections:
            return

        full_response = ""

        async for chunk in stream_generator:
            full_response += chunk

            # Broadcast chunk to all connections in the chat
            message = {
                "type": "bot_stream",
                "chat_id": chat_id,
                "message_id": message_id,
                "chunk": chunk,
                "is_complete": False,
            }

            await self.broadcast_to_chat(message, chat_id)
            # Small delay to prevent overwhelming clients
            await asyncio.sleep(0.01)

        # Send completion message
        completion_message = {
            "type": "bot_stream",
            "chat_id": chat_id,
            "message_id": message_id,
            "chunk": "",
            "is_complete": True,
            "full_response": full_response,
        }
        await self.broadcast_to_chat(completion_message, chat_id)

        return full_response

    def get_user_id(self, websocket: WebSocket) -> int:
        """Get user_id for a websocket"""
        return self.websocket_users.get(websocket)

    def get_username(self, websocket: WebSocket) -> str:
        """Get username for a websocket"""
        return self.websocket_usernames.get(websocket)


# Singleton instance
websocket_manager = ConnectionManager()
