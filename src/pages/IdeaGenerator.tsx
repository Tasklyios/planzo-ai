
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIdeaGenerator } from "@/hooks/use-idea-generator";
import IdeasGrid from "@/components/idea-generator/IdeasGrid";
import InputForm from "@/components/idea-generator/InputForm";
import GeneratorHeader from "@/components/idea-generator/GeneratorHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import MobileMenuDialog from "@/components/idea-generator/MobileMenuDialog";
import { useMobile } from "@/hooks/use-mobile";
import { GeneratedIdea, AccountType } from "@/types/idea";

const IdeaGenerator: React.FC = () => {
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
    loadingExisting,
    ideas,
    setIdeas,
    generateIdeas,
    customIdeas,
    setCustomIdeas,
    error,
    accountType,
    setAccountType,
  } = useIdeaGenerator();
  const [showForm, setShowForm] = useState(true);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMobile();

  const handleRefreshClick = () => {
    if (customIdeas.trim() === "" && niche.trim() === "") {
      toast({
        title: "Please specify a niche",
        description: "Enter a niche or custom ideas to generate new ideas",
        variant: "destructive",
      });
      return;
    }
    
    // Generate ideas with latest form values
    generateIdeas({
      currentNiche: niche,
      currentAudience: audience,
      currentVideoType: videoType,
      currentPlatform: platform,
      currentCustomIdeas: customIdeas,
    });
  };

  const handleSaveIdea = async (idea: GeneratedIdea) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save ideas",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from('video_ideas')
        .update({ is_saved: true })
        .eq('id', idea.id);
      
      if (error) {
        throw error;
      }
      
      // Update the local ideas state
      setIdeas(ideas.map(i => i.id === idea.id ? { ...i, is_saved: true } : i));
      
      toast({
        title: "Idea saved",
        description: "The idea has been saved to your collection",
      });
    } catch (error: any) {
      console.error('Error saving idea:', error);
      toast({
        variant: "destructive",
        title: "Error saving idea",
        description: error.message || "An unknown error occurred",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="md:hidden flex items-center justify-between py-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold flex-1 text-center">Ideas</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpenMobileMenu(true)}
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="h-full flex flex-col md:flex-row">
        <div className={`md:w-1/3 md:min-w-[300px] md:max-w-[450px] md:border-r bg-background p-4 overflow-auto ${!showForm && !isMobile ? "hidden" : ""}`}>
          <GeneratorHeader
            loading={loading}
            onRefresh={handleRefreshClick}
            onToggleForm={() => setShowForm(!showForm)}
            showForm={showForm}
          />
          <InputForm
            niche={niche}
            setNiche={setNiche}
            audience={audience}
            setAudience={setAudience}
            videoType={videoType}
            setVideoType={setVideoType}
            platform={platform}
            setPlatform={setPlatform}
            accountType={accountType as AccountType}
            setAccountType={(value: AccountType) => setAccountType(value)}
            customIdeas={customIdeas}
            setCustomIdeas={setCustomIdeas}
            onGenerate={handleRefreshClick}
            isGenerating={loading}
          />
        </div>

        <div className={`flex-1 p-4 overflow-auto ${(showForm && isMobile) ? "hidden" : ""}`}>
          <IdeasGrid
            ideas={ideas}
            loadingIdeas={loading}
            loadingExisting={loadingExisting}
            onSaveIdea={handleSaveIdea}
            error={error}
            onToggleForm={() => setShowForm(!showForm)}
            showForm={showForm}
          />
        </div>
      </div>

      <MobileMenuDialog open={openMobileMenu} onOpenChange={setOpenMobileMenu}>
        <InputForm
            niche={niche}
            setNiche={setNiche}
            audience={audience}
            setAudience={setAudience}
            videoType={videoType}
            setVideoType={setVideoType}
            platform={platform}
            setPlatform={setPlatform}
            accountType={accountType as AccountType}
            setAccountType={(value: AccountType) => setAccountType(value)}
            customIdeas={customIdeas}
            setCustomIdeas={setCustomIdeas}
            onGenerate={() => {
              handleRefreshClick();
              setOpenMobileMenu(false);
            }}
            isGenerating={loading}
          />
      </MobileMenuDialog>
    </div>
  );
};

export default IdeaGenerator;
