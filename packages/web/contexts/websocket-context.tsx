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
  const { refreshChats } = useChats();
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
        // Refresh chat list when invited to a new chat
        refreshChats();

        // Show notification
        if (message.notification) {
          showNotification("New Chat", message.notification);
        }
        break;

      case "message":
        // Show notification if message has content
        if (message.message?.content && message.message?.username) {
          showNotification(message.message.username, message.message.content);
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
