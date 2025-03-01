
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button"; // Add Button import
import EditIdea from "@/components/EditIdea";
import { useIdeaGenerator } from "@/hooks/use-idea-generator";
import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import InputForm from "@/components/idea-generator/InputForm";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AddToCalendarIdea, PreviousIdeasContext, StyleProfile } from "@/types/idea";
import { Badge } from "@/components/ui/badge";
import { Paintbrush } from "lucide-react";

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
    setError
  } = useIdeaGenerator();

  const [addingToCalendar, setAddingToCalendar] = useState<AddToCalendarIdea | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [activeStyleProfile, setActiveStyleProfile] = useState<StyleProfile | null>(null);
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
    
    // Fetch active style profile
    fetchActiveStyleProfile();
  }, [setPreviousIdeasContext]);

  const fetchActiveStyleProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('active_style_profile_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError || !profile?.active_style_profile_id) return;

      const { data: styleProfile, error: styleError } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('id', profile.active_style_profile_id)
        .maybeSingle();

      if (styleError || !styleProfile) return;

      setActiveStyleProfile(styleProfile);
    } catch (error) {
      console.error("Error fetching active style profile:", error);
    }
  };

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

      // Update only the specific idea that was selected
      const {
        error: updateError
      } = await supabase.from("video_ideas")
        .update({
          scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString()
        })
        .eq("id", addingToCalendar.idea.id);
      
      if (updateError) {
        console.error("Error adding to calendar:", updateError);
        throw new Error(`Error adding to calendar: ${updateError.message}`);
      }
      
      // Update the local state to reflect the change
      setIdeas(prevIdeas => prevIdeas.map(idea => 
        idea.id === addingToCalendar.idea.id 
          ? { ...idea, scheduled_for: new Date(addingToCalendar.scheduledFor).toISOString() } 
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

  const handleRetryGenerate = () => {
    setError(null);
    generateIdeas();
  };

  const navigateToStyleProfiles = () => {
    navigate('/account');
    // Set the active tab to 'styles' in localStorage so Account component opens it
    localStorage.setItem('accountActiveTab', 'styles');
  };

  return <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8 pb-12 py-0">
        <section className="mb-8">
          <GeneratorHeader />
          
          {activeStyleProfile && (
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 hover:bg-primary/15">
                  <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
                  Style: {activeStyleProfile.name}
                </Badge>
              </div>
              <Button 
                variant="link" 
                onClick={navigateToStyleProfiles}
                className="text-sm"
              >
                Change Style Profile
              </Button>
            </div>
          )}
          
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
              <AlertTitle>Error generating ideas</AlertTitle>
              <AlertDescription>
                {error}
                <div className="mt-2">
                  <button 
                    onClick={handleRetryGenerate}
                    className="bg-destructive/20 hover:bg-destructive/30 text-destructive px-3 py-1 rounded text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center mb-8">
            <button 
              onClick={generateIdeas} 
              disabled={loading} 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white dark:text-white px-8 py-6 rounded-full font-medium flex items-center gap-2 h-12 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? <>
                  <Spinner size="sm" className="text-white dark:text-white" />
                  <span>Generating...</span>
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
