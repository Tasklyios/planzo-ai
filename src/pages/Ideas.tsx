import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import { GeneratedIdea } from "@/types/idea";
import EditIdea from "@/components/EditIdea";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { AddToCalendarIdea } from "@/types/idea";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function Ideas() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const fetchSavedIdeas = async () => {
    try {
      setIsLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
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

      if (error) {
        console.error("Error fetching saved ideas:", error);
        throw error;
      }
      
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedIdeas();
  }, [location.search]);

  const handleBookmarkToggle = async (ideaId: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session) {
        toast({
          title: "Authentication required",
          description: "Please log in to update ideas",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      
      // Find the idea in the current state
      const ideaToRemove = ideas.find(idea => idea.id === ideaId);
      if (!ideaToRemove) {
        console.error("Idea not found:", ideaId);
        return;
      }
      
      console.log("Removing bookmark for idea:", ideaId);
      
      // Optimistically update UI
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));

      // Update the database
      const { error } = await supabase
        .from("video_ideas")
        .update({ 
          is_saved: false,
          user_id: sessionData.session.user.id // Explicitly set user_id
        })
        .eq("id", ideaId)
        .eq("user_id", sessionData.session.user.id);

      if (error) {
        // If there's an error, revert the optimistic update
        console.error("Error removing bookmark:", error);
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
    if (!addingToCalendar) return;

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!sessionData.session?.user.id) {
        toast({
          title: "Authentication required",
          description: "Please log in to add ideas to calendar",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      console.log("Adding to calendar:", addingToCalendar, "with color:", addingToCalendar.color);

      // Always ensure both scheduled_for and is_saved are set
      const { error } = await supabase
        .from("video_ideas")
        .update({
          scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString(),
          is_saved: true, // Always ensure it's saved when adding to calendar
          user_id: sessionData.session.user.id, // Explicitly set user_id
          title: addingToCalendar.title, // Update the title if it was edited
          status: 'calendar', // Make sure status is set to calendar
          color: addingToCalendar.color || 'blue' // Add color property with default fallback
        })
        .eq("id", addingToCalendar.idea.id)
        .eq("user_id", sessionData.session.user.id);

      if (error) {
        console.error("Error adding to calendar:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Idea added to calendar successfully",
      });

      setAddingToCalendar(null);
      
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

  return (
    <main className="container mx-auto px-4 pt-8 pb-12">
      <section className="mb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0073FF]">Saved Ideas</h1>
          <p className="text-muted-foreground mt-2">Browse and manage your bookmarked video ideas</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading saved ideas...</p>
          </div>
        ) : ideas.length > 0 ? (
          <IdeasGrid
            ideas={ideas}
            onAddToCalendar={(idea) => {
              console.log("Adding to calendar:", idea);
              setAddingToCalendar({
                idea,
                title: idea.title,
                scheduledFor: new Date().toISOString().split('T')[0],
              });
            }}
            onEdit={(ideaId) => {
              console.log("Editing idea:", ideaId);
              setEditingIdeaId(ideaId);
            }}
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
