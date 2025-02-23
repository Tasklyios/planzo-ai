
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bookmark, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function SearchCommand() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: savedIdeas } = await supabase
        .from("video_ideas")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("is_saved", true);

      const { data: scheduledIdeas } = await supabase
        .from("video_ideas")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .not("scheduled_for", "is", null);

      const combinedResults = [
        ...(savedIdeas || []).map(idea => ({ ...idea, type: 'saved' })),
        ...(scheduledIdeas || []).map(idea => ({ ...idea, type: 'scheduled' }))
      ];

      setSearchResults(combinedResults);
    } catch (error) {
      console.error("Error searching ideas:", error);
    }
  };

  const navigateToIdea = (idea: any) => {
    if (idea.type === 'saved') {
      navigate('/ideas');
    } else {
      navigate('/calendar');
    }
    setIsSearchOpen(false);
  };

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <CommandInput
        placeholder="Search all ideas..."
        onValueChange={handleSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Saved Ideas">
          {searchResults
            .filter(result => result.type === 'saved')
            .map(idea => (
              <CommandItem
                key={idea.id}
                onSelect={() => navigateToIdea(idea)}
                className="flex items-center"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {idea.title}
              </CommandItem>
            ))}
        </CommandGroup>
        <CommandGroup heading="Scheduled Ideas">
          {searchResults
            .filter(result => result.type === 'scheduled')
            .map(idea => (
              <CommandItem
                key={idea.id}
                onSelect={() => navigateToIdea(idea)}
                className="flex items-center"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {idea.title}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
