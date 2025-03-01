
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import EditIdea from "@/components/EditIdea";
import { useIdeaGenerator } from "@/hooks/use-idea-generator";
import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import InputForm from "@/components/idea-generator/InputForm";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { AddToCalendarIdea, PreviousIdeasContext } from "@/types/idea";

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
    customIdeas,
    setCustomIdeas,
    previousIdeasContext,
    setPreviousIdeasContext
  } = useIdeaGenerator();

  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load previous ideas context from localStorage on component mount
  useEffect(() => {
    const savedContext = localStorage.getItem('previousIdeasContext');
    if (savedContext) {
      try {
        setPreviousIdeasContext(JSON.parse(savedContext));
      } catch (error) {
        console.error("Error parsing previous ideas context:", error);
      }
    }
  }, [setPreviousIdeasContext]);

  const handleAddToCalendar = async () => {
    if (!addingToCalendar?.idea) return;
    try {
      const {
        data: sessionData,
        error: sessionError
      } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      const userId = sessionData.session?.user.id;
      if (!userId) {
        navigate("/auth");
        return;
      }

      // Create a new scheduled content entry
      const {
        error: scheduleError
      } = await supabase.from("scheduled_content").insert({
        title: addingToCalendar.title,
        platform: addingToCalendar.idea.platform || platform,
        scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString(),
        user_id: userId,
        color: addingToCalendar.idea.color || 'blue'
      });
      
      if (scheduleError) {
        console.error("Error adding to calendar:", scheduleError);
        throw new Error(`Error adding to calendar: ${scheduleError.message}`);
      }
      
      toast({
        title: "Success",
        description: "Idea added to calendar successfully"
      });
      setAddingToCalendar(null);
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add idea to calendar. Please try again."
      });
    }
  };

  const updateCalendarIdea = (field: keyof AddToCalendarIdea, value: string) => {
    if (!addingToCalendar) return;
    setAddingToCalendar(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const handleBookmarkToggle = async (ideaId: string) => {
    try {
      const ideaToUpdate = ideas.find(idea => idea.id === ideaId);
      if (!ideaToUpdate) return;
      
      const newSavedState = !ideaToUpdate.is_saved;
      
      const {
        error
      } = await supabase.from("video_ideas").update({
        is_saved: newSavedState
      }).eq("id", ideaId);
      
      if (error) {
        console.error("Bookmark update error:", error);
        throw new Error(`Error updating bookmark: ${error.message}`);
      }
      
      setIdeas(prevIdeas => prevIdeas.map(idea => idea.id === ideaId ? {
        ...idea,
        is_saved: newSavedState
      } : idea));
      
      toast({
        title: newSavedState ? "Idea saved" : "Idea unsaved",
        description: newSavedState ? "Idea added to saved ideas" : "Idea removed from saved ideas"
      });
    } catch (error: any) {
      console.error("Error updating bookmark:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark status",
        variant: "destructive"
      });
    }
  };

  return <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8 pb-12 py-0">
        <section className="mb-8">
          <GeneratorHeader />
          <InputForm 
            niche={niche} 
            audience={audience} 
            videoType={videoType} 
            platform={platform}
            customIdeas={customIdeas}
            setNiche={setNiche} 
            setAudience={setAudience} 
            setVideoType={setVideoType} 
            setPlatform={setPlatform}
            setCustomIdeas={setCustomIdeas}
          />

          <div className="flex justify-center mb-8">
            <button 
              onClick={generateIdeas} 
              disabled={loading} 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-8 py-6 rounded-full font-medium flex items-center gap-2 h-12 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? <>
                  <span className="animate-spin">⚡</span>
                  Generating...
                </> : <>
                  ⚡ Generate Viral Ideas
                </>}
            </button>
          </div>

          <IdeasGrid 
            ideas={ideas} 
            onAddToCalendar={idea => setAddingToCalendar({
              idea,
              title: idea.title,
              scheduledFor: new Date().toISOString().split('T')[0]
            })} 
            onEdit={ideaId => setEditingIdeaId(ideaId)} 
            onBookmarkToggle={handleBookmarkToggle} 
          />
        </section>

        {editingIdeaId && <EditIdea ideaId={editingIdeaId} onClose={() => setEditingIdeaId(null)} />}

        <AddToCalendarDialog 
          idea={addingToCalendar} 
          onOpenChange={() => setAddingToCalendar(null)} 
          onAddToCalendar={handleAddToCalendar} 
          onUpdate={updateCalendarIdea} 
        />
      </main>
    </div>;
};

export default Generator;
