"""
Gemini AI Service
Handles integration with Google's Gemini API for AI responses
"""

from google import genai
from google.genai import types
from typing import AsyncGenerator, List, Dict
from shared.config import GEMINI_API_KEY, GEMINI_MODEL


class GeminiService:
    """Service for interacting with Gemini API"""

    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model_name = GEMINI_MODEL

    async def generate_stream_response(
        self, message: str, history: List[Dict] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response from Gemini

        Args:
            message: The user's message
            history: Chat history in Gemini format [{'role': 'user'/'model', 'parts': [text]}]

        Yields:
            Chunks of the response text
        """
        try:
            # Build conversation history as a simple string if history exists
            # Gemini 2.5 Flash works better with string content
            conversation_context = ""
            if history:
                for msg in history[-10:]:  # Last 10 messages for context
                    role = "User" if msg['role'] == 'user' else "Assistant"
                    content = msg['parts'][0] if msg['parts'] else ""
                    conversation_context += f"{role}: {content}\n\n"

            # Combine context with current message
            full_prompt = conversation_context + f"User: {message}\n\nAssistant:"

            # Generate streaming response with simple string content
            response = self.client.models.generate_content_stream(
                model=self.model_name, contents=full_prompt
            )

            # Stream the response
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception:
            yield "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."

    async def generate_response(self, message: str, history: List[Dict] = None) -> str:
        """
        Generate a complete response from Gemini (non-streaming)

        Args:
            message: The user's message
            history: Chat history in Gemini format

        Returns:
            Complete response text
        """
        try:
            # Build conversation context
            conversation_context = ""
            if history:
                for msg in history[-10:]:  # Last 10 messages for context
                    role = "User" if msg['role'] == 'user' else "Assistant"
                    content = msg['parts'][0] if msg['parts'] else ""
                    conversation_context += f"{role}: {content}\n\n"

            # Combine context with current message
            full_prompt = conversation_context + f"User: {message}\n\nAssistant:"

            response = self.client.models.generate_content(
                model=self.model_name, contents=full_prompt
            )

            return response.text
        except Exception:
            return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."


# Singleton instance
gemini_service = GeminiService()
