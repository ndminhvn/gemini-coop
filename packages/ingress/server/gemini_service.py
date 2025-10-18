from google import genai
from typing import AsyncGenerator, List, Dict
import os
from dotenv import load_dotenv

load_dotenv()


class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model_name = "gemini-2.0-flash-exp"  # Using latest model

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
            # Build the contents list with history
            contents = []

            # Add history if provided
            if history:
                contents.extend(history)

            # Add current message
            contents.append({'role': 'user', 'parts': [message]})

            # Generate streaming response
            response = self.client.models.generate_content_stream(
                model=self.model_name, contents=contents
            )

            # Stream the response
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            yield f"Error: {str(e)}"

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
            contents = []

            if history:
                contents.extend(history)

            contents.append({'role': 'user', 'parts': [message]})

            response = self.client.models.generate_content(
                model=self.model_name, contents=contents
            )

            return response.text
        except Exception as e:
            return f"Error: {str(e)}"


# Singleton instance
gemini_service = GeminiService()
