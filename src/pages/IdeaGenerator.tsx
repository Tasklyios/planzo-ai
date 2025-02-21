import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Brain,
  Bell,
  Menu,
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditIdea from "@/components/EditIdea";
import * as icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GeneratedIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  platform?: string;
  symbol?: keyof typeof icons;
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

  const validateIconKey = (key: string | undefined): keyof typeof icons => {
    if (!key || !(key in icons)) {
      return 'Lightbulb';
    }
    return key as keyof typeof icons;
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
        symbol: 'Lightbulb' as keyof typeof icons, // Set default icon
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFC] to-white">
      <Navbar />
      <header className="fixed w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="text-[#4F92FF] w-6 h-6" />
            <span className="text-xl font-bold">TrendAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <span className="text-gray-600 hover:text-[#4F92FF] cursor-pointer">Dashboard</span>
            <span className="text-[#4F92FF] font-medium cursor-pointer">Ideas</span>
            <span className="text-gray-600 hover:text-[#4F92FF] cursor-pointer">Calendar</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden md:block px-4 py-2 text-[#4F92FF] hover:bg-[#4F92FF]/10 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                3
              </span>
            </button>
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
              className="w-8 h-8 rounded-full ring-2 ring-[#4F92FF]/20"
              alt="Profile"
            />
            <button className="md:hidden text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-12">
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#222831] mb-4">Video Idea Generator</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Generate trending video ideas tailored to your niche and audience. Our AI analyzes current trends to suggest viral-worthy content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <LayersIcon className="text-[#4F92FF] w-5 h-5" />
                <label className="text-sm font-medium text-gray-700">What niche is your content?</label>
              </div>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC]"
                placeholder="Enter your content niche"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-[#4F92FF] w-5 h-5" />
                <label className="text-sm font-medium text-gray-700">Target Audience</label>
              </div>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC]"
                placeholder="Enter your target audience"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <Video className="text-[#4F92FF] w-5 h-5" />
                <label className="text-sm font-medium text-gray-700">What type of video?</label>
              </div>
              <input
                type="text"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                className="w-full p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC]"
                placeholder="e.g Educational, Entertainment"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="text-[#4F92FF] w-5 h-5" />
                <label className="text-sm font-medium text-gray-700">Platform</label>
              </div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-3 border border-[#EAECEF] rounded-lg bg-[#F9FAFC]"
              >
                <option>TikTok</option>
                <option>Instagram Reels</option>
                <option>YouTube Shorts</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={generateIdeas}
              disabled={loading}
              className="px-8 py-4 bg-[#4F92FF] text-white rounded-xl hover:bg-[#4F92FF]/90 transition-colors shadow-lg shadow-[#4F92FF]/20 hover:shadow-xl hover:shadow-[#4F92FF]/30 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Viral Ideas
                </>
              )}
            </button>
          </div>
        </section>

        {ideas.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[#222831]">Your Video Ideas</h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-gray-600 hover:text-[#4F92FF] bg-gray-50 rounded-lg flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className="px-4 py-2 text-gray-600 hover:text-[#4F92FF] bg-gray-50 rounded-lg flex items-center gap-2">
                  <ArrowDownWideNarrow className="w-4 h-4" />
                  Sort
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {ideas.map((idea) => {
                const IconComponent: LucideIcon = (icons[idea.symbol as keyof typeof icons] as LucideIcon) || Lightbulb;
                return (
                  <div
                    key={idea.id}
                    className="group bg-[#F9FAFC] rounded-xl p-6 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-[#4F92FF]/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-${idea.color || 'blue'}-500/10 flex items-center justify-center text-${idea.color || 'blue'}-500`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm text-[#4F92FF] font-medium">{idea.category}</span>
                          <h3 className="text-lg font-medium text-[#222831]">{idea.title}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => addToCalendar(idea)}
                        >
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Add to Calendar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingIdeaId(idea.id)}
                        >
                          <PenSquare className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600">{idea.description}</p>
                    <div className="flex gap-3 mt-4">
                      {idea.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-3 py-1 bg-[#4F92FF]/10 text-[#4F92FF] text-sm rounded-full">
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
      </main>

      {/* Add to Calendar Dialog */}
      <Dialog open={addingToCalendar !== null} onOpenChange={(open) => !open && setAddingToCalendar(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
          </DialogHeader>
          {addingToCalendar && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={addingToCalendar.title}
                  onChange={(e) => setAddingToCalendar({ ...addingToCalendar, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="scheduled_for">Date</label>
                <Input
                  id="scheduled_for"
                  type="date"
                  value={addingToCalendar.scheduledFor}
                  onChange={(e) => setAddingToCalendar({ ...addingToCalendar, scheduledFor: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingToCalendar(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddToCalendar}>
              Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Idea Dialog */}
      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            fetchSavedIdeas();
          }}
        />
      )}
    </div>
  );
};

export default IdeaGenerator;
