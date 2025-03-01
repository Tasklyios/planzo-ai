
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GeneratedIdea, ScriptHook, ScriptStructure, StyleProfile } from "@/types/idea";
import { StyleProfileSection } from "@/components/script/StyleProfileSection";
import { IdeaSelection } from "@/components/script/IdeaSelection";
import { CustomIdeaForm } from "@/components/script/CustomIdeaForm";
import { ScriptForm } from "@/components/script/ScriptForm";
import { GeneratedScriptDisplay } from "@/components/script/GeneratedScriptDisplay";
import { GenerateButton } from "@/components/script/GenerateButton";
import { ErrorAlert } from "@/components/script/ErrorAlert";

export default function Script() {
  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<GeneratedIdea[]>([]);
  const [scriptType, setScriptType] = useState<"existing" | "custom">("existing");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("conversational");
  const [duration, setDuration] = useState("60");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  
  // Add new state for custom hook and structure data
  const [hooks, setHooks] = useState<ScriptHook[]>([]);
  const [structures, setStructures] = useState<ScriptStructure[]>([]);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  
  // Add style profile state
  const [styleProfiles, setStyleProfiles] = useState<StyleProfile[]>([]);
  const [activeStyleProfile, setActiveStyleProfile] = useState<StyleProfile | null>(null);
  const [newStyleProfileName, setNewStyleProfileName] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchSavedIdeas = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      let query = supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("is_saved", true);

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSavedIdeas(data || []);
    } catch (error: any) {
      console.error("Error fetching saved ideas:", error);
      toast({
        title: "Error",
        description: "Failed to load saved ideas",
        variant: "destructive",
      });
    }
  };

  // Add fetch style profiles function
  const fetchStyleProfiles = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      // Fetch all style profiles for the user
      const { data: profiles, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('is_active', { ascending: false });

      if (error) throw error;
      
      setStyleProfiles(profiles || []);
      
      // Find and set the active style profile
      const active = profiles?.find(profile => profile.is_active);
      if (active) {
        setActiveStyleProfile(active);
      }
      
      // Also check the user's profile for an active style profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('active_style_profile_id, content_niche, target_audience, posting_platforms, account_type, business_niche, product_niche')
        .eq('id', sessionData.session.user.id)
        .single();
        
      if (!profileError && userProfile) {
        setUserProfile(userProfile);
        if (userProfile?.active_style_profile_id) {
          const activeProfileById = profiles?.find(
            profile => profile.id === userProfile.active_style_profile_id
          );
          if (activeProfileById) {
            setActiveStyleProfile(activeProfileById);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching style profiles:', error);
    }
  };

  const fetchHooksAndStructures = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) return;

      // Use the generic query method instead of the type-safe approach
      // since these tables aren't in the generated TypeScript types yet
      try {
        const { data: hooksData, error: hooksError } = await supabase
          .rpc('get_hooks', { user_id_param: sessionData.session.user.id });

        if (hooksError) throw hooksError;
        setHooks((hooksData || []) as ScriptHook[]);
      } catch (fallbackError) {
        // Fallback to direct SQL query if RPC method isn't available
        const { data: fallbackHooksData, error: fallbackHooksError } = await supabase
          .from('script_hooks')
          .select('*')
          .eq('user_id', sessionData.session.user.id);
          
        if (fallbackHooksError) throw fallbackHooksError;
        setHooks((fallbackHooksData || []) as ScriptHook[]);
      }

      // Same approach for structures
      try {
        const { data: structuresData, error: structuresError } = await supabase
          .rpc('get_structures', { user_id_param: sessionData.session.user.id });

        if (structuresError) throw structuresError;
        setStructures((structuresData || []) as ScriptStructure[]);
      } catch (fallbackError) {
        // Fallback to direct SQL query if RPC method isn't available
        const { data: fallbackStructuresData, error: fallbackStructuresError } = await supabase
          .from('script_structures')
          .select('*')
          .eq('user_id', sessionData.session.user.id);
          
        if (fallbackStructuresError) throw fallbackStructuresError;
        setStructures((fallbackStructuresData || []) as ScriptStructure[]);
      }
    } catch (error: any) {
      console.error("Error fetching hooks and structures:", error);
    }
  };

  useEffect(() => {
    fetchSavedIdeas();
    fetchHooksAndStructures();
    fetchStyleProfiles();
  }, [selectedStatus]);

  // Check if the user has enough usage left for script generation
  const checkUsageLimits = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user.id) {
        setError("Authentication required. Please log in.");
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to generate scripts.",
        });
        return false;
      }

      // Use the check-usage-limits edge function
      const { data: usageResponse, error: usageError } = await supabase.functions.invoke('check-usage-limits', {
        body: { action: 'scripts' }
      });

      if (usageError) {
        console.error("Usage check error:", usageError);
        setError(`Usage limit check failed: ${usageError.message || "Unknown error"}`);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to check usage limits: ${usageError.message || "Unknown error"}`,
        });
        return false;
      }

      // If we can't proceed, show an appropriate message
      if (!usageResponse.canProceed) {
        console.error("Usage limit reached:", usageResponse.message);
        
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', sessionData.session.user.id)
          .single();

        // Prepare upgrade message based on current tier
        let message = usageResponse.message || "You've reached your daily limit for generating scripts. ";
        
        if (subscription?.tier === 'free') {
          message += " Upgrade to Pro or Plus for more generations!";
        } else if (subscription?.tier === 'pro') {
          message += " Upgrade to Plus or Business for more generations!";
        } else if (subscription?.tier === 'plus') {
          message += " Upgrade to Business for unlimited generations!";
        }

        setError(message);
        toast({
          variant: "destructive",
          title: "Usage Limit Reached",
          description: message,
        });
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Error checking usage limits:", error);
      setError(`Error checking usage limits: ${error.message || "Unknown error"}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to check usage limits: ${error.message || "Unknown error"}`,
      });
      return false;
    }
  };

  const generateScript = async () => {
    setLoading(true);
    setError(null);
    setGeneratedScript("");
    
    try {
      // Check if user can generate more scripts
      const canProceed = await checkUsageLimits();
      if (!canProceed) {
        setLoading(false);
        return;
      }

      const ideaToUse = scriptType === "existing" ? selectedIdea : {
        title: customTitle,
        description: customDescription,
        category: "custom",
        tags: [],
      };

      if (!ideaToUse?.title || !ideaToUse?.description) {
        throw new Error("Please provide all required information");
      }

      // Find the selected hook and structure objects
      const selectedHookData = hooks.find(h => h.id === selectedHook);
      const selectedStructureData = structures.find(s => s.id === selectedStructure);

      // Construct required profile data for the API call
      const niche = userProfile?.content_niche || userProfile?.business_niche || userProfile?.product_niche || "";
      const audience = userProfile?.target_audience || "";
      const platform = Array.isArray(userProfile?.posting_platforms) && userProfile?.posting_platforms.length > 0 
        ? userProfile?.posting_platforms[0] 
        : "Instagram";
      const videoType = ideaToUse.category || "Tutorial";
      
      // Get additional style data from the active style profile
      let contentStyle = "";
      let contentPersonality = "";
      
      if (activeStyleProfile) {
        contentStyle = activeStyleProfile.content_style || "";
        contentPersonality = activeStyleProfile.content_personality || "";
      } else {
        // Fallback to localStorage if no active profile
        contentStyle = localStorage.getItem("contentStyle") || "";
        contentPersonality = localStorage.getItem("contentPersonality") || "";
      }
      
      console.log("Sending script generation request with profile data:", {
        niche, audience, platform, videoType, 
        contentStyle, contentPersonality,
        activeProfileName: activeStyleProfile?.name || "None"
      });

      // Call the generate-ideas function with the type parameter set to 'script'
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          type: 'script',
          title: ideaToUse.title,
          description: ideaToUse.description,
          category: ideaToUse.category,
          tags: ideaToUse.tags,
          toneOfVoice,
          duration: parseInt(duration),
          additionalNotes,
          // Include hook and structure if selected
          hook: selectedHookData?.hook,
          structure: selectedStructureData?.structure,
          // Add required fields for the API
          niche,
          audience, 
          videoType,
          platform,
          // Add style information
          contentStyle,
          contentPersonality
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Failed to generate script: ${error.message || "Unknown error"}`);
      }
      
      if (!data) {
        throw new Error("No data received from script generation function");
      }
      
      if (data.error) {
        console.error("Error in function response:", data.error);
        throw new Error(`Error from AI service: ${data.error}`);
      }
      
      if (!data.script) {
        // If we have a raw response, it means the AI returned something but it wasn't JSON
        if (data.rawResponse) {
          console.log("Raw AI response:", data.rawResponse);
          throw new Error("The AI returned an invalid format. Please try again.");
        }
        
        throw new Error("Failed to generate script. Please try again.");
      }
      
      setGeneratedScript(data.script);
      
      if (scriptType === "existing" && selectedIdea?.id) {
        const { error: saveError } = await supabase
          .from('scripts')
          .insert({
            content: data.script,
            idea_id: selectedIdea.id,
            user_id: (await supabase.auth.getSession()).data.session?.user.id,
          });

        if (saveError) {
          console.error("Error saving script:", saveError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Script was generated but couldn't be saved.",
          });
        } else {
          toast({
            title: "Success",
            description: "Script generated and saved successfully!",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Script generated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Error generating script:", error);
      setError(error.message || "Failed to generate script");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate script",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Generate Script</h1>
          <p className="text-muted-foreground">
            Create engaging video scripts from your saved ideas or start fresh with a custom concept.
          </p>
        </div>

        <ErrorAlert error={error} />

        <div className="space-y-6">
          {/* Style Profile Section */}
          {activeStyleProfile && (
            <StyleProfileSection activeStyleProfile={activeStyleProfile} />
          )}

          <ScriptForm 
            scriptType={scriptType}
            setScriptType={setScriptType}
            toneOfVoice={toneOfVoice}
            setToneOfVoice={setToneOfVoice}
            duration={duration}
            setDuration={setDuration}
            additionalNotes={additionalNotes}
            setAdditionalNotes={setAdditionalNotes}
            selectedHook={selectedHook}
            setSelectedHook={setSelectedHook}
            selectedStructure={selectedStructure}
            setSelectedStructure={setSelectedStructure}
            hooks={hooks}
            structures={structures}
            fetchHooksAndStructures={fetchHooksAndStructures}
          />

          {scriptType === "existing" ? (
            <IdeaSelection 
              savedIdeas={savedIdeas}
              selectedIdea={selectedIdea}
              setSelectedIdea={setSelectedIdea}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
            />
          ) : (
            <CustomIdeaForm
              customTitle={customTitle}
              setCustomTitle={setCustomTitle}
              customDescription={customDescription}
              setCustomDescription={setCustomDescription}
            />
          )}

          <GenerateButton 
            loading={loading}
            scriptType={scriptType}
            selectedIdea={selectedIdea}
            customTitle={customTitle}
            customDescription={customDescription}
            generateScript={generateScript}
          />

          {generatedScript && (
            <GeneratedScriptDisplay 
              generatedScript={generatedScript}
              selectedIdea={selectedIdea}
              fetchSavedIdeas={fetchSavedIdeas}
            />
          )}
        </div>
      </div>
    </div>
  );
}
