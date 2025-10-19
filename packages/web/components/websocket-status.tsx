"use client";

import { useWebSocket } from "@/contexts/websocket-context";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function WebSocketStatus() {
  const { isConnected } = useWebSocket();

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-colors",
        isConnected
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400",
      )}
      title={isConnected ? "Connected" : "Disconnected"}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="font-medium">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span className="font-medium">Connecting...</span>
        </>
      )}
    </div>
  );
}
