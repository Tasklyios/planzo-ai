
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  type: 'idea' | 'scheduled';
  created_at: string;
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search in video_ideas
      const { data: ideaResults, error: ideaError } = await supabase
        .from('video_ideas')
        .select('id, title, created_at')
        .ilike('title', `%${query}%`)
        .limit(5);

      // Search in scheduled_content
      const { data: scheduledResults, error: scheduledError } = await supabase
        .from('scheduled_content')
        .select('id, title, created_at')
        .ilike('title', `%${query}%`)
        .limit(5);

      if (ideaError || scheduledError) throw ideaError || scheduledError;

      const formattedResults: SearchResult[] = [
        ...(ideaResults?.map(item => ({
          ...item,
          type: 'idea' as const
        })) || []),
        ...(scheduledResults?.map(item => ({
          ...item,
          type: 'scheduled' as const
        })) || [])
      ].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    if (result.type === 'idea') {
      navigate(`/ideas?selected=${result.id}`);
    } else {
      navigate(`/calendar?selected=${result.id}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full max-w-xl h-10 flex items-center gap-2 px-4 rounded-lg border bg-white shadow-sm text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Search ideas and content...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search all ideas and scheduled content..." 
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span>{result.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.type === 'idea' ? 'Idea' : 'Scheduled'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
