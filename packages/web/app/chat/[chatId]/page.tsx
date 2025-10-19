"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Chat, Message } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { ChatMessage } from "@/components/chat-message";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { user } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadChat();
    loadMessages();
  }, [chatId]);

  const loadChat = async () => {
    try {
      const chatData = await apiClient.get<Chat>(`/api/chats/${chatId}`);
      setChat(chatData);
    } catch (error) {
      console.error("Failed to load chat:", error);
      router.push("/chat");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await apiClient.get<Message[]>(
        `/api/chats/${chatId}/messages`,
      );
      setMessages(messagesData);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    try {
      // TODO: Implement WebSocket message sending
      // For now, just add to local state
      const tempMessage: Message = {
        id: Date.now(),
        chat_id: parseInt(chatId),
        user_id: user.id,
        content: newMessage,
        is_bot: false,
        username: user.username,
        created_at: new Date().toISOString(),
      };
      setMessages([...messages, tempMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="bg-background flex shrink-0 items-center gap-2 border-b p-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/chat">All Chats</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{chat?.name || "Loading..."}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Messages Area - Scrollable */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <div className="flex-1 space-y-2 overflow-y-auto px-2">
          {loading ? (
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
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.user_id === user?.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="shrink-0 border-t p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (use /bot for AI)"
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
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
  );
}
