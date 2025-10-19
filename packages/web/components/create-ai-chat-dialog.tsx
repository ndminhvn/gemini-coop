"use client";

import * as React from "react";
import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useChats } from "@/contexts/chat-context";
import { useState } from "react";

interface CreateAIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAIChatDialog({
  open,
  onOpenChange,
}: CreateAIChatDialogProps) {
  const [chatName, setChatName] = React.useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createChat } = useChats();
  const router = useRouter();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const newChat = await createChat({
        name: chatName.trim() || "AI Chat",
        is_group: false,
        is_ai_chat: true,
      });

      // Reset form
      setChatName("");
      onOpenChange(false);

      // Navigate to new chat
      router.push(`/chat/${newChat.id}`);
    } catch (error) {
      console.error("Failed to create AI chat:", error);
      alert("Failed to create AI chat. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Chat with AI
          </DialogTitle>
          <DialogDescription className="text-center">
            Start a conversation with Gemini AI assistant
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="chatName">Chat Name (optional)</Label>
            <Input
              id="chatName"
              placeholder="e.g., My AI Assistant, Code Helper..."
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Leave blank to use "AI Chat" as default
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Start Chat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
