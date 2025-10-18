"""
WebSocket test client for Gemini Coop

Usage:
1. Start the server: python -m server.main
2. Run test_api.py to get a token and chat_id
3. Run this script with: python test_websocket.py <token> <chat_id>
"""

import asyncio
import websockets
import json
import sys


async def test_websocket(token, chat_id):
    uri = f"ws://localhost:8000/ws?token={token}"

    print(f"Connecting to {uri}...")

    async with websockets.connect(uri) as websocket:
        print("✅ Connected!")

        # Join chat
        print(f"\n📥 Joining chat {chat_id}...")
        await websocket.send(json.dumps({"type": "join", "chat_id": chat_id}))

        # Start receiving messages in background
        async def receive_messages():
            try:
                while True:
                    message = await websocket.recv()
                    data = json.loads(message)
                    print(f"\n📨 Received: {json.dumps(data, indent=2)}")
            except websockets.exceptions.ConnectionClosed:
                print("\n❌ Connection closed")

        # Start receiver task
        receiver_task = asyncio.create_task(receive_messages())

        # Send test messages
        await asyncio.sleep(1)

        print("\n📤 Sending regular message...")
        await websocket.send(
            json.dumps(
                {
                    "type": "message",
                    "chat_id": chat_id,
                    "content": "Hello from WebSocket test!",
                }
            )
        )

        await asyncio.sleep(2)

        print("\n📤 Sending bot command...")
        await websocket.send(
            json.dumps(
                {
                    "type": "message",
                    "chat_id": chat_id,
                    "content": "/bot Tell me a short joke",
                }
            )
        )

        # Wait for bot response
        print("\n⏳ Waiting for bot response (streaming)...")
        await asyncio.sleep(10)

        print("\n📤 Leaving chat...")
        await websocket.send(json.dumps({"type": "leave", "chat_id": chat_id}))

        await asyncio.sleep(1)

        # Cancel receiver
        receiver_task.cancel()

        print("\n✅ Test complete!")


def main():
    if len(sys.argv) < 3:
        print("Usage: python test_websocket.py <token> <chat_id>")
        print("\nRun test_api.py first to get a token and chat_id")
        sys.exit(1)

    token = sys.argv[1]
    chat_id = int(sys.argv[2])

    print("=" * 50)
    print("WebSocket Test Client")
    print("=" * 50)

    try:
        asyncio.run(test_websocket(token, chat_id))
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
