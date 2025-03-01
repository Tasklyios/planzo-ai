
import { useState, useEffect } from "react";
import { useIdeaGenerator } from "@/hooks/use-idea-generator";
import InputForm from "@/components/idea-generator/InputForm";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import { GeneratedIdea, AddToCalendarIdea } from "@/types/idea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import AddToCalendarDialog from "@/components/idea-generator/AddToCalendarDialog";
import MobileMenuDialog from "@/components/idea-generator/MobileMenuDialog";
import { useMobile } from "@/hooks/use-mobile";

export default function IdeaGenerator() {
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
    error
  } = useIdeaGenerator();

  const [activeTab, setActiveTab] = useState<'input' | 'ideas'>(ideas.length > 0 ? 'ideas' : 'input');
  const [addToCalendarIdea, setAddToCalendarIdea] = useState<AddToCalendarIdea | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    if (ideas.length > 0 && activeTab === 'input') {
      setActiveTab('ideas');
    }
  }, [ideas]);

  const handleDeleteIdea = async (id: string) => {
    try {
      const updatedIdeas = ideas.filter(idea => idea.id !== id);
      setIdeas(updatedIdeas);
      
      // Note: We don't actually delete from the database, just remove from UI
    } catch (error) {
      console.error("Error deleting idea:", error);
    }
  };

  const handleSaveIdea = async (id: string, isSaved: boolean) => {
    try {
      // Update local state
      const updatedIdeas = ideas.map(idea =>
        idea.id === id ? { ...idea, is_saved: isSaved } : idea
      );
      setIdeas(updatedIdeas);
      
      // Update in database
      const { error } = await supabase
        .from('video_ideas')
        .update({ 
          is_saved: isSaved,
          status: 'ideas'  // Always set status to ideas when saving
        })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error("Error saving idea:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save idea",
      });
    }
  };

  const handleAddToCalendar = async (idea: GeneratedIdea) => {
    // Create the AddToCalendarIdea object
    const calendarIdea: AddToCalendarIdea = {
      idea: idea,
      title: idea.title,
      scheduledFor: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    };
    
    // Open the dialog
    setAddToCalendarIdea(calendarIdea);
  };

  const handleAddToCalendarUpdate = (field: keyof AddToCalendarIdea, value: string) => {
    if (addToCalendarIdea) {
      setAddToCalendarIdea({
        ...addToCalendarIdea,
        [field]: value
      });
    }
  };

  const saveToCalendar = async () => {
    if (!addToCalendarIdea) return;

    try {
      const scheduledDate = new Date(addToCalendarIdea.scheduledFor);
      
      // Update the idea in the database
      const { error } = await supabase
        .from('video_ideas')
        .update({ 
          scheduled_for: scheduledDate.toISOString(),
          is_saved: true,  // Automatically save to bookmarks
          status: 'ideas'  // Place in Ideas column
        })
        .eq('id', addToCalendarIdea.idea.id);
      
      if (error) throw error;
      
      // Update UI
      const updatedIdeas = ideas.map(idea => 
        idea.id === addToCalendarIdea.idea.id 
          ? { ...idea, scheduled_for: scheduledDate.toISOString(), is_saved: true } 
          : idea
      );
      
      setIdeas(updatedIdeas);
      
      toast({
        title: "Added to Calendar",
        description: `Scheduled for ${format(scheduledDate, "MMMM d, yyyy")}`,
      });
      
      // Close dialog
      setAddToCalendarIdea(null);
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to calendar",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-full">
      <GeneratorHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        hasIdeas={ideas.length > 0}
      />
      
      {isMobile && (
        <MobileMenuDialog 
          open={isMenuOpen} 
          onOpenChange={(open) => setIsMenuOpen(open)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasIdeas={ideas.length > 0}
        />
      )}
      
      <div className="mt-6">
        {activeTab === 'input' ? (
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
        ) : (
          <IdeasGrid
            ideas={ideas}
            onAddToCalendar={handleAddToCalendar}
            onEdit={(id) => console.log("Edit idea", id)}
            onBookmarkToggle={(id) => {
              const idea = ideas.find(i => i.id === id);
              if (idea) {
                handleSaveIdea(id, !idea.is_saved);
              }
            }}
          />
        )}
      </div>
      
      <AddToCalendarDialog
        idea={addToCalendarIdea}
        onOpenChange={(open) => !open && setAddToCalendarIdea(null)}
        onAddToCalendar={saveToCalendar}
        onUpdate={handleAddToCalendarUpdate}
      />
    </div>
  );
}
