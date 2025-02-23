
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Bookmark,
  Calendar as CalendarIcon,
  User,
  Settings,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";

interface AppLayoutProps {
  children: React.ReactNode;
}

const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/generator', label: 'Generator', icon: Sparkles },
  { path: '/ideas', label: 'Ideas', icon: Bookmark },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
] as const;

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0">
        <div className="p-6">
          <div className="text-2xl font-bold text-[#4F92FF]">TrendAI</div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-[#4F92FF] text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex flex-col space-y-2">
            <Button
              variant="ghost"
              className="justify-start space-x-3"
              onClick={() => navigate('/account')}
            >
              <User className="h-5 w-5" />
              <span>Account</span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start space-x-3"
              onClick={() => navigate('/account')}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start space-x-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64 w-full">
        {children}
      </main>

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
    </div>
  );
}
