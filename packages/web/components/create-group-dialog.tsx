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
import { useState, useEffect } from "react";
import { authAPI } from "@/lib/api-client";
import type { User } from "@/lib/types";

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
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [includeAI, setIncludeAI] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { createChat } = useChats();
  const router = useRouter();

  // Debounced user search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const results = await authAPI.searchUsers(searchQuery);
        // Filter out already selected users
        const filteredResults = results.filter(
          (user) => !selectedUsers.some((u) => u.id === user.id),
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Failed to search users:", error);
        // Don't throw error, just show no results
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedUsers]);

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const newChat = await createChat({
        name: groupName || undefined,
        is_group: true,
        is_ai_chat: includeAI && selectedUsers.length === 0, // Only AI if no other users
        participant_usernames: selectedUsers.map((u) => u.username),
      });

      // Reset form
      setGroupName("");
      setSearchQuery("");
      setSelectedUsers([]);
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
            className="bg-muted/50 ring-offset-background focus-visible:ring-ring border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
              placeholder="Search users by username or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50 ring-offset-background focus-visible:ring-ring border-0 pl-8 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Loading indicator */}
          {isSearching && searchQuery.length >= 2 && (
            <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Searching...
            </div>
          )}

          {/* No results message */}
          {!isSearching &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-6 text-center text-sm">
                <p className="font-medium">No users found</p>
                <p className="text-xs">Try searching by username or email</p>
              </div>
            )}

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-primary/10 text-primary flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                >
                  {user.username}
                  <button
                    onClick={() => toggleUser(user)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search results */}
          {!isSearching && searchResults.length > 0 && (
            <div className="max-h-[200px] space-y-1 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    toggleUser(user);
                    setSearchQuery("");
                  }}
                  className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-lg p-2"
                >
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-muted-foreground text-xs">
                      {user.email}
                    </div>
                  </div>
                  {selectedUsers.some((u) => u.id === user.id) && (
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
          <Button
            onClick={handleCreate}
            disabled={isCreating || (selectedUsers.length === 0 && !includeAI)}
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
