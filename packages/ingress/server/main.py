import asyncio
import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import uvicorn

# from google import genai

load_dotenv()


app = FastAPI()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received from client: {data}")
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
