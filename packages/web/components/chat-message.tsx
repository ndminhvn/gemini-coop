"use client";

import { Message } from "@/lib/types";
import {
  Message as MessageContainer,
  MessageContent,
  MessageAvatar,
} from "@/components/ui/shadcn-io/ai/message";
import { ChatAvatar } from "@/components/chat-avatar";
import {
  CodeBlock,
  CodeBlockCopyButton,
} from "@/components/ui/shadcn-io/ai/code-block";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

interface MessagePart {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseMessageContent(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  // Match code blocks with ```language or just ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: "text", content: textContent });
      }
    }

    // Add code block
    const language = match[1] || "plaintext";
    const code = match[2].trim();
    parts.push({ type: "code", content: code, language });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      parts.push({ type: "text", content: textContent });
    }
  }

  // If no parts were added, treat entire content as text
  if (parts.length === 0) {
    parts.push({ type: "text", content });
  }

  return parts;
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  const messageTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Parse message content for code blocks (only for bot messages)
  const messageParts = useMemo(() => {
    if (message.is_bot) {
      return parseMessageContent(message.content);
    }
    return [{ type: "text" as const, content: message.content }];
  }, [message.content, message.is_bot]);

  return (
    <MessageContainer
      from={isCurrentUser ? "user" : "assistant"}
      className={cn(
        "group flex w-full items-start gap-3 py-2",
        isCurrentUser
          ? "flex-row-reverse justify-start"
          : "flex-row justify-start",
      )}
    >
      {/* Avatar - only show for other users/bot */}
      {!isCurrentUser && (
        <div className="shrink-0">
          <ChatAvatar
            name={message.username}
            isAIChat={message.is_bot}
            size="sm"
          />
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[50%]",
          isCurrentUser ? "items-end" : "items-start",
        )}
      >
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
        <div className="flex flex-col gap-2">
          {messageParts.map((part, index) =>
            part.type === "code" ? (
              <CodeBlock
                key={index}
                code={part.content}
                language={part.language || "plaintext"}
                showLineNumbers={part.content.split("\n").length > 3}
              >
                <CodeBlockCopyButton />
              </CodeBlock>
            ) : (
              <MessageContent
                key={index}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : message.is_bot
                      ? "rounded-tl-sm border border-blue-200/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:border-blue-800/20"
                      : "bg-secondary text-foreground rounded-tl-sm",
                )}
              >
                {message.is_bot ? (
                  <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:hidden max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {part.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="break-words whitespace-pre-wrap">
                    {part.content}
                  </div>
                )}
              </MessageContent>
            ),
          )}
        </div>
      </div>
    </MessageContainer>
  );
}
