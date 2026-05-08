'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  X, 
  Send, 
  Minus, 
  Maximize2,
  Sparkles,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from './AuthProvider';
import { aiApi } from '@/lib/api';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function FloatingAiTutor() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your AI learning assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Placeholder - will render conditionally after hooks

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiApi.post('/chat', {
        messages: [...messages, userMsg],
        stream: false
      });
      
      const aiMsg: ChatMessage = { 
        role: 'assistant', 
        content: response.data.content || response.data.response 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Try again later!" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages, loading]);

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end p-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[380px] h-[520px] glass border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col p-2"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI Tutor</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] opacity-80">Online & Ready</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {user.role !== 'instructor' && (
                  <Link href="/ai-tutor">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-full">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 hover:bg-white/10 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-br-none" 
                        : "bg-white/10 border border-white/10 rounded-bl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl p-3 flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" />
                      <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-white/5 border-t border-white/5">
              <div className="relative flex gap-2">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="bg-background/50 border-white/10 rounded-xl pr-10 focus-visible:ring-indigo-500"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 w-10 h-10 rounded-xl flex-shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Try: <span className="text-indigo-400 cursor-pointer" onClick={() => setInput("Explain Python decorators")}>"Explain Python decorators"</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 border border-white/20 relative group overflow-hidden",
          isOpen ? "bg-zinc-900 rotate-90" : "bg-indigo-600"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <X className="w-8 h-8 text-white" />
        ) : (
          <>
            <MessageCircle className="w-8 h-8 text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-background rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
               <Sparkles className="w-8 h-8 text-white/40 animate-pulse" />
            </div>
          </>
        )}
      </motion.button>
    </div>
  );
}
