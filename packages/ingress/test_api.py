"""
Test script for Gemini Coop API

Run this after starting the server to test basic functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health check endpoint"""
    print("\n1. Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200


def test_register():
    """Test user registration"""
    print("\n2. Testing user registration...")
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
    }
    response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200


def test_login():
    """Test user login"""
    print("\n3. Testing user login...")
    data = {"username": "testuser", "password": "testpassword123"}
    response = requests.post(f"{BASE_URL}/api/auth/login", json=data)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {result}")
    if response.status_code == 200:
        return result.get("access_token")
    return None


def test_create_chat(token):
    """Test chat creation"""
    print("\n4. Testing chat creation...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"name": "Test Chat", "is_group": True}
    response = requests.post(f"{BASE_URL}/api/chats", json=data, headers=headers)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {result}")
    if response.status_code == 200:
        return result.get("id")
    return None


def test_get_chats(token):
    """Test getting user chats"""
    print("\n5. Testing get chats...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/chats", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200


def test_get_messages(token, chat_id):
    """Test getting chat messages"""
    print("\n6. Testing get messages...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/chats/{chat_id}/messages", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200


def main():
    print("=" * 50)
    print("Gemini Coop API Test Suite")
    print("=" * 50)

    try:
        # Test health
        if not test_health():
            print("\n❌ Health check failed! Is the server running?")
            return

        # Test registration
        if not test_register():
            print("\n⚠️  Registration failed (user might already exist)")

        # Test login
        token = test_login()
        if not token:
            print("\n❌ Login failed!")
            return

        print(f"\n✅ Login successful! Token: {token[:20]}...")

        # Test chat creation
        chat_id = test_create_chat(token)
        if not chat_id:
            print("\n❌ Chat creation failed!")
            return

        print(f"\n✅ Chat created! ID: {chat_id}")

        # Test getting chats
        if test_get_chats(token):
            print("\n✅ Get chats successful!")

        # Test getting messages
        if test_get_messages(token, chat_id):
            print("\n✅ Get messages successful!")

        print("\n" + "=" * 50)
        print("✅ All tests passed!")
        print("=" * 50)
        print(f"\nYou can now test WebSocket connection with:")
        print(f"Token: {token}")
        print(f"Chat ID: {chat_id}")
        print(f"WebSocket URL: ws://localhost:8000/ws?token={token}")

    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to server!")
        print("   Make sure the server is running: python -m server.main")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
