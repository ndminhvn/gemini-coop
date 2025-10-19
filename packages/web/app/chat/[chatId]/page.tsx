"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MoreVertical } from "lucide-react";
import { ChatMenu } from "@/components/chat-menu";
import { apiClient } from "@/lib/api-client";
import type { Chat, Message, WSMessage } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useWebSocket } from "@/contexts/websocket-context";
import { ChatMessage } from "@/components/chat-message";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const {
    isConnected,
    sendMessage: sendWSMessage,
    addMessageHandler,
  } = useWebSocket();
  const chatId = params.chatId as string;

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat details and messages
  useEffect(() => {
    const loadChatData = async () => {
      try {
        const [chatData, messagesData] = await Promise.all([
          apiClient.get<Chat>(`/api/chats/${chatId}`),
          apiClient.get<Message[]>(`/api/chats/${chatId}/messages`),
        ]);
        setChat(chatData);
        setMessages(messagesData);
      } catch (error) {
        console.error("Failed to load chat:", error);
        router.push("/chat");
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [chatId, router]);

  // Join chat room when component mounts
  useEffect(() => {
    if (isConnected && chatId) {
      sendWSMessage({
        type: "join",
        chat_id: parseInt(chatId),
      });
    }

    // Leave chat room on unmount
    return () => {
      if (isConnected && chatId) {
        sendWSMessage({
          type: "leave",
          chat_id: parseInt(chatId),
        });
      }
    };
  }, [isConnected, chatId, sendWSMessage]);

  // Listen for incoming WebSocket messages
  useEffect(() => {
    const handleWSMessage = (wsMessage: WSMessage) => {
      if (wsMessage.type === "message" && wsMessage.message) {
        // Only add message if it's for this chat
        if (wsMessage.message.chat_id === parseInt(chatId)) {
          setMessages((prev) => {
            // Remove any optimistic messages from the same user with same content
            // (optimistic messages have negative IDs)
            const withoutOptimistic = prev.filter(
              (m) =>
                !(
                  m.id < 0 &&
                  m.user_id === wsMessage.message!.user_id &&
                  m.content === wsMessage.message!.content
                ),
            );

            // Check if real message already exists
            const exists = withoutOptimistic.some(
              (m) => m.id === wsMessage.message!.id,
            );
            if (exists) {
              return withoutOptimistic;
            }

            return [...withoutOptimistic, wsMessage.message!];
          });
        }
      } else if (wsMessage.type === "bot_stream" && wsMessage.message) {
        // Handle streaming bot responses
        if (wsMessage.message.chat_id === parseInt(chatId)) {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            // If last message is from bot and has same ID, update content
            if (lastMessage?.id === wsMessage.message!.id) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: wsMessage.message!.content },
              ];
            }
            // Otherwise add new message
            return [...prev, wsMessage.message!];
          });
        }
      }
    };

    // Register message handler
    const cleanup = addMessageHandler(handleWSMessage);

    return cleanup;
  }, [chatId, addMessageHandler]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !user || !isConnected) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage(""); // Clear input immediately

    try {
      // Create optimistic message with negative ID to distinguish from real messages
      const tempMessage: Message = {
        id: -Date.now(), // Negative ID for optimistic messages
        chat_id: parseInt(chatId),
        user_id: user.id,
        content: messageContent,
        is_bot: false,
        username: user.username,
        created_at: new Date().toISOString(),
      };

      // Add optimistically to UI
      setMessages((prev) => [...prev, tempMessage]);

      // Send via WebSocket
      sendWSMessage({
        type: "message",
        chat_id: parseInt(chatId),
        content: messageContent,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Chat Messages */}
      <div className="flex flex-col flex-1">
        <header className="bg-background flex shrink-0 items-center gap-3 border-b p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={chat?.avatar} alt={chat?.name || "Chat"} />
            <AvatarFallback>
              {chat?.name ? getInitials(chat.name) : "CH"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {chat?.name || "Loading..."}
          </span>
          
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages Area - Scrollable */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 bg-white">
        <div
          className="flex-1 space-y-2 overflow-y-auto px-2"
          ref={messagesContainerRef}
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="text-muted-foreground mt-2 text-sm">
                  Loading messages...
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isCurrentUser={message.user_id === user?.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="shrink-0 p-4 bg-white border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (use /bot for AI)"
            disabled={isSending || !isConnected}
            className="flex-1 border-0 shadow-none focus-visible:ring-1 bg-muted"
          />
          <Button
            type="submit"
            disabled={isSending || !isConnected || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-muted-foreground mt-2 text-xs">
          Tip: Use{" "}
          <code className="bg-muted rounded px-1.5 py-0.5">
            /bot &lt;message&gt;
          </code>{" "}
          to chat with Gemini AI
        </p>
      </div>
      </div>

      {/* Right Panel - Chat Menu (slides in) */}
      <ChatMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        chatName={chat?.name || "Chat"}
        chatAvatar={chat?.avatar}
        username={chat?.name ? chat.name.toLowerCase().replace(/\s+/g, '') : undefined}
      />
    </div>
  );
}
