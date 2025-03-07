
import { useState, useEffect, useCallback } from "react";
import { GeneratedIdea, PreviousIdeasContext } from "@/types/idea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useIdeaGenerator = () => {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [videoType, setVideoType] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [customIdeas, setCustomIdeas] = useState("");
  const [previousIdeasContext, setPreviousIdeasContext] = useState<PreviousIdeasContext>({ 
    count: 0,
    titles: [],
    categories: [],
    descriptions: []
  });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Use these preferences from localStorage or database
  useEffect(() => {
    console.log("useIdeaGenerator: Fetching user preferences on mount");
    const fetchUserPreferences = async () => {
      try {
        console.log("Fetching user preferences from Supabase");
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            console.log("Profile data from database:", profile);
            // Set form values from profile if they exist
            if (profile.account_type === 'ecommerce') {
              if (profile.product_niche) {
                setNiche(profile.product_niche);
                console.log("Setting product niche:", profile.product_niche);
              }
              if (profile.target_audience) {
                setAudience(profile.target_audience);
                console.log("Setting target audience:", profile.target_audience);
              }
              // For ecommerce accounts, use content_niche for videoType
              if (profile.content_niche) {
                setVideoType(profile.content_niche);
                console.log("Setting content niche as video type:", profile.content_niche);
              }
            } else if (profile.account_type === 'business') {
              if (profile.business_niche) {
                setNiche(profile.business_niche);
                console.log("Setting business niche:", profile.business_niche);
              }
              if (profile.target_audience) {
                setAudience(profile.target_audience);
                console.log("Setting target audience:", profile.target_audience);
              }
              if (profile.content_niche) {
                setVideoType(profile.content_niche);
                console.log("Setting content niche as video type:", profile.content_niche);
              }
            } else {
              // Personal accounts
              if (profile.content_niche) {
                setNiche(profile.content_niche);
                console.log("Setting content niche:", profile.content_niche);
              }
              if (profile.target_audience) {
                setAudience(profile.target_audience);
                console.log("Setting target audience:", profile.target_audience);
              }
            }
            
            if (profile.posting_platforms && profile.posting_platforms.length > 0) {
              setPlatform(profile.posting_platforms[0]);
              console.log("Setting platform:", profile.posting_platforms[0]);
            }
          }
        }

        // Also check localStorage for any saved values (but profile values take precedence)
        const localStorageValues = {
          niche: localStorage.getItem("ideaGenerator.niche"),
          audience: localStorage.getItem("ideaGenerator.audience"),
          videoType: localStorage.getItem("ideaGenerator.videoType"),
          platform: localStorage.getItem("ideaGenerator.platform"),
        };
        
        console.log("LocalStorage values:", localStorageValues);

        if (!niche && localStorageValues.niche) setNiche(localStorageValues.niche);
        if (!audience && localStorageValues.audience) setAudience(localStorageValues.audience);
        if (!videoType && localStorageValues.videoType) setVideoType(localStorageValues.videoType);
        if (!platform && localStorageValues.platform) setPlatform(localStorageValues.platform);
        
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    fetchUserPreferences();
  }, []);

  // Listen for auth state changes to update preferences
  useEffect(() => {
    console.log("Auth state changed, fetching preferences");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        // Refetch preferences when user signs in
        try {
          console.log("Fetching user preferences from Supabase");
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              console.log("Profile data from database:", profile);
              // Only set values if they're not already set by the user
              if (!niche && profile.product_niche) setNiche(profile.product_niche);
              if (!audience && profile.target_audience) setAudience(profile.target_audience);
              if (!videoType && profile.product_niche) setVideoType(profile.product_niche);
              if (!platform && profile.posting_platforms && profile.posting_platforms.length > 0) 
                setPlatform(profile.posting_platforms[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching user preferences after auth change:", error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [niche, audience, videoType, platform]);

  // Setup localStorage change listeners
  useEffect(() => {
    console.log("Setting up localStorage change listeners");
    
    // Save to localStorage when values change
    if (niche) localStorage.setItem("ideaGenerator.niche", niche);
    if (audience) localStorage.setItem("ideaGenerator.audience", audience);
    if (videoType) localStorage.setItem("ideaGenerator.videoType", videoType);
    if (platform) localStorage.setItem("ideaGenerator.platform", platform);
    
  }, [niche, audience, videoType, platform]);

  // Save previous context to localStorage when it changes
  useEffect(() => {
    if (previousIdeasContext.titles.length > 0) {
      localStorage.setItem('previousIdeasContext', JSON.stringify(previousIdeasContext));
    }
  }, [previousIdeasContext]);

  const generateIdeas = useCallback(async () => {
    if (!niche) {
      toast({
        title: "Please specify a niche",
        description: "Enter a niche to generate ideas",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // First, ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const errorMsg = sessionError ? 
          `Authentication error: ${sessionError.message}` : 
          "You must be logged in to generate ideas";
        
        console.error("Session error:", errorMsg);
        setError(errorMsg);
        setLoading(false);
        
        // Force refresh of the auth state
        await supabase.auth.refreshSession();
        return;
      }

      if (!session.access_token) {
        console.error("No access token in session");
        setError("Authentication error: No access token");
        setLoading(false);
        return;
      }

      console.log("Session found, proceeding with authentication header");
      
      // Use the session token from the current session
      const authHeader = `Bearer ${session.access_token}`;
      console.log("Auth header created (token redacted for security)");
      
      // First check usage limits
      console.log("Calling check-usage-limits function with auth header");
      const checkResponse = await supabase.functions.invoke('check-usage-limits', {
        body: { action: 'ideas' },
        headers: {
          Authorization: authHeader
        }
      });

      console.log("Usage check response:", checkResponse);
      
      if (checkResponse.error) {
        console.error("Usage check error:", checkResponse.error);
        setError(`Usage check error: ${checkResponse.error.message || "Unable to check usage limits"}`);
        setLoading(false);
        return;
      }
      
      if (!checkResponse.data?.canProceed) {
        // Handle usage limit reached
        const errorMessage = checkResponse.data?.message || "You've reached your daily limit for idea generation";
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      // Fetch the user's profile to get additional context
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      console.log("Fetched user profile for additional context:", userProfile);
      
      // Now proceed with idea generation if usage limits allow
      console.log("Calling generate-ideas function with auth header");
      console.log("Sending data:", {
        niche,
        audience,
        videoType,
        platform,
        customIdeas,
        previousIdeas: previousIdeasContext,
        numIdeas: 5,
        accountType: userProfile?.account_type || 'personal',
        isEcommerce: userProfile?.account_type === 'ecommerce',
        productNiche: userProfile?.product_niche
      });
      
      const { data, error: generationError } = await supabase.functions.invoke('generate-ideas', {
        body: {
          niche,
          audience,
          videoType,
          platform,
          customIdeas,
          previousIdeas: previousIdeasContext,
          numIdeas: 5, // Explicitly requesting 5 ideas
          accountType: userProfile?.account_type || 'personal',
          isEcommerce: userProfile?.account_type === 'ecommerce',
          productNiche: userProfile?.product_niche,
          contentNiche: userProfile?.content_niche,
          targetAudience: userProfile?.target_audience
        },
        headers: {
          Authorization: authHeader
        }
      });

      if (generationError) {
        console.error("Generation error:", generationError);
        setError(`Error generating ideas: ${generationError.message || "Unknown error"}`);
        setLoading(false);
        return;
      }

      console.log("Generated ideas data:", data);
      
      if (!data?.ideas || !Array.isArray(data.ideas)) {
        console.error("Invalid response format:", data);
        setError("Invalid response format from idea generator");
        setLoading(false);
        return;
      }

      // Ensure we're only taking exactly 5 ideas
      let ideasToUse = data.ideas;
      if (ideasToUse.length > 5) {
        console.log(`Limiting ideas from ${ideasToUse.length} to exactly 5`);
        ideasToUse = ideasToUse.slice(0, 5);
      }

      // Format and clean up the ideas for display
      const formattedIdeas = ideasToUse.map((idea: any) => ({
        id: crypto.randomUUID(), // Add temporary client-side ID
        title: typeof idea.title === 'string' ? idea.title.replace(/^"|"$/g, '') : 'Untitled Idea',
        category: typeof idea.category === 'string' ? idea.category.replace(/^"|"$/g, '') : 'General',
        description: typeof idea.description === 'string' ? idea.description.replace(/^"|"$/g, '') : '',
        tags: Array.isArray(idea.tags) ? idea.tags.map((tag: any) => 
          typeof tag === 'string' ? tag.replace(/^"|"$/g, '') : tag
        ) : [],
        is_saved: false
      }));

      // Record the generated ideas to avoid duplicates in future
      const newTitles = formattedIdeas.map((idea: any) => idea.title);
      const newCategories = formattedIdeas.map((idea: any) => idea.category || "");
      const newDescriptions = formattedIdeas.map((idea: any) => idea.description || "");
      
      setPreviousIdeasContext(prev => ({
        count: (prev.count || 0) + newTitles.length,
        titles: [...prev.titles, ...newTitles].slice(-30),  // Keep last 30 titles
        categories: [...(prev.categories || []), ...newCategories].slice(-30),
        descriptions: [...(prev.descriptions || []), ...newDescriptions].slice(-30)
      }));

      // Save generated ideas to database with user_id
      if (session?.user?.id) {
        const userId = session.user.id;
        
        const ideasWithMetadata = formattedIdeas.map((idea: any) => ({
          ...idea,
          user_id: userId
        }));
        
        // Save to Supabase
        try {
          const { error: saveError } = await supabase
            .from('video_ideas')
            .insert(ideasWithMetadata);
          
          if (saveError) {
            console.error("Error saving ideas to database:", saveError);
            // Continue anyway - the ideas will still be displayed to the user
          } else {
            console.log("Ideas saved to database successfully");
            
            // Now fetch the saved ideas to get their database IDs and additional fields
            const { data: savedIdeas, error: fetchError } = await supabase
              .from('video_ideas')
              .select('*')
              .eq('user_id', userId)
              .in('title', newTitles)
              .order('created_at', { ascending: false })
              .limit(5); // Make sure we only get 5 ideas
            
            if (fetchError) {
              console.error("Error fetching saved ideas:", fetchError);
              setIdeas(formattedIdeas);  // Fall back to the generated ideas without IDs
            } else {
              console.log("Fetched saved ideas:", savedIdeas);
              setIdeas(savedIdeas);
            }
          }
        } catch (dbError) {
          console.error("Database error:", dbError);
          // Still show ideas to user even if saving failed
          setIdeas(formattedIdeas);
        }
      } else {
        // If not logged in (shouldn't happen due to earlier check)
        setIdeas(formattedIdeas);
      }
      
    } catch (error: any) {
      console.error("Error generating ideas:", error);
      setError(`Error generating ideas: ${error.message || "Unknown error"}`);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [niche, audience, videoType, platform, customIdeas, previousIdeasContext, toast]);

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
    setCustomIdeas,
    previousIdeasContext,
    setPreviousIdeasContext,
    error,
    setError
  };
};
