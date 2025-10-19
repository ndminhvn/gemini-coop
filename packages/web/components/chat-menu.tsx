"use client";

import * as React from "react";
import { X, Search, ChevronDown, ChevronRight, Users, Image, FileText, Music, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMenuProps {
  isOpen: boolean;
  onClose: () => void;
  chatName: string;
  chatAvatar?: string;
  username?: string;
}

export function ChatMenu({
  isOpen,
  onClose,
  chatName,
  chatAvatar,
  username,
}: ChatMenuProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [membersExpanded, setMembersExpanded] = React.useState(false);
  const [mediaExpanded, setMediaExpanded] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Mock members data
  const members = [
    { id: 1, name: "Alice Johnson", avatar: undefined },
    { id: 2, name: "Bob Smith", avatar: undefined },
    { id: 3, name: "Charlie Brown", avatar: undefined },
    { id: 4, name: "Diana Prince", avatar: undefined },
  ];

  return (
    <div
      className={cn(
        "h-full transform bg-background overflow-hidden border-l border-border",
        isOpen ? "w-80 opacity-100" : "w-0 opacity-0"
      )}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
      }}
    >
      <div className="flex h-full flex-col">
        {/* Profile Section */}
        <div className="flex flex-col items-center gap-3 px-6 py-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={chatAvatar} alt={chatName} />
            <AvatarFallback className="text-2xl">
              {getInitials(chatName)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-semibold">{chatName}</h3>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Menu Options */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Chat Members Accordion */}
          <div className="mb-1">
            <button
              onClick={() => setMembersExpanded(!membersExpanded)}
              className="flex w-full items-center justify-between rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Chat members</span>
              </div>
              {membersExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {membersExpanded && (
              <div className="mt-1 space-y-1 pl-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Media & Files Accordion */}
          <div className="mb-1">
            <button
              onClick={() => setMediaExpanded(!mediaExpanded)}
              className="flex w-full items-center justify-between rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="text-sm font-medium">Media & files</span>
              </div>
              {mediaExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {mediaExpanded && (
              <div className="mt-1 space-y-1 pl-4">
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors">
                  <Image className="h-4 w-4" />
                  <span className="text-sm">Photos</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors">
                  <Video className="h-4 w-4" />
                  <span className="text-sm">Videos</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Files</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors">
                  <Music className="h-4 w-4" />
                  <span className="text-sm">Audio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
