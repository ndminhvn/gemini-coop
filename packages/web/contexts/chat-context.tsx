"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { chatAPI } from "@/lib/api-client";
import { Chat, CreateChatRequest } from "@/lib/types";
import { useAuth } from "./auth-context";

interface ChatContextType {
  chats: Chat[];
  isLoading: boolean;
  refreshChats: () => Promise<void>;
  createChat: (data: CreateChatRequest) => Promise<Chat>;
  createAIChat: () => Promise<Chat>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Load chats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshChats();
    }
  }, [isAuthenticated]);

  const refreshChats = async () => {
    try {
      setIsLoading(true);
      const fetchedChats = await chatAPI.getChats();
      setChats(fetchedChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createChat = async (data: CreateChatRequest): Promise<Chat> => {
    try {
      const newChat = await chatAPI.createChat(data);
      setChats([newChat, ...chats]);
      return newChat;
    } catch (error) {
      console.error("Failed to create chat:", error);
      throw error;
    }
  };

  const createAIChat = async (): Promise<Chat> => {
    const newChat = await createChat({
      name: "AI Chat",
      is_group: false,
      is_ai_chat: true,
    });
    // Navigate to the new AI chat
    router.push(`/chat/${newChat.id}`);
    return newChat;
  };

  const value: ChatContextType = {
    chats,
    isLoading,
    refreshChats,
    createChat,
    createAIChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChats() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChats must be used within a ChatProvider");
  }
  return context;
}
