"use client";

import * as React from "react";
import { Command, MessageSquare, SquarePen, Users, Bot } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { NavUser } from "@/components/nav-user";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import { CreateAIChatDialog } from "@/components/create-ai-chat-dialog";
import { ChatAvatar } from "@/components/chat-avatar";
import { WebSocketStatus } from "@/components/websocket-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useChats } from "@/contexts/chat-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showCreateAIChat, setShowCreateAIChat] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { chats, isLoading } = useChats();
  const { setOpen } = useSidebar();
  const params = useParams();
  const currentChatId = params.chatId as string | undefined;

  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchQuery === "",
  );

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link href="/chat">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Gemini Coop</span>
                    <span className="truncate text-xs">AI Chat</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{
                      children: "All Chats",
                      hidden: false,
                    }}
                    onClick={() => setOpen(true)}
                    className="px-2.5 md:px-2"
                  >
                    <MessageSquare />
                    <span>Chats</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-foreground text-base font-medium">Chats</div>
              <WebSocketStatus />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 w-8 bg-transparent"
                >
                  <SquarePen className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Create a new group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateAIChat(true)}>
                  <Bot className="mr-2 h-4 w-4" />
                  Chat with AI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CreateGroupDialog
              open={showCreateGroup}
              onOpenChange={setShowCreateGroup}
            />
            <CreateAIChatDialog
              open={showCreateAIChat}
              onOpenChange={setShowCreateAIChat}
            />
          </div>
          <SidebarInput
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {isLoading ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  Loading chats...
                </div>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <Link
                    href={`/chat/${chat.id}`}
                    key={chat.id}
                    className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-start gap-3 border-b p-4 text-sm leading-tight last:border-b-0 ${
                      currentChatId === chat.id.toString()
                        ? "bg-sidebar-accent"
                        : ""
                    }`}
                  >
                    <ChatAvatar
                      name={chat.name}
                      isAIChat={!chat.is_group && !chat.name}
                      isGroup={chat.is_group}
                      size="md"
                      className="shrink-0"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {chat.name || "AI Chat"}
                        </span>
                        <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {chat.is_group ? "Group chat" : "Direct chat"}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  {searchQuery ? "No chats found" : "No chats yet"}
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
