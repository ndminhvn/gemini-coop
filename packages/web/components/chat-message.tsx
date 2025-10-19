"use client";

import { Message } from "@/lib/types";
import {
  Message as MessageContainer,
  MessageContent,
  MessageAvatar,
} from "@/components/ui/shadcn-io/ai/message";
import { ChatAvatar } from "@/components/chat-avatar";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  const messageTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <MessageContainer
      from={isCurrentUser ? "user" : "assistant"}
      className={cn(
        "group flex w-full items-end gap-3 py-2",
        isCurrentUser
          ? "flex-row-reverse justify-start"
          : "flex-row justify-start",
      )}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <ChatAvatar
          name={message.username}
          isAIChat={message.is_bot}
          size="sm"
        />
      </div>

      {/* Message Content */}
      <div className="flex max-w-[70%] flex-col gap-1">
        {/* Username and timestamp */}
        <div
          className={cn(
            "flex items-center gap-2 px-1",
            isCurrentUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-foreground text-xs font-semibold">
            {isCurrentUser ? "You" : message.username}
          </span>
          <span className="text-muted-foreground text-xs">{messageTime}</span>
        </div>

        {/* Message bubble */}
        <MessageContent
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : message.is_bot
                ? "rounded-tl-sm border border-blue-200/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:border-blue-800/20"
                : "bg-secondary text-foreground rounded-tl-sm",
          )}
        >
          <div className="break-words whitespace-pre-wrap">
            {message.content}
          </div>
        </MessageContent>
      </div>
    </MessageContainer>
  );
}
