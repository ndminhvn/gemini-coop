"use client";

import * as React from "react";
import { Search, Check } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChats } from "@/contexts/chat-context";
import { useState } from "react";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [includeAI, setIncludeAI] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { createChat } = useChats();
  const router = useRouter();

  // TODO: Replace with actual user search API
  // For now, users would need to type exact usernames
  const searchResults = searchQuery.length > 0 ? [searchQuery] : [];

  const toggleUser = (username: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const newChat = await createChat({
        name: groupName || undefined,
        is_group: true,
        is_ai_chat: includeAI && selectedUsers.size === 0, // Only AI if no other users
        participant_usernames: Array.from(selectedUsers),
      });

      // Reset form
      setGroupName("");
      setSearchQuery("");
      setSelectedUsers(new Set());
      setIncludeAI(false);
      onOpenChange(false);

      // Navigate to new chat
      router.push(`/chat/${newChat.id}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
      alert("Failed to create chat. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Create new group
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Group name (optional)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="bg-muted/50 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div
            className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-lg p-3"
            onClick={() => setIncludeAI(!includeAI)}
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                includeAI
                  ? "bg-primary border-primary"
                  : "border-muted-foreground"
              }`}
            >
              {includeAI && (
                <Check className="text-primary-foreground h-3 w-3" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">Include AI Bot</div>
              <div className="text-muted-foreground text-sm">
                Add Gemini AI to your group
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search users by username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring border-0 pl-8 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {selectedUsers.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedUsers).map((username) => (
                <div
                  key={username}
                  className="bg-primary/10 text-primary flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                >
                  {username}
                  <button
                    onClick={() => toggleUser(username)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="max-h-[200px] space-y-1 overflow-y-auto">
              {searchResults.map((username) => (
                <div
                  key={username}
                  onClick={() => {
                    toggleUser(username);
                    setSearchQuery("");
                  }}
                  className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-lg p-2"
                >
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{username}</div>
                  </div>
                  {selectedUsers.has(username) && (
                    <Check className="text-primary h-4 w-4" />
                  )}
                </div>
              ))}
            </div>
          )}
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
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
