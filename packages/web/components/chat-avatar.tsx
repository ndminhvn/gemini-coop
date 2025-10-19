"use client";

import { Bot } from "lucide-react";

interface ChatAvatarProps {
  name?: string | null;
  isAIChat?: boolean;
  isGroup?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ChatAvatar({
  name,
  isAIChat = false,
  isGroup = false,
  size = "md",
  className = "",
}: ChatAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const getInitials = (text?: string | null) => {
    if (!text) return "?";
    const words = text.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  if (isAIChat) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white`}
      >
        <Bot
          className={
            size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${className} bg-muted text-foreground flex items-center justify-center rounded-full font-semibold`}
    >
      {getInitials(name)}
    </div>
  );
}
