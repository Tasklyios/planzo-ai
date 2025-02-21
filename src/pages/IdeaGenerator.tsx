import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, Link } from "react-router-dom";
import {
  LayersIcon,
  Users,
  Video,
  Smartphone,
  Wand2,
  Filter,
  ArrowDownWideNarrow,
  CalendarPlus,
  PenSquare,
  Lightbulb,
  User,
  CreditCard,
  LogOut,
  Menu,
  LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditIdea from "@/components/EditIdea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GeneratedIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  platform?: string;
  symbol?: keyof typeof IconMap;
  color?: string;
}

interface AddToCalendarIdea {
  idea: GeneratedIdea;
  title: string;
  scheduledFor: string;
}

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

// Define available icons map
const IconMap = {
  Lightbulb,
  LayersIcon,
  Users,
  Video,
  Smartphone,
  Wand2,
  Filter,
  ArrowDownWideNarrow,
  CalendarPlus,
  PenSquare,
  User,
  CreditCard,
  LogOut,
  Menu,
} as const;

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

  const getIconComponent = (symbolName?: keyof typeof IconMap): LucideIcon => {
    if (!symbolName || !(symbolName in IconMap)) {
      return Lightbulb;
    }
    return IconMap[symbolName];
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
      </header>

      <main className="container mx-auto px-4 pt-28 pb-12">
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-4xl font-bold text-[#222831] mb-4">Video Idea Generator</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Generate trending video ideas tailored to your niche and audience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <LayersIcon className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Niche</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
                    placeholder="Your niche"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Users className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
                    placeholder="Target audience"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Video className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Type</label>
                  <input
                    type="text"
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value)}
                    className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
                    placeholder="Video type"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                <Smartphone className="text-[#4F92FF] w-5 h-5" />
                <div className="flex-1 w-full">
                  <label className="text-xs md:text-sm font-medium text-gray-700 block md:mb-2">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-2 md:p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC] text-sm"
                  >
                    <option>TikTok</option>
                    <option>Instagram Reels</option>
                    <option>YouTube Shorts</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Ideas Grid - Mobile Responsive */}
          {ideas.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm p-4 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#222831]">Your Video Ideas</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                    <ArrowDownWideNarrow className="w-4 h-4" />
                    Sort
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {ideas.map((idea) => {
                  const IconComponent = getIconComponent(idea.symbol);
                  return (
                    <div
                      key={idea.id}
                      className="group bg-[#F9FAFC] rounded-xl p-4 md:p-6 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-[#4F92FF]/20"
                    >
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-${idea.color || 'blue'}-500/10 flex items-center justify-center text-${idea.color || 'blue'}-500`}>
                            <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                          <div>
                            <span className="text-xs md:text-sm text-[#4F92FF] font-medium">{idea.category}</span>
                            <h3 className="text-sm md:text-lg font-medium text-[#222831]">{idea.title}</h3>
                          </div>
                        </div>
                        <div className="flex gap-1 md:gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addToCalendar(idea)}
                            className="hidden md:flex items-center"
                          >
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Add to Calendar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setEditingIdeaId(idea.id)}
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 md:line-clamp-none">{idea.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {idea.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-[#4F92FF]/10 text-[#4F92FF] text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
};

export default IdeaGenerator;
