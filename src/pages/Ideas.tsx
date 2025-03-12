
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import { GeneratedIdea } from "@/types/idea";
import EditIdea from "@/components/EditIdea";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { AddToCalendarIdea } from "@/types/idea";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SavedHooksView from "@/components/hooks/SavedHooksView";
import { HookType } from "@/types/hooks";
import { getSavedHooks } from "@/services/hookService";
import { useQuery } from "@tanstack/react-query";

export default function Ideas() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [selectedHook, setSelectedHook] = useState<HookType | null>(null);
  const [activeTab, setActiveTab] = useState("ideas");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get saved hooks for the hooks tab
  const { data: savedHooks, isLoading: isFetchingHooks } = useQuery({
    queryKey: ['savedHooks'],
    queryFn: getSavedHooks,
  });

  const fetchSavedIdeas = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!sessionData.session?.user.id) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your saved ideas",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      console.log("Fetching saved ideas for user:", sessionData.session.user.id);

      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("is_saved", true);

      if (error) throw error;
      
      console.log("Fetched saved ideas:", data);
      
      const transformedIdeas = (data || []).map(idea => ({
        ...idea,
        is_saved: true
      })) as GeneratedIdea[];

      setIdeas(transformedIdeas);
      
      // Check for selected idea in query params
      const params = new URLSearchParams(location.search);
      const selectedId = params.get('selected');
      
      if (selectedId) {
        const selectedIdea = transformedIdeas.find(idea => idea.id === selectedId);
        if (selectedIdea) {
          setEditingIdeaId(selectedId);
        }
      }
    } catch (error: any) {
      console.error("Error fetching saved ideas:", error);
      toast({
        title: "Error",
        description: "Failed to load saved ideas: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavedIdeas();
  }, [location.search]);

  const handleBookmarkToggle = async (ideaId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/auth");
        return;
      }
      
      // Find the idea in the current state
      const ideaToRemove = ideas.find(idea => idea.id === ideaId);
      if (!ideaToRemove) return;
      
      // Optimistically update UI
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));

      // Update the database
      const { error } = await supabase
        .from("video_ideas")
        .update({ is_saved: false })
        .eq("id", ideaId)
        .eq("user_id", sessionData.session.user.id);

      if (error) {
        // If there's an error, revert the optimistic update
        await fetchSavedIdeas();
        throw error;
      }

      toast({
        title: "Success",
        description: "Idea removed from saved ideas",
      });
    } catch (error: any) {
      console.error("Error updating bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark status: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const handleAddToCalendar = async () => {
    if (!addingToCalendar?.idea) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("video_ideas")
        .update({
          scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString(),
          is_saved: true // Keep saved when adding to calendar
        })
        .eq("id", addingToCalendar.idea.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Idea added to calendar successfully",
      });

      setAddingToCalendar(null);
      // Remove from this page since it's now in the calendar
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== addingToCalendar.idea.id));
      // Navigate to calendar to see the added idea
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error",
        description: "Failed to add idea to calendar: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const updateCalendarIdea = (field: keyof AddToCalendarIdea, value: string) => {
    if (!addingToCalendar) return;
    setAddingToCalendar(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSelectIdea = (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
  };

  const handleSelectHook = (hook: HookType) => {
    setSelectedHook(hook);
  };

  // Filter hooks by category
  const filterHooksByCategory = (hooks: any[], category: string): any[] => {
    if (!hooks) return [];
    
    return hooks.filter(hook => {
      const hookCategory = 'category' in hook ? hook.category : '';
      return hookCategory.toLowerCase() === category.toLowerCase();
    });
  };

  // Get hook text based on hook type
  const getHookText = (hook: any): string => {
    if ('hook_text' in hook) return hook.hook_text;
    if ('hook' in hook) return hook.hook;
    return '';
  };

  return (
    <main className="container mx-auto px-4 pt-8 pb-12">
      <section className="mb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0073FF]">Saved Ideas</h1>
          <p className="text-muted-foreground mt-2">Browse and manage your bookmarked video ideas</p>
        </div>

        <Tabs defaultValue="ideas" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="ideas">Ideas</TabsTrigger>
            <TabsTrigger value="hooks">Apply Hooks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ideas">
            {ideas.length > 0 ? (
              <IdeasGrid
                ideas={ideas}
                onAddToCalendar={(idea) => setAddingToCalendar({
                  idea,
                  title: idea.title,
                  scheduledFor: new Date().toISOString().split('T')[0],
                })}
                onEdit={(ideaId) => setEditingIdeaId(ideaId)}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No saved ideas found. Bookmark some ideas to see them here.</p>
                <button 
                  onClick={() => navigate('/generator')}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
                >
                  Generate Ideas
                </button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="hooks">
            <SavedHooksView 
              savedHooks={savedHooks}
              isFetchingHooks={isFetchingHooks}
              handleDeleteHook={() => {}} // Not needed here
              filterHooksByCategory={filterHooksByCategory}
              getHookText={getHookText}
              onSelectHook={handleSelectHook}
              selectedIdea={selectedIdea}
            />
          </TabsContent>
        </Tabs>
      </section>

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
            // Remove the query parameter when closing
            navigate('/ideas', { replace: true });
            // Refresh the ideas list after editing
            fetchSavedIdeas();
          }}
        />
      )}

      <AddToCalendarDialog
        idea={addingToCalendar}
        onOpenChange={() => setAddingToCalendar(null)}
        onAddToCalendar={handleAddToCalendar}
        onUpdate={updateCalendarIdea}
      />
    </main>
  );
}
