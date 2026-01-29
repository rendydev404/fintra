"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, Sparkles, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIAssistant } from "./ai-assistant-provider";
import { MessageBubble } from "./message-bubble";

export function ChatWidget() {
  const { isOpen, toggleOpen, messages, addMessage, isTyping, setIsTyping } = useAIAssistant();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const text = inputValue;
    setInputValue("");
    
    // Add user message immediately
    const userMsg = { role: "user" as const, content: text };
    addMessage(userMsg);
    setIsTyping(true);

    try {
      // Prepare history for context (last 10 messages)
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...recentMessages, userMsg]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();

      addMessage({
        role: "assistant",
        content: data.content,
        action: data.action ? { ...data.action, status: 'pending' } : undefined
      });

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "Maaf, terjadi kesalahan saat memproses pesan Anda.";
      addMessage({
        role: "assistant",
        content: `Error: ${errorMessage}`
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] max-h-[80vh] flex flex-col bg-background border shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-primary text-primary-foreground flex justify-between items-center bg-gradient-to-r from-violet-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">FinTra AI</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Online Assistant
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 rounded-full"
                onClick={toggleOpen}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/30 scroll-smooth">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                
                {isTyping && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    FinTra sedang mengetik...
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-background border-t">
              <div className="relative flex items-center gap-2">
                <Input
                  className="pr-12 rounded-full border-muted-foreground/20 focus-visible:ring-violet-500 bg-muted/50"
                  placeholder="Tanya sesuatu..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  size="icon"
                  className="absolute right-1 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                AI dapat berbuat kesalahan. Mohon cek kembali informasi penting.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 p-4 bg-violet-600 text-white rounded-full shadow-lg hover:shadow-violet-500/50 transition-all hover:scale-110 active:scale-95 group"
        onClick={toggleOpen}
        whileHover={{ rotate: 15 }}
      >
        <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-20 group-hover:opacity-40" />
        {isOpen ? (
             <X className="w-6 h-6" />
        ) : (
            <MessageSquare className="w-6 h-6" />
        )}
      </motion.button>
    </>
  );
}
