import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  CreditCard,
  LogOut,
  Menu,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EditIdea from "@/components/EditIdea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import InputForm from "@/components/idea-generator/InputForm";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import { GeneratedIdea, AddToCalendarIdea, IconMap } from "@/types/idea";

interface SupabaseIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  platform?: string;
  symbol?: string;
  color?: string;
  created_at?: string;
  is_saved?: boolean;
  script?: string;
  user_id?: string;
}

const IdeaGenerator = () => {
  const [niche, setNiche] = useState(() => localStorage.getItem("niche") || "");
  const [audience, setAudience] = useState(() => localStorage.getItem("audience") || "");
  const [videoType, setVideoType] = useState(() => localStorage.getItem("videoType") || "");
  const [platform, setPlatform] = useState(() => localStorage.getItem("platform") || "TikTok");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const validateIconKey = (key: string | undefined): keyof typeof IconMap => {
    if (!key || !(key in IconMap)) {
      return 'Lightbulb';
    }
    return key as keyof typeof IconMap;
  };

  const transformSupabaseIdea = (idea: SupabaseIdea): GeneratedIdea => {
    return {
      id: idea.id,
      title: idea.title,
      category: idea.category,
      description: idea.description,
      tags: idea.tags,
      platform: idea.platform,
      symbol: validateIconKey(idea.symbol),
      color: idea.color,
    };
  };

  // Load saved ideas on mount
  useEffect(() => {
    fetchSavedIdeas();
  }, []);

  // Save inputs to localStorage
  useEffect(() => {
    localStorage.setItem("niche", niche);
    localStorage.setItem("audience", audience);
    localStorage.setItem("videoType", videoType);
    localStorage.setItem("platform", platform);
  }, [niche, audience, videoType, platform]);

  const fetchSavedIdeas = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id);

      if (error) throw error;
      
      // Transform the data before setting it to state
      const transformedIdeas = (data || []).map(transformSupabaseIdea);
      setIdeas(transformedIdeas);
    } catch (error: any) {
      console.error("Error fetching ideas:", error);
    }
  };

  const addToCalendar = async (idea: GeneratedIdea) => {
    setAddingToCalendar({
      idea,
      title: idea.title,
      scheduledFor: new Date().toISOString().split('T')[0],
    });
  };

  const handleAddToCalendar = async () => {
    if (!addingToCalendar) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/auth");
        return;
      }

      const scheduledDate = new Date(addingToCalendar.scheduledFor);
      scheduledDate.setHours(12, 0, 0, 0);

      const { error } = await supabase.from("scheduled_content").insert({
        title: addingToCalendar.title,
        platform: addingToCalendar.idea.platform || platform,
        scheduled_for: scheduledDate.toISOString(),
        user_id: userId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Idea added to calendar",
      });

      setAddingToCalendar(null);
      navigate("/calendar");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const generateIdeas = async () => {
    if (!niche || !audience || !videoType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating ideas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          niche,
          audience,
          videoType,
          platform,
        },
      });

      if (error) throw error;

      if (!data || !data.ideas) {
        throw new Error('Invalid response format from AI');
      }

      // Transform and validate the generated ideas before saving
      const ideasToSave = data.ideas.map((idea: any) => ({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        tags: idea.tags,
        platform: platform,
        user_id: userId,
        symbol: 'Lightbulb' as keyof typeof IconMap, // Set default icon
        color: 'blue', // Set default color
      }));

      const { error: saveError } = await supabase
        .from("video_ideas")
        .insert(ideasToSave);

      if (saveError) throw saveError;

      // Transform the ideas before setting to state
      const transformedIdeas = ideasToSave.map(transformSupabaseIdea);
      setIdeas(transformedIdeas);

      toast({
        title: "Success!",
        description: "Your video ideas have been generated and saved.",
      });
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to generate ideas. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFC] to-white">
      <header className="fixed w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-[#4F92FF]">TrendAI</div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-gray-600 hover:text-[#4F92FF] cursor-pointer">
              Dashboard
            </Link>
            <Link to="/ideas" className="text-[#4F92FF] font-medium cursor-pointer">
              Ideas
            </Link>
            <Link to="/calendar" className="text-gray-600 hover:text-[#4F92FF] cursor-pointer">
              Calendar
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="ghost" className="md:hidden" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-12">
        <section className="mb-12">
          <GeneratorHeader />
          <InputForm
            niche={niche}
            audience={audience}
            videoType={videoType}
            platform={platform}
            setNiche={setNiche}
            setAudience={setAudience}
            setVideoType={setVideoType}
            setPlatform={setPlatform}
          />

          {/* Generate Button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={generateIdeas}
              disabled={loading}
              className="bg-[#4F92FF] hover:bg-[#4F92FF]/90 text-white px-8 py-2 rounded-lg font-medium"
            >
              {loading ? "Generating..." : "Generate Viral Ideas"}
            </Button>
          </div>

          <IdeasGrid
            ideas={ideas}
            onAddToCalendar={addToCalendar}
            onEdit={(ideaId) => setEditingIdeaId(ideaId)}
          />
        </section>
      </main>

      {/* Dialogs */}
      <Dialog open={!!addingToCalendar} onOpenChange={() => setAddingToCalendar(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <input
                id="title"
                type="text"
                value={addingToCalendar?.title || ""}
                onChange={(e) => setAddingToCalendar(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <input
                id="date"
                type="date"
                value={addingToCalendar?.scheduledFor || ""}
                onChange={(e) => setAddingToCalendar(prev => prev ? { ...prev, scheduledFor: e.target.value } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddToCalendar}>Add to Calendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => setEditingIdeaId(null)}
        />
      )}

      {/* Mobile Menu Dialog */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="h-screen w-screen sm:max-w-[300px] p-0">
          <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <div className="flex-1 overflow-auto py-4">
              <div className="space-y-3 px-4">
                <Link 
                  to="/dashboard" 
                  className="block py-2 text-gray-600 hover:text-[#4F92FF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/ideas" 
                  className="block py-2 text-gray-600 hover:text-[#4F92FF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ideas
                </Link>
                <Link 
                  to="/calendar" 
                  className="block py-2 text-gray-600 hover:text-[#4F92FF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calendar
                </Link>
              </div>
            </div>
            <div className="border-t p-4">
              <Button onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IdeaGenerator;
