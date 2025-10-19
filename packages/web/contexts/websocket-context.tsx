"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./auth-context";
import { useChats } from "./chat-context";
import { chatAPI } from "@/lib/api-client";
import { WSMessage } from "@/lib/types";

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: WSMessage) => void;
  addMessageHandler: (handler: (message: WSMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const { refreshChats, updateChat } = useChats();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const messageHandlersRef = useRef<Set<(message: WSMessage) => void>>(
    new Set(),
  );

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const connect = () => {
      try {
        const wsUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const wsProtocol = wsUrl.startsWith("https") ? "wss" : "ws";
        const wsHost = wsUrl.replace(/^https?:\/\//, "");

        const ws = new WebSocket(`${wsProtocol}://${wsHost}/ws?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          reconnectAttempts.current = 0;
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);

          // Attempt to reconnect with exponential backoff
          if (isAuthenticated && reconnectAttempts.current < 5) {
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current),
              30000,
            );
            console.log(`Reconnecting in ${delay}ms...`);
            reconnectAttempts.current++;

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token]);

  const fetchAndUpdateSingleChat = async (chatId: number) => {
    try {
      // Fetch all chats to get the updated unread count for the specific chat
      const allChats = await chatAPI.getChats();
      const updatedChat = allChats.find((c) => c.id === chatId);
      if (updatedChat) {
        updateChat(chatId, updatedChat);
      }
    } catch (error) {
      console.error("Failed to fetch single chat update:", error);
    }
  };

  const handleWebSocketMessage = (message: WSMessage) => {
    console.log("WebSocket message received:", message);

    // Notify all registered handlers
    messageHandlersRef.current.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("Error in message handler:", error);
      }
    });

    switch (message.type) {
      case "chat_created":
      case "chat_invite":
        // Refresh chat list when invited to a new chat (need full refresh for new chat)
        refreshChats();

        // Show notification
        if (message.notification) {
          showNotification("New Chat", message.notification);
        }
        break;

      case "message":
        // Update chat locally without full refresh to prevent flickering
        if (message.message?.chat_id) {
          // Check if user is currently viewing this chat
          const isViewingChat =
            window.location.pathname === `/chat/${message.message.chat_id}`;

          // If not viewing, we need to fetch the updated chat to get the correct unread count
          // If viewing, just update the last message without changing unread count
          if (isViewingChat) {
            // User is viewing this chat, don't increment unread count
            updateChat(message.message.chat_id, {
              last_message: message.message.content,
              last_message_time: message.message.created_at,
            });
          } else {
            // User is NOT viewing this chat, fetch updated data to get new unread count
            fetchAndUpdateSingleChat(message.message.chat_id);
          }
        }

        // Show notification if message has content
        if (message.message?.content && message.message?.username) {
          showNotification(message.message.username, message.message.content);
        }
        break;

      case "read_receipts_updated":
        // Fetch updated chat data to get new unread count without full refresh
        // This is more efficient than refreshing all chats
        if (message.chat_id) {
          fetchAndUpdateSingleChat(message.chat_id);
        }
        break;

      case "bot_stream":
        // Handle bot streaming (will be implemented with real-time chat)
        break;

      case "typing":
        // Handle typing indicators (future feature)
        break;

      case "user_joined":
      case "user_left":
        // Handle user presence (future feature)
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  };

  const showNotification = (title: string, body: string) => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, {
              body,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }

    // Also show in-app toast notification (you can enhance this with a toast library)
    console.log(`Notification: ${title} - ${body}`);
  };

  const sendMessage = (message: WSMessage) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  };

  const addMessageHandler = (handler: (message: WSMessage) => void) => {
    messageHandlersRef.current.add(handler);
    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  };

  const value: WebSocketContextType = {
    isConnected,
    sendMessage,
    addMessageHandler,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
