
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Send } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { Pagination } from "@/components/ui/pagination";
import { PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ScriptRevision {
  content: string;
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
  
  // Track script revisions
  const [scriptRevisions, setScriptRevisions] = useState<ScriptRevision[]>([]);
  const [currentRevision, setCurrentRevision] = useState(0);

  // Add initial script as first revision
  useEffect(() => {
    if (script && scriptRevisions.length === 0) {
      setScriptRevisions([{
        content: script,
        timestamp: new Date()
      }]);
    }
  }, [script, scriptRevisions.length]);
  
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
      // Get the most recent script revision to send
      const currentScript = scriptRevisions[currentRevision].content;
      
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          type: 'script_coach',
          message: input,
          script: currentScript,
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
      
      // If there's an updated script suggestion, add it as a new revision
      if (data.updatedScript && onScriptUpdate) {
        // Add the new script revision
        const newRevision = {
          content: data.updatedScript,
          timestamp: new Date()
        };
        
        setScriptRevisions(prev => [...prev, newRevision]);
        
        // Update the current revision to the newest one
        const newRevisionIndex = scriptRevisions.length;
        setCurrentRevision(newRevisionIndex);
        
        // Pass the updated script back to the parent component
        onScriptUpdate(data.updatedScript);
        
        toast({
          title: "Script Updated",
          description: "The AI has suggested an improved version of your script (revision " + (newRevisionIndex + 1) + ").",
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

  // Handle revision change
  const handleRevisionChange = (revisionIndex: number) => {
    if (revisionIndex >= 0 && revisionIndex < scriptRevisions.length) {
      setCurrentRevision(revisionIndex);
      
      // Pass the selected revision to the parent component
      if (onScriptUpdate) {
        onScriptUpdate(scriptRevisions[revisionIndex].content);
      }
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b p-3 flex justify-between items-center">
        <h3 className="font-medium">Script Coach</h3>
        
        {scriptRevisions.length > 1 && (
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              Revision: {currentRevision + 1} of {scriptRevisions.length}
            </span>
            <Pagination>
              <PaginationContent>
                {currentRevision > 0 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handleRevisionChange(currentRevision - 1)} 
                      className="cursor-pointer" 
                    />
                  </PaginationItem>
                )}
                
                {/* First page */}
                {scriptRevisions.length > 0 && (
                  <PaginationItem>
                    <PaginationLink 
                      onClick={() => handleRevisionChange(0)}
                      isActive={currentRevision === 0}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Ellipsis for many pages and current page is not near the start */}
                {currentRevision > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {/* Current page and surrounding pages */}
                {scriptRevisions.length > 1 && 
                  Array.from({ length: Math.min(3, scriptRevisions.length) }, (_, i) => {
                    // Center around current page
                    let pageIndex = currentRevision;
                    if (pageIndex === 0) pageIndex = 1;
                    if (pageIndex === scriptRevisions.length - 1 && scriptRevisions.length > 2) 
                      pageIndex = scriptRevisions.length - 2;
                    
                    pageIndex = pageIndex + i - 1;
                    
                    // Skip if out of bounds or already shown (first or last)
                    if (pageIndex <= 0 || pageIndex >= scriptRevisions.length - 1 || 
                        pageIndex === currentRevision - 2 || pageIndex === currentRevision + 2) 
                      return null;
                    
                    return (
                      <PaginationItem key={pageIndex}>
                        <PaginationLink 
                          onClick={() => handleRevisionChange(pageIndex)}
                          isActive={currentRevision === pageIndex}
                          className="cursor-pointer"
                        >
                          {pageIndex + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }).filter(Boolean)}
                
                {/* Ellipsis for many pages and current page is not near the end */}
                {currentRevision < scriptRevisions.length - 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {/* Last page */}
                {scriptRevisions.length > 1 && (
                  <PaginationItem>
                    <PaginationLink 
                      onClick={() => handleRevisionChange(scriptRevisions.length - 1)}
                      isActive={currentRevision === scriptRevisions.length - 1}
                      className="cursor-pointer"
                    >
                      {scriptRevisions.length}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {currentRevision < scriptRevisions.length - 1 && (
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handleRevisionChange(currentRevision + 1)} 
                      className="cursor-pointer" 
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
