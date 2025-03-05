
import { useEffect, useState, useCallback } from "react";
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
import debounce from "lodash/debounce";
import { useToast } from "@/components/ui/use-toast";

interface SearchResult {
  id: string;
  title: string;
  type: 'idea' | 'scheduled';
  created_at: string;
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to search for ideas",
        });
        setLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;

      // Fetch video ideas
      const { data: ideaResults, error: ideaError } = await supabase
        .from('video_ideas')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .ilike('title', `%${searchQuery}%`)
        .limit(8);

      if (ideaError) throw ideaError;

      // Fetch scheduled content
      const { data: scheduledResults, error: scheduledError } = await supabase
        .from('scheduled_content')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .ilike('title', `%${searchQuery}%`)
        .limit(4);

      if (scheduledError) throw scheduledError;

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
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Failed to fetch search results. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounce the search to avoid too many requests
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => performSearch(searchQuery), 300),
    []
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

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

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery(""); // Reset query when selecting
    
    if (result.type === 'idea') {
      // If we're already on the ideas page, we need to use a different approach
      if (window.location.pathname === '/ideas') {
        // We can either refresh the page with a query parameter
        // or use a more sophisticated state management approach
        window.location.href = `/ideas?selected=${result.id}`;
      } else {
        navigate(`/ideas?selected=${result.id}`);
      }
    } else {
      navigate(`/calendar?selected=${result.id}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-10 flex items-center gap-2 px-4 rounded-lg border bg-card text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">Search ideas and content...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search all ideas and scheduled content..." 
          value={query}
          onValueChange={setQuery}
          autoFocus
        />
        <CommandList>
          <CommandEmpty>
            {query.trim() ? "No results found." : "Type to search..."}
          </CommandEmpty>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          )}
          {!loading && results.length > 0 && (
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
