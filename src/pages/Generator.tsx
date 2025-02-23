
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import EditIdea from "@/components/EditIdea";
import { useIdeaGenerator } from "@/hooks/use-idea-generator";
import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import InputForm from "@/components/idea-generator/InputForm";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { AddToCalendarIdea } from "@/types/idea";

const Generator = () => {
  const {
    niche,
    setNiche,
    audience,
    setAudience,
    videoType,
    setVideoType,
    platform,
    setPlatform,
    loading,
    ideas,
    setIdeas,
    generateIdeas,
  } = useIdeaGenerator();

  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddToCalendar = async () => {
    if (!addingToCalendar?.idea) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/auth");
        return;
      }

      // Update only the specific idea by its ID
      const { error } = await supabase
        .from("video_ideas")
        .update({
          scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString(),
          platform: addingToCalendar.idea.platform || platform,
          title: addingToCalendar.title, // Add the title update
        })
        .eq("id", addingToCalendar.idea.id)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Idea added to calendar successfully",
      });
      setAddingToCalendar(null);
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add idea to calendar. Please try again.",
      });
    }
  };

  const updateCalendarIdea = (field: keyof AddToCalendarIdea, value: string) => {
    if (!addingToCalendar) return;
    setAddingToCalendar(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleBookmarkToggle = async (ideaId: string) => {
    try {
      const ideaToUpdate = ideas.find(idea => idea.id === ideaId);
      if (!ideaToUpdate) return;

      const newSavedState = !ideaToUpdate.is_saved;

      const { error } = await supabase
        .from("video_ideas")
        .update({ is_saved: newSavedState })
        .eq("id", ideaId);

      if (error) throw error;

      setIdeas(prevIdeas => prevIdeas.map(idea =>
        idea.id === ideaId ? { ...idea, is_saved: newSavedState } : idea
      ));

    } catch (error: any) {
      console.error("Error updating bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8 pb-12">
        <section className="mb-8">
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

          <div className="flex justify-center mb-8">
            <button
              onClick={generateIdeas}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-8 py-6 rounded-full font-medium flex items-center gap-2 h-12 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Generating...
                </>
              ) : (
                <>
                  ⚡ Generate Viral Ideas
                </>
              )}
            </button>
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
            onClose={() => setEditingIdeaId(null)}
          />
        )}

        <AddToCalendarDialog
          idea={addingToCalendar}
          onOpenChange={() => setAddingToCalendar(null)}
          onAddToCalendar={handleAddToCalendar}
          onUpdate={updateCalendarIdea}
        />
      </main>
    </div>
  );
};

export default Generator;
