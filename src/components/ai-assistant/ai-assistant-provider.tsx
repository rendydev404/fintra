"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ActionType = "budget" | "goal" | "subscription";

export type ActionData = {
  type: ActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  status: "pending" | "confirmed" | "cancelled";
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: ActionData;
  timestamp: Date;
};

type AIAssistantContextType = {
  isOpen: boolean;
  toggleOpen: () => void;
  messages: Message[];
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateActionStatus: (messageId: string, status: ActionData["status"]) => void;
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
};

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Halo! Saya asisten keuangan pribadimu. Saya bisa bantu buat rencana budget, target nabung, atau analisa pengeluaranmu. Mau mulai dari mana?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const updateActionStatus = (messageId: string, status: ActionData["status"]) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.action
          ? { ...msg, action: { ...msg.action, status } }
          : msg
      )
    );
  };

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        toggleOpen,
        messages,
        addMessage,
        updateActionStatus,
        isTyping,
        setIsTyping,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider");
  }
  return context;
};
