
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import { GeneratedIdea } from "@/types/idea";
import EditIdea from "@/components/EditIdea";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { AddToCalendarIdea } from "@/types/idea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function Ideas() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchSavedIdeas = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      const { data, error } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("is_saved", true);

      if (error) throw error;
      
      const transformedIdeas = (data || []).map(idea => ({
        ...idea,
        is_saved: true
      })) as GeneratedIdea[];

      setIdeas(transformedIdeas);
    } catch (error: any) {
      console.error("Error fetching saved ideas:", error);
      toast({
        title: "Error",
        description: "Failed to load saved ideas",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavedIdeas();
  }, []);

  const handleBookmarkToggle = async (ideaId: string) => {
    try {
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));

      const { error } = await supabase
        .from("video_ideas")
        .update({ is_saved: false })
        .eq("id", ideaId);

      if (error) {
        await fetchSavedIdeas(); // Reload ideas on error
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
        description: "Failed to update bookmark status",
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
          is_saved: false
        })
        .eq("id", addingToCalendar.idea.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Idea added to calendar successfully",
      });

      setAddingToCalendar(null);
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== addingToCalendar.idea.id));
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error",
        description: "Failed to add idea to calendar",
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
      </section>

      {editingIdeaId && (
        <EditIdea
          ideaId={editingIdeaId}
          onClose={() => {
            setEditingIdeaId(null);
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
