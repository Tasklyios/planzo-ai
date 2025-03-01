import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { GeneratedIdea } from "@/types/idea";

export const useIdeaGenerator = () => {
  const [niche, setNiche] = useState(() => localStorage.getItem("niche") || "");
  const [audience, setAudience] = useState(() => localStorage.getItem("audience") || "");
  const [videoType, setVideoType] = useState(() => localStorage.getItem("videoType") || "");
  const [platform, setPlatform] = useState(() => localStorage.getItem("platform") || "TikTok");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [customIdeas, setCustomIdeas] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set up a listener for localStorage changes
  useEffect(() => {
    console.log("Setting up localStorage change listeners");
    
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      
      console.log(`Storage event detected: ${e.key} = ${e.newValue}`);
      
      if (e.key === "niche" && e.newValue !== null) {
        console.log(`Updating niche from ${niche} to ${e.newValue}`);
        setNiche(e.newValue);
      } else if (e.key === "audience" && e.newValue !== null) {
        console.log(`Updating audience from ${audience} to ${e.newValue}`);
        setAudience(e.newValue);
      } else if (e.key === "videoType" && e.newValue !== null) {
        console.log(`Updating videoType from ${videoType} to ${e.newValue}`);
        setVideoType(e.newValue);
      } else if (e.key === "platform" && e.newValue !== null) {
        console.log(`Updating platform from ${platform} to ${e.newValue}`);
        setPlatform(e.newValue);
      }
    };

    // Also listen for custom events as a fallback
    const handleCustomStorageChange = (e: CustomEvent<{key: string, newValue: string}>) => {
      if (!e.detail) return;
      
      const { key, newValue } = e.detail;
      console.log(`Custom storage event: ${key} updated to ${newValue}`);
      
      if (key === "niche" && newValue !== null) {
        setNiche(newValue);
      } else if (key === "audience" && newValue !== null) {
        setAudience(newValue);
      } else if (key === "videoType" && newValue !== null) {
        setVideoType(newValue);
      } else if (key === "platform" && newValue !== null) {
        setPlatform(newValue);
      }
    };

    // Listen for regular storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for our custom events as a fallback
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, [niche, audience, videoType, platform]);

  useEffect(() => {
    console.log("useIdeaGenerator: Fetching user preferences on mount");
    fetchUserPreferences();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      console.log("Auth state changed, fetching preferences");
      fetchUserPreferences();
    });

    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log("Profile changed in database:", payload);
          fetchUserPreferences();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, []);

  const fetchUserPreferences = async () => {
    try {
      console.log("Fetching user preferences from Supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("No authenticated user found");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_type, content_niche, business_niche, product_niche, target_audience, posting_platforms')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      console.log("Profile data from database:", profile);

      if (profile) {
        // Determine which niche to use based on account type
        let nicheValue = "";
        let videoTypeValue = "";
        
        if (profile.account_type === 'business' && profile.business_niche) {
          nicheValue = profile.business_niche;
          videoTypeValue = profile.business_niche || "Business Promotion";
        } else if (profile.account_type === 'ecommerce' && profile.product_niche) {
          nicheValue = profile.product_niche;
          videoTypeValue = profile.content_niche || "Product Showcase";
        } else {
          nicheValue = profile.content_niche || "";
          videoTypeValue = profile.content_niche || "";
        }

        console.log(`Setting niche based on account type (${profile.account_type}):`, nicheValue);
        console.log(`Setting videoType based on account type:`, videoTypeValue);

        // Update localStorage and state
        if (nicheValue && nicheValue !== niche) {
          console.log(`Updating niche from ${niche} to ${nicheValue}`);
          setNiche(nicheValue);
          localStorage.setItem("niche", nicheValue);
        }

        if (profile.target_audience && profile.target_audience !== audience) {
          console.log(`Updating audience from ${audience} to ${profile.target_audience}`);
          setAudience(profile.target_audience);
          localStorage.setItem("audience", profile.target_audience);
        }
        
        if (profile.posting_platforms && profile.posting_platforms.length > 0 && profile.posting_platforms[0] !== platform) {
          console.log(`Updating platform from ${platform} to ${profile.posting_platforms[0]}`);
          setPlatform(profile.posting_platforms[0]);
          localStorage.setItem("platform", profile.posting_platforms[0]);
        }

        // Set videoType based on account type
        if (videoTypeValue && videoTypeValue !== videoType) {
          console.log(`Updating videoType from ${videoType} to ${videoTypeValue}`);
          setVideoType(videoTypeValue);
          localStorage.setItem("videoType", videoTypeValue);
        }
      }

      // Also check localStorage for the latest values (in case they were updated in another tab)
      refreshFromLocalStorage();
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  };
  
  // Helper to refresh state from localStorage
  const refreshFromLocalStorage = () => {
    const localStorageNiche = localStorage.getItem("niche");
    const localStorageAudience = localStorage.getItem("audience");
    const localStorageVideoType = localStorage.getItem("videoType");
    const localStoragePlatform = localStorage.getItem("platform");
    
    console.log("LocalStorage values:", {
      niche: localStorageNiche,
      audience: localStorageAudience,
      videoType: localStorageVideoType,
      platform: localStoragePlatform
    });
    
    if (localStorageNiche && localStorageNiche !== niche) {
      console.log(`Updating niche from localStorage: ${localStorageNiche}`);
      setNiche(localStorageNiche);
    }
    
    if (localStorageAudience && localStorageAudience !== audience) {
      console.log(`Updating audience from localStorage: ${localStorageAudience}`);
      setAudience(localStorageAudience);
    }

    if (localStorageVideoType && localStorageVideoType !== videoType) {
      console.log(`Updating videoType from localStorage: ${localStorageVideoType}`);
      setVideoType(localStorageVideoType);
    }
    
    if (localStoragePlatform && localStoragePlatform !== platform) {
      console.log(`Updating platform from localStorage: ${localStoragePlatform}`);
      setPlatform(localStoragePlatform);
    }
  };

  const transformSupabaseIdea = (idea: any): GeneratedIdea => {
    return {
      id: idea.id,
      title: idea.title,
      category: idea.category,
      description: idea.description,
      tags: idea.tags,
      platform: idea.platform,
      color: idea.color,
      is_saved: idea.is_saved || false,
    };
  };

  const generateIdeas = async () => {
    if (!niche || !audience || !videoType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating ideas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to generate ideas.",
        });
        navigate("/auth");
        setLoading(false);
        return;
      }

      // Use the check-usage-limits edge function
      const { data: usageResponse, error: usageError } = await supabase.functions.invoke('check-usage-limits', {
        body: {
          user_id: userId,
          action: 'ideas'
        }
      });

      if (usageError) {
        console.error("Usage check error:", usageError);
        throw new Error(`Usage check error: ${usageError.message}`);
      }

      // Check if we can proceed or not
      if (!usageResponse.canProceed) {
        console.error("Usage limit reached:", usageResponse.message);
        
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', userId)
          .single();

        // Prepare upgrade message based on current tier
        let message = usageResponse.message || "You've reached your daily limit for generating ideas. ";
        
        if (subscription?.tier === 'free') {
          message += " Upgrade to Pro or Plus for more generations!";
        } else if (subscription?.tier === 'pro') {
          message += " Upgrade to Plus or Business for more generations!";
        } else if (subscription?.tier === 'plus') {
          message += " Upgrade to Business for unlimited generations!";
        }

        toast({
          variant: "destructive",
          title: "Usage Limit Reached",
          description: message,
        });
        setLoading(false);
        return;
      }

      // Check if this is an ad-related request
      const isAdRequest = videoType.toLowerCase().includes('ad') || 
                         videoType.toLowerCase().includes('advertisement') ||
                         videoType.toLowerCase().includes('promotional');

      console.log("Calling generate-ideas function with:", { niche, audience, videoType, platform, customIdeas, isAdRequest });
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-ideas', {
          body: {
            niche: niche.trim(),
            audience: audience.trim(),
            videoType: videoType.trim(),
            platform: platform,
            customIdeas: customIdeas.trim()
          },
        });

        console.log("Response from generate-ideas:", data, error);

        if (error) {
          console.error("Edge function error:", error);
          throw new Error(`Edge function error: ${error.message || 'Unknown error'}`);
        }

        if (!data) {
          console.error("Empty response from function");
          throw new Error('Empty response from AI service');
        }

        if (data.error) {
          console.error("Error in function response:", data.error);
          throw new Error(`Error from AI service: ${data.error}`);
        }

        if (!data.ideas || !Array.isArray(data.ideas)) {
          console.error("Invalid response format:", data);
          
          // If we have a raw response, it means the AI returned something but it wasn't JSON
          if (data.rawResponse) {
            console.log("Raw AI response:", data.rawResponse);
            throw new Error('The AI returned an invalid format. Please try again.');
          }
          
          throw new Error('Invalid response format from AI: ideas array is missing');
        }

        console.log("Ideas generated successfully:", data.ideas);

        const ideasToSave = data.ideas.map((idea: any) => ({
          title: idea.title,
          description: idea.description,
          category: idea.category,
          tags: idea.tags || [],
          platform: platform,
          user_id: userId,
          color: 'blue',
          is_saved: false,
          is_ad: isAdRequest // Now the column exists in the database
        }));

        const { error: saveError } = await supabase
          .from("video_ideas")
          .insert(ideasToSave);

        if (saveError) {
          console.error("Error saving ideas:", saveError);
          throw new Error(`Error saving ideas: ${saveError.message}`);
        }

        const { data: savedIdeas, error: fetchError } = await supabase
          .from("video_ideas")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(ideasToSave.length);

        if (fetchError) {
          console.error("Error fetching saved ideas:", fetchError);
          throw new Error(`Error fetching saved ideas: ${fetchError.message}`);
        }

        const transformedIdeas = (savedIdeas || []).map(transformSupabaseIdea);
        setIdeas(transformedIdeas);

        toast({
          title: "Success!",
          description: isAdRequest 
            ? "Your advertisement ideas have been generated and saved."
            : "Your video ideas have been generated and saved.",
        });
      } catch (functionError: any) {
        console.error('Error in generate-ideas function:', functionError);
        throw new Error(`Generate Ideas function error: ${functionError.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast({
        variant: "destructive",
        title: "Failed to Generate Ideas",
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
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
    setCustomIdeas
  };
};
