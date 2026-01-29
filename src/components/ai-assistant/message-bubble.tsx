"use client";

import { useAppStore } from "@/stores/app-store"; // Assuming you have an app store for user info
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ActionCard } from "./action-card";
import { Message, useAIAssistant } from "./ai-assistant-provider";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, action, timestamp } = message;
  const { user } = useAppStore();
  const { updateActionStatus } = useAIAssistant();
  
  const isUser = role === "user";

  const handleActionConfirm = () => {
    // In a real app, this would call an API
    console.log("Action Confirmed:", action);
    updateActionStatus(message.id, "confirmed");
  };

  const handleActionCancel = () => {
    updateActionStatus(message.id, "cancelled");
  };

  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 border shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={user?.avatar_url || ""} />
            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
          </>
        ) : (
          <>
             <AvatarImage src="/bot-avatar.png" />
             <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-none" 
            : "bg-muted text-foreground rounded-bl-none border"
        )}>
          <div className="prose dark:prose-invert text-sm break-words prose-p:leading-relaxed prose-pre:bg-muted">
             <ReactMarkdown 
               components={{
                 p: (props: any) => <span className="block">{props.children}</span> // Prevent hydration mismatch with p inside p
               }}
             >
               {content}
             </ReactMarkdown>
          </div>
        </div>

        {action && (
          <div className="w-full mt-1">
            <ActionCard 
              action={action} 
              onConfirm={handleActionConfirm}
              onCancel={handleActionCancel}
            />
            {action.status === "confirmed" && (
                <div className="text-xs text-center text-green-500 font-medium py-1 bg-green-500/10 rounded-full">
                    Aksi berhasil dikonfirmasi ✅
                </div>
            )}
            {action.status === "cancelled" && (
                <div className="text-xs text-center text-muted-foreground font-medium py-1 bg-muted rounded-full">
                    Aksi dibatalkan ❌
                </div>
            )}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground px-1">
          {format(new Date(timestamp), "HH:mm", { locale: id })}
        </span>
      </div>
    </div>
  );
}
