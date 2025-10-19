"use client";

import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const [dots, setDots] = useState("");

  // Animate dots
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  if (typingUsers.length === 0) return null;

  const getMessage = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing${dots}`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing${dots}`;
    } else {
      return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing${dots}`;
    }
  };

  return (
    <div className="text-muted-foreground flex items-center gap-2 px-4 py-2 text-sm italic">
      <div className="flex gap-1">
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></span>
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></span>
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-blue-500"></span>
      </div>
      <span>{getMessage()}</span>
    </div>
  );
}
