"use client";

import { ReadReceipt } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReadReceiptsProps {
  receipts: ReadReceipt[];
  currentUserId?: number; // Optional: to filter out current user
}

export function ReadReceipts({ receipts, currentUserId }: ReadReceiptsProps) {
  // Filter out current user if provided
  const displayReceipts = currentUserId
    ? receipts.filter((r) => r.user_id !== currentUserId)
    : receipts;

  if (displayReceipts.length === 0) {
    return null;
  }

  // Limit to 3 visible avatars for space
  const visibleReceipts = displayReceipts.slice(0, 3);
  const remainingCount = displayReceipts.length - visibleReceipts.length;

  return (
    <div className="mt-1 flex items-center justify-end gap-0.5">
      <TooltipProvider>
        {visibleReceipts.map((receipt, index) => (
          <Tooltip key={receipt.user_id} delayDuration={200}>
            <TooltipTrigger asChild>
              <div
                className="relative"
                style={{
                  marginLeft: index > 0 ? "-8px" : "0",
                  zIndex: visibleReceipts.length - index,
                }}
              >
                <Avatar className="border-background h-4 w-4 border">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-[8px] text-white">
                    {receipt.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>
                {receipt.username} •{" "}
                {new Date(receipt.read_at).toLocaleString()}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div
                className="relative flex items-center justify-center"
                style={{
                  marginLeft: "-8px",
                  zIndex: 0,
                }}
              >
                <div className="border-background bg-muted flex h-4 w-4 items-center justify-center rounded-full border">
                  <span className="text-muted-foreground text-[6px] font-medium">
                    +{remainingCount}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>
                {displayReceipts
                  .slice(3)
                  .map((r) => r.username)
                  .join(", ")}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
