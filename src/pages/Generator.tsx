import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import EditIdea from "@/components/EditIdea";
import { useIdeaGenerator } from "@/hooks/use-idea-generator";
import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import InputForm from "@/components/idea-generator/InputForm";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AddToCalendarIdea, PreviousIdeasContext } from "@/types/idea";
import { AlertCircle } from "lucide-react";

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
    setPreviousIdeasContext,
    error,
    setError,
    accountType
  } = useIdeaGenerator();

  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Generator component - current ideas:", ideas);
  }, [ideas]);

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

  useEffect(() => {
    console.log(`Generator component detected account type: ${accountType}`);
  }, [accountType]);

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
        toast({
          title: "Authentication required", 
          description: "Please login to add ideas to calendar",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      console.log("Adding idea to calendar:", addingToCalendar.idea.id, "with date:", addingToCalendar.scheduledFor);
      
      const updatedTitle = addingToCalendar.title || addingToCalendar.idea.title;
      
      const {
        error: updateError
      } = await supabase.from("video_ideas")
        .update({
          scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString(),
          is_saved: true,
          title: updatedTitle,
          user_id: userId
        })
        .eq("id", addingToCalendar.idea.id);
      
      if (updateError) {
        console.error("Error adding to calendar:", updateError);
        throw new Error(`Error adding to calendar: ${updateError.message}`);
      }
      
      setIdeas(prevIdeas => prevIdeas.map(idea => 
        idea.id === addingToCalendar.idea.id 
          ? { 
              ...idea, 
              scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString(), 
              is_saved: true,
              title: updatedTitle 
            } 
          : idea
      ));
      
      toast({
        title: "Success",
        description: "Idea added to calendar successfully"
      });
      setAddingToCalendar(null);
      
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add idea to calendar",
        variant: "destructive"
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
      if (!ideaToUpdate) {
        console.error("Idea not found:", ideaId);
        return;
      }
      
      const newSavedState = !ideaToUpdate.is_saved;
      console.log("Toggling bookmark for idea:", ideaId, "Current saved status:", ideaToUpdate.is_saved, "New status:", newSavedState);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to save ideas",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      
      setIdeas(prevIdeas => prevIdeas.map(idea => 
        idea.id === ideaId 
          ? { ...idea, is_saved: newSavedState } 
          : idea
      ));
      
      console.log("Updating bookmark for idea:", ideaId, "to:", newSavedState);
      const {
        error
      } = await supabase.from("video_ideas").update({
        is_saved: newSavedState
      }).eq("id", ideaId)
        .eq("user_id", session.user.id);
      
      if (error) {
        console.error("Bookmark update error:", error);
        setIdeas(prevIdeas => prevIdeas.map(idea => 
          idea.id === ideaId 
            ? { ...idea, is_saved: !newSavedState } 
            : idea
        ));
        throw new Error(`Error updating bookmark: ${error.message}`);
      }
      
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

  const handleRetryGenerate = () => {
    setError(null);
    generateIdeas();
  };

  const navigateToBilling = () => {
    navigate('/billing');
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("Auth status:", data.session ? "Logged in" : "Not logged in");
    };
    checkAuth();
  }, []);

  const hasValidIdeas = () => {
    return Array.isArray(ideas) && ideas.length > 0;
  };

  const handleGenerateIdeas = () => {
    console.log("handleGenerateIdeas called with current account type:", accountType);
    console.log("Current state - niche:", niche, "audience:", audience, "videoType:", videoType, "platform:", platform);
    console.log("Custom ideas:", customIdeas);
    
    setIdeas([]);
    
    generateIdeas({
      currentNiche: niche,
      currentAudience: audience,
      currentVideoType: videoType,
      currentPlatform: platform,
      currentCustomIdeas: customIdeas
    });
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

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Error generating ideas</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                {error.includes("daily limit") && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button 
                      variant="outline" 
                      onClick={navigateToBilling}
                      className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20"
                    >
                      Upgrade Plan
                    </Button>
                    <Button 
                      onClick={handleRetryGenerate}
                      className="bg-destructive/20 hover:bg-destructive/30 text-destructive"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                {!error.includes("daily limit") && (
                  <div className="mt-2">
                    <Button 
                      onClick={handleRetryGenerate}
                      className="bg-destructive/20 hover:bg-destructive/30 text-destructive"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center mb-8">
            <button 
              onClick={handleGenerateIdeas} 
              disabled={loading} 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white dark:text-white px-8 py-6 rounded-full font-medium flex items-center gap-2 h-12 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚡️</span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>⚡️</span>
                  Generate Video Ideas
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-4 text-muted-foreground">Generating viral ideas for your content...</p>
            </div>
          ) : (
            hasValidIdeas() ? (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Generated Ideas</h2>
                  <p className="text-sm text-muted-foreground">{ideas.length} ideas generated for your content</p>
                </div>
                <IdeasGrid 
                  ideas={ideas} 
                  onAddToCalendar={(idea) => {
                    console.log("Adding to calendar:", idea);
                    setAddingToCalendar({
                      idea,
                      title: idea.title,
                      scheduledFor: new Date().toISOString().split('T')[0]
                    });
                  }} 
                  onEdit={(ideaId) => {
                    console.log("Editing idea:", ideaId);
                    setEditingIdeaId(ideaId);
                  }} 
                  onBookmarkToggle={(ideaId) => {
                    console.log("Toggling bookmark for idea:", ideaId);
                    handleBookmarkToggle(ideaId);
                  }} 
                />
              </>
            ) : !error ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No ideas generated yet. Fill in the form above and click "Generate Video Ideas".</p>
              </div>
            ) : null
          )}
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
