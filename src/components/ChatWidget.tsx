
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Send } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatWidgetProps {
  script?: string;
  onScriptUpdate?: (updatedScript: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ script = '', onScriptUpdate }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: "Hi there! I'm your AI script coach. I can help you improve your script by providing feedback and suggestions. What would you like help with?",
          role: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          type: 'script_coach',
          message: input,
          script: script,
          conversation: messages.map(m => ({ role: m.role, content: m.content }))
        },
      });
      
      if (error) throw error;
      
      if (!data || !data.response) {
        throw new Error('Invalid response from AI');
      }
      
      // Add AI response
      const assistantMessage = {
        id: `ai-${Date.now()}`,
        content: data.response,
        role: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If there's an updated script suggestion, pass it back
      if (data.updatedScript && onScriptUpdate) {
        onScriptUpdate(data.updatedScript);
        toast({
          title: "Script Updated",
          description: "The AI has suggested an improved version of your script.",
        });
      }
      
    } catch (error: any) {
      console.error('Error in chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get response from AI",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b p-3">
        <h3 className="font-medium">Script Coach</h3>
      </div>
      
      {/* Messages container */}
      <div className="h-[300px] overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={cn(
              "flex flex-col max-w-[85%] rounded-lg p-3",
              message.role === 'user' 
                ? "ml-auto bg-primary text-primary-foreground" 
                : "bg-muted"
            )}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>
            <div 
              className={cn(
                "text-xs mt-1",
                message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 bg-muted rounded-lg p-3 max-w-[85%] animate-pulse">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '600ms' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for script advice..."
          className="min-h-[60px] max-h-[120px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatWidget;
