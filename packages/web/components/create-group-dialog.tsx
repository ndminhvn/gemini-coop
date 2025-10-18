"use client";

import * as React from "react";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Mock friends data - replace with actual data later
  const friends: Friend[] = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
    { id: "3", name: "Alice Johnson", email: "alice@example.com" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New group</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Group name (optional)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="border-0 bg-muted/50 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
          />
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 border-0 bg-muted/50 ring-offset-background placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Suggested
            </div>
          )}
          <div className="max-h-[300px] overflow-y-auto">
            {friends
              .filter(friend => 
                friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                friend.email.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {friend.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{friend.name}</div>
                    <div className="text-sm text-muted-foreground">{friend.email}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            console.log("Creating group:", { name: groupName });
            onOpenChange(false);
          }}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}