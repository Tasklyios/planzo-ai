
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea } from '@/types/idea';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, FileText } from "lucide-react";

interface SavedIdeaSelectorProps {
  onIdeaSelect: (idea: GeneratedIdea) => void;
}

const SavedIdeaSelector = ({ onIdeaSelect }: SavedIdeaSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch saved ideas
  const { data: savedIdeas, isLoading } = useQuery({
    queryKey: ['savedIdeas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_ideas')
        .select('*')
        .eq('is_saved', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as GeneratedIdea[];
    },
  });
  
  // Filter ideas based on search term
  const filteredIdeas = savedIdeas?.filter(idea => 
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectIdea = (idea: GeneratedIdea) => {
    onIdeaSelect(idea);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          Use Saved Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Saved Idea</DialogTitle>
          <DialogDescription>
            Choose a saved idea to generate hooks for
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex items-center border rounded-md pl-3 pr-1 py-1">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <Input 
              placeholder="Search ideas..." 
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[50vh] rounded-md border p-2">
              {filteredIdeas && filteredIdeas.length > 0 ? (
                <div className="space-y-2">
                  {filteredIdeas.map((idea) => (
                    <Button
                      key={idea.id}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleSelectIdea(idea)}
                    >
                      <div>
                        <div className="font-medium">{idea.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[350px]">
                          {idea.description.substring(0, 100)}
                          {idea.description.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  {searchTerm ? 'No matching ideas found' : 'No saved ideas found'}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedIdeaSelector;
