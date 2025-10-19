"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatAvatar } from "@/components/chat-avatar";
import {
  ChevronDown,
  ChevronRight,
  Search,
  UserPlus,
  MoreVertical,
  LogOut,
  Trash2,
  Crown,
  Image,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import type { Chat, User, Message } from "@/lib/types";

interface ChatInfoPanelProps {
  chat: Chat;
  participants: User[];
  messages: Message[];
  currentUserId: number;
  onClose: () => void;
  onInviteUser: () => void;
  onRemoveUser: (userId: number) => void;
  onLeaveChat: () => void;
  onDeleteChat: () => void;
}

export function ChatInfoPanel({
  chat,
  participants,
  messages,
  currentUserId,
  onClose,
  onInviteUser,
  onRemoveUser,
  onLeaveChat,
  onDeleteChat,
}: ChatInfoPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [membersOpen, setMembersOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  // Check if current user is admin (creator of the chat)
  const isAdmin = chat.owner_id === currentUserId;

  // Check if this is an AI chat (has bot messages)
  const isAIChat = messages.some((m) => m.is_bot);

  // Add bot user to participants if this is an AI chat
  const allParticipants = isAIChat
    ? [
        ...participants,
        {
          id: -1, // Special ID for bot
          username: "Gemini AI",
          email: "ai@gemini.bot",
          created_at: new Date().toISOString(),
        } as User,
      ]
    : participants;

  // Extract media, files, and links from messages
  const mediaMessages = messages.filter((m) =>
    m.content.match(/\.(jpg|jpeg|png|gif|webp|svg)/i),
  );
  const fileMessages = messages.filter((m) =>
    m.content.match(/\.(pdf|doc|docx|txt|csv|json|zip)/i),
  );
  const linkMessages = messages.filter((m) =>
    m.content.match(/https?:\/\/[^\s]+/g),
  );

  // Filter messages by search query
  const searchResults = searchQuery
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="bg-background flex h-full w-80 flex-col border-l">
      {/* Header with Avatar */}
      <div className="flex shrink-0 flex-col items-center gap-3 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1" />
          <ChatAvatar
            name={chat.name}
            isAIChat={isAIChat}
            isGroup={chat.is_group}
            size="lg"
            className="h-16 w-16"
          />
          <div className="flex flex-1 justify-end">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-base font-semibold">{chat.name}</h2>
          {chat.is_group && (
            <p className="text-muted-foreground text-xs">
              {allParticipants.length} members
            </p>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="h-[80%] flex-1">
        <div className="space-y-4 p-4">
          {/* Search in Chat */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Search in Chat</span>
            </div>
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
            {searchQuery && (
              <div className="text-muted-foreground text-xs">
                {searchResults.length} result(s) found
              </div>
            )}
          </div>

          <Separator />

          {/* Members */}
          <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:opacity-80">
              <div className="flex items-center gap-2">
                {membersOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  Members • {allParticipants.length}
                </span>
              </div>
              {chat.is_group && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInviteUser();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-2">
              {allParticipants.map((participant) => {
                const isBot = participant.id === -1;
                return (
                  <div
                    key={participant.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-2"
                  >
                    <div className="flex items-center gap-3">
                      <ChatAvatar
                        name={participant.username}
                        isAIChat={isBot}
                        size="sm"
                        className="h-9 w-9"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {participant.username}
                            {participant.id === currentUserId && " (You)"}
                          </span>
                          {chat.owner_id === participant.id && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        {!isBot && (
                          <span className="text-muted-foreground text-xs">
                            {participant.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Member Actions (only for admins and not for self or bot) */}
                    {isAdmin && participant.id !== currentUserId && !isBot && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onRemoveUser(participant.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            Remove from chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Media */}
          <Collapsible open={mediaOpen} onOpenChange={setMediaOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:opacity-80">
              <div className="flex items-center gap-2">
                {mediaOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Image className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Media • {mediaMessages.length}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {mediaMessages.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No media shared yet
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.slice(0, 9).map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-muted aspect-square rounded"
                    >
                      {/* Placeholder for media thumbnails */}
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Files */}
          <Collapsible open={filesOpen} onOpenChange={setFilesOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:opacity-80">
              <div className="flex items-center gap-2">
                {filesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Files • {fileMessages.length}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {fileMessages.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No files shared yet
                </p>
              ) : (
                <div className="space-y-2">
                  {fileMessages.slice(0, 5).map((msg) => (
                    <div
                      key={msg.id}
                      className="hover:bg-muted/50 flex items-center gap-2 rounded-lg p-2"
                    >
                      <FileText className="text-muted-foreground h-8 w-8" />
                      <div className="flex-1 truncate text-xs">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Links */}
          <Collapsible open={linksOpen} onOpenChange={setLinksOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:opacity-80">
              <div className="flex items-center gap-2">
                {linksOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <LinkIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Links • {linkMessages.length}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {linkMessages.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No links shared yet
                </p>
              ) : (
                <div className="space-y-2">
                  {linkMessages.slice(0, 5).map((msg) => (
                    <div
                      key={msg.id}
                      className="hover:bg-muted/50 flex items-center gap-2 rounded-lg p-2"
                    >
                      <LinkIcon className="text-muted-foreground h-4 w-4" />
                      <div className="flex-1 truncate text-xs">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 border-t p-4">
          {!isAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-500 dark:hover:bg-orange-950"
              onClick={onLeaveChat}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Leave Chat
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 w-full justify-start"
              onClick={onDeleteChat}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Chat
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
