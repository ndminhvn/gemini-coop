"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <>
      <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">All Chats</BreadcrumbLink>
            </BreadcrumbItem>
            {/* <BreadcrumbSeparator className="hidden md:block" /> */}
            {/* <BreadcrumbItem>
              <BreadcrumbPage>Select a chat</BreadcrumbPage>
            </BreadcrumbItem> */}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">
            Welcome to Gemini Coop! 🤖
          </h2>
          <p className="text-muted-foreground mb-4">
            Select a chat from the sidebar or create a new one to get started
          </p>
          <p className="text-muted-foreground text-sm">
            Use{" "}
            <code className="bg-muted rounded px-2 py-1">
              /bot &lt;message&gt;
            </code>{" "}
            to interact with AI
          </p>
        </div>
      </div>
    </>
  );
}
