"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X } from "lucide-react";
import { chatAPI, apiClient } from "@/lib/api-client";
import type { Chat, Message, WSMessage, ReadReceipt } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useWebSocket } from "@/contexts/websocket-context";
import { ChatMessage } from "@/components/chat-message";
import { ChatAvatar } from "@/components/chat-avatar";
import { ReadReceipts } from "@/components/read-receipts";

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
  const [readReceipts, setReadReceipts] = useState<
    Record<number, ReadReceipt[]>
  >({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if AI bot is present in this chat (any message from bot)
  const hasAIBot = messages.some((msg) => msg.is_bot);

  // Detect if user is typing a bot command
  const isBotCommand = newMessage.startsWith("/bot ");
  const botCommandPreview = isBotCommand ? newMessage.slice(5).trim() : "";

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
        const [chatData, messagesData, receiptsData] = await Promise.all([
          apiClient.get<Chat>(`/api/chats/${chatId}`),
          apiClient.get<Message[]>(`/api/chats/${chatId}/messages`),
          chatAPI.getReadReceipts(parseInt(chatId)),
        ]);
        setChat(chatData);
        setMessages(messagesData);
        setReadReceipts(receiptsData);

        // Mark chat as read when opening it
        try {
          await chatAPI.markChatAsRead(parseInt(chatId));
          // Read receipts will be updated via WebSocket broadcast
        } catch (error) {
          console.error("Failed to mark chat as read:", error);
        }
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

          // Auto-mark chat as read when receiving a message in the current chat
          // (user is viewing this chat, so they're reading the new messages)
          if (wsMessage.message.user_id !== user?.id) {
            // Only mark as read if it's not our own message
            chatAPI.markChatAsRead(parseInt(chatId)).catch((error) => {
              console.error("Failed to auto-mark chat as read:", error);
            });
          }
          // Chat list will be updated by WebSocket context
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
      } else if (
        wsMessage.type === "read_receipts_updated" &&
        wsMessage.read_receipts
      ) {
        // Handle read receipts updates via WebSocket
        if (wsMessage.chat_id === parseInt(chatId)) {
          setReadReceipts(wsMessage.read_receipts);
        }
      }
    };

    // Register message handler
    const cleanup = addMessageHandler(handleWSMessage);

    return cleanup;
  }, [chatId, addMessageHandler]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as any);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!newMessage.trim() && uploadedFiles.length === 0) ||
      isSending ||
      !user ||
      !isConnected
    ) {
      return;
    }

    setIsSending(true);
    const messageContent = newMessage;
    const filesToSend = [...uploadedFiles];
    setNewMessage(""); // Clear input immediately
    setUploadedFiles([]); // Clear files

    try {
      // Build message content with file information
      let fullContent = messageContent;
      if (filesToSend.length > 0) {
        const fileNames = filesToSend.map((f) => f.name).join(", ");
        fullContent = messageContent
          ? `${messageContent}\n\n📎 Attached files: ${fileNames}`
          : `📎 Attached files: ${fileNames}`;
      }

      // Create optimistic message with negative ID to distinguish from real messages
      const tempMessage: Message = {
        id: -Date.now(), // Negative ID for optimistic messages
        chat_id: parseInt(chatId),
        user_id: user.id,
        content: fullContent,
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
        content: fullContent,
      });
      // Read receipts will be updated automatically via WebSocket when others read
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setNewMessage(messageContent);
      setUploadedFiles(filesToSend);
    } finally {
      setIsSending(false);
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
        <ChatAvatar
          name={chat?.name}
          isAIChat={hasAIBot}
          isGroup={chat?.is_group}
          size="md"
        />
        <div className="flex flex-col">
          <h1 className="text-base font-semibold">
            {chat?.name || "Loading..."}
          </h1>
          {hasAIBot && chat?.is_group && (
            <p className="text-muted-foreground text-xs">Group Chat with AI</p>
          )}
          {hasAIBot && !chat?.is_group && (
            <p className="text-muted-foreground text-xs">AI Assistant</p>
          )}
          {!hasAIBot && chat?.is_group && (
            <p className="text-muted-foreground text-xs">Group Chat</p>
          )}
        </div>
      </header>

      {/* Messages Area - Scrollable */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
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
              {messages.map((message, index) => {
                // Find the last message from current user
                const lastUserMessageIndex = messages
                  .map((m, i) => ({ m, i }))
                  .reverse()
                  .find(({ m }) => m.user_id === user?.id)?.i;

                const isLastUserMessage = index === lastUserMessageIndex;

                return (
                  <div key={message.id} className="space-y-0">
                    <ChatMessage
                      message={message}
                      isCurrentUser={message.user_id === user?.id}
                    />
                    {/* Show read receipts only on the last message from current user */}
                    {message.user_id === user?.id &&
                      isLastUserMessage &&
                      readReceipts[message.id] && (
                        <div className="flex justify-end px-2">
                          <ReadReceipts
                            receipts={readReceipts[message.id]}
                            currentUserId={user?.id}
                          />
                        </div>
                      )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="shrink-0 border-t p-4">
        {/* Bot Command Indicator */}
        {isBotCommand && (
          <div className="mb-2 flex items-center gap-2 rounded border-l-4 border-l-blue-500 bg-blue-500/10 p-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white">
              <span className="text-xs font-bold">AI</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Ask Gemini AI
              </p>
              <p className="text-muted-foreground text-xs">
                {botCommandPreview || "Type your question..."}
              </p>
            </div>
          </div>
        )}

        {/* File attachments preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm"
              >
                <Paperclip className="h-4 w-4" />
                <span className="max-w-[200px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="hover:bg-muted-foreground/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
          />

          {/* File upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !isConnected}
            className="shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Message textarea */}
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use /bot for AI)"
            disabled={isSending || !isConnected}
            className="max-h-[200px] min-h-[44px] flex-1 resize-none"
            rows={1}
          />

          {/* Send button */}
          <Button
            type="submit"
            disabled={
              isSending ||
              !isConnected ||
              (!newMessage.trim() && uploadedFiles.length === 0)
            }
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-muted-foreground mt-2 text-xs">
          Tip: Use{" "}
          <code className="bg-muted rounded px-1.5 py-0.5">
            /bot &lt;message&gt;
          </code>{" "}
          to chat with Gemini AI • Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
