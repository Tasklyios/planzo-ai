import { useState, useEffect, useCallback } from "react";
import { GeneratedIdea, PreviousIdeasContext, AccountType } from "@/types/idea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface GenerateIdeasParams {
  // Add additional parameters to ensure latest form data is used
  currentNiche?: string;
  currentAudience?: string;
  currentVideoType?: string;
  currentPlatform?: string;
  currentCustomIdeas?: string;
}

export const useIdeaGenerator = () => {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [videoType, setVideoType] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [customIdeas, setCustomIdeas] = useState("");
  const [previousIdeasContext, setPreviousIdeasContext] = useState<PreviousIdeasContext>({ 
    count: 0,
    titles: [],
    categories: [],
    descriptions: []
  });
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [contentType, setContentType] = useState<string>("");
  const [postingFrequency, setPostingFrequency] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    console.log("useIdeaGenerator: Fetching user preferences and existing ideas on mount");
    const fetchUserPreferencesAndIdeas = async () => {
      try {
        setLoadingExisting(true);
        console.log("Fetching user preferences from Supabase");
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch user preferences
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            console.log("Profile data from database:", profile);
            // Store account type
            if (profile.account_type) {
              console.log("Setting account type to:", profile.account_type);
              // Fix: Cast the account_type to the specific union type
              const typedAccountType = profile.account_type as "personal" | "ecommerce" | "business";
              setAccountType(typedAccountType);
            }
            
            // Store additional profile data
            if (profile.content_type) {
              console.log("Setting content type to:", profile.content_type);
              setContentType(profile.content_type);
            }
            
            if (profile.posting_frequency) {
              console.log("Setting posting frequency to:", profile.posting_frequency);
              setPostingFrequency(profile.posting_frequency);
            }
            
            // Only set form values from profile if they exist AND are relevant to current account type
            if (profile.account_type === 'personal') {
              if (profile.content_niche) {
                console.log("Setting personal niche to content_niche:", profile.content_niche);
                setNiche(profile.content_niche);
              }
              if (profile.target_audience) setAudience(profile.target_audience);
              // Don't auto-fill videoType from content_niche
            } else if (profile.account_type === 'ecommerce') {
              if (profile.product_niche) {
                console.log("Setting ecommerce niche to product_niche:", profile.product_niche);
                setNiche(profile.product_niche);
              }
              if (profile.target_audience) setAudience(profile.target_audience);
              // Don't auto-fill videoType from content_niche
            } else if (profile.account_type === 'business') {
              if (profile.business_niche) {
                console.log("Setting business niche to business_niche:", profile.business_niche);
                setNiche(profile.business_niche);
              }
              if (profile.target_audience) setAudience(profile.target_audience);
              // Don't auto-fill videoType from content_niche
            }
            
            if (profile.posting_platforms && profile.posting_platforms.length > 0) 
              setPlatform(profile.posting_platforms[0]);
          }

          // Fetch existing generated ideas that are not saved
          const thresholdDate = new Date();
          thresholdDate.setDate(thresholdDate.getDate() - 1); // 24 hours ago
          
          const { data: existingIdeas, error: ideasError } = await supabase
            .from('video_ideas')
            .select('*')
            .eq('user_id', session.user.id)
            .is('is_saved', false)
            .is('scheduled_for', null)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (ideasError) {
            console.error("Error fetching existing ideas:", ideasError);
          } else if (existingIdeas && existingIdeas.length > 0) {
            console.log("Found existing generated ideas:", existingIdeas);
            setIdeas(existingIdeas);
          }
        }

        // Also check localStorage for any saved values
        const localStorageValues = {
          niche: localStorage.getItem("ideaGenerator.niche"),
          audience: localStorage.getItem("ideaGenerator.audience"),
          videoType: localStorage.getItem("ideaGenerator.videoType"),
          platform: localStorage.getItem("ideaGenerator.platform"),
        };
        
        console.log("LocalStorage values:", localStorageValues);

        if (localStorageValues.niche) setNiche(localStorageValues.niche);
        if (localStorageValues.audience) setAudience(localStorageValues.audience);
        if (localStorageValues.videoType) setVideoType(localStorageValues.videoType);
        if (localStorageValues.platform) setPlatform(localStorageValues.platform);
        
      } catch (error) {
        console.error("Error fetching user preferences or existing ideas:", error);
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchUserPreferencesAndIdeas();
  }, []);

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
              // Set account type first
              if (profile.account_type) {
                console.log("Setting account type to:", profile.account_type);
                // Fix: Cast the account_type to the specific union type
                const typedAccountType = profile.account_type as "personal" | "ecommerce" | "business";
                setAccountType(typedAccountType);
              }
              
              // Set additional profile data
              if (profile.content_type) {
                console.log("Setting content type to:", profile.content_type);
                setContentType(profile.content_type);
              }
              
              if (profile.posting_frequency) {
                console.log("Setting posting frequency to:", profile.posting_frequency);
                setPostingFrequency(profile.posting_frequency);
              }
              
              // Only set values if they're not already set by the user AND relevant to current account type
              const currentAccountType = profile.account_type || 'personal';
              
              if (currentAccountType === 'personal') {
                if (!niche && profile.content_niche) {
                  console.log("Setting personal niche to content_niche:", profile.content_niche);
                  setNiche(profile.content_niche);
                }
              } else if (currentAccountType === 'ecommerce') {
                if (!niche && profile.product_niche) {
                  console.log("Setting ecommerce niche to product_niche:", profile.product_niche);
                  setNiche(profile.product_niche);
                }
              } else if (currentAccountType === 'business') {
                if (!niche && profile.business_niche) {
                  console.log("Setting business niche to business_niche:", profile.business_niche);
                  setNiche(profile.business_niche);
                }
              }
              
              if (!audience && profile.target_audience) setAudience(profile.target_audience);
              // Don't auto-fill videoType from content_niche
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
  }, [niche, audience, videoType, platform, accountType]);

  useEffect(() => {
    console.log("Setting up localStorage change listeners");
    
    // Save to localStorage when values change
    if (niche) localStorage.setItem("ideaGenerator.niche", niche);
    if (audience) localStorage.setItem("ideaGenerator.audience", audience);
    if (videoType) localStorage.setItem("ideaGenerator.videoType", videoType);
    if (platform) localStorage.setItem("ideaGenerator.platform", platform);
    
  }, [niche, audience, videoType, platform]);

  useEffect(() => {
    if (previousIdeasContext.titles.length > 0) {
      localStorage.setItem('previousIdeasContext', JSON.stringify(previousIdeasContext));
    }
  }, [previousIdeasContext]);

  const generateIdeas = useCallback(async (params?: GenerateIdeasParams) => {
    const currentNiche = params?.currentNiche || niche;
    const currentAudience = params?.currentAudience || audience;
    const currentVideoType = params?.currentVideoType || videoType;
    const currentPlatform = params?.currentPlatform || platform;
    const currentCustomIdeas = params?.currentCustomIdeas || customIdeas;

    if (!currentNiche) {
      toast({
        title: "Please specify a niche",
        description: "Enter a niche to generate ideas",
        variant: "destructive"
      });
      return;
    }

    console.log("Generating ideas with CURRENT values:");
    console.log("Niche:", currentNiche);
    console.log("Audience:", currentAudience);
    console.log("Video Type:", currentVideoType);
    console.log("Platform:", currentPlatform);
    console.log("Custom Ideas:", currentCustomIdeas);
    console.log("Account Type:", accountType);
    console.log("Content Type:", contentType);
    console.log("Posting Frequency:", postingFrequency);

    setLoading(true);
    setError(null);
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const errorMsg = sessionError ? 
          `Authentication error: ${sessionError.message}` : 
          "You must be logged in to generate ideas";
        
        console.error("Session error:", errorMsg);
        setError(errorMsg);
        setLoading(false);
        
        supabase.auth.refreshSession();
        clearTimeout(timeoutId);
        return;
      }

      if (!session.access_token) {
        console.error("No access token in session");
        setError("Authentication error: No access token");
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      console.log("Session found, proceeding with authentication header");
      
      const authHeader = `Bearer ${session.access_token}`;
      console.log("Auth header created (token redacted for security)");
      
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
        clearTimeout(timeoutId);
        return;
      }
      
      if (!checkResponse.data?.canProceed) {
        const errorMessage = checkResponse.data?.message || "You've reached your daily limit for idea generation";
        setError(errorMessage);
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      let currentAccountType = accountType;
      let currentContentType = contentType;
      let currentPostingFrequency = postingFrequency;
      
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("account_type, content_type, posting_frequency, business_description")
          .eq("id", session.user.id)
          .single();
        
        if (profileData) {
          if (profileData.account_type) {
            // Fix: Cast the account_type to the specific union type
            currentAccountType = profileData.account_type as "personal" | "ecommerce" | "business";
            console.log("Updated account type from database:", currentAccountType);
          }
          
          if (profileData.content_type) {
            currentContentType = profileData.content_type;
            console.log("Updated content type from database:", currentContentType);
          }
          
          if (profileData.posting_frequency) {
            currentPostingFrequency = profileData.posting_frequency;
            console.log("Updated posting frequency from database:", currentPostingFrequency);
          }
        }
      } catch (error) {
        console.error("Error fetching latest profile data:", error);
      }

      console.log("Calling generate-ideas function with auth header and current form data");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      const { data, error: generationError } = await supabase.functions.invoke('generate-ideas', {
        body: {
          niche: currentNiche,
          audience: currentAudience,
          videoType: currentVideoType,
          platform: currentPlatform,
          customIdeas: currentCustomIdeas,
          previousIdeas: previousIdeasContext,
          numIdeas: 5,
          accountType: currentAccountType,
          businessDescription: profile?.business_description || "",
          contentType: currentContentType,
          postingFrequency: currentPostingFrequency
        },
        headers: {
          Authorization: authHeader
        }
      });

      clearTimeout(timeoutId);

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

      const limitedIdeas = data.ideas.slice(0, 5);
      const formattedIdeas = limitedIdeas.map((idea: any) => ({
        id: crypto.randomUUID(),
        title: typeof idea.title === 'string' ? idea.title.replace(/^"|"$/g, '') : 'Untitled Idea',
        category: typeof idea.category === 'string' ? idea.category.replace(/^"|"$/g, '') : 'General',
        description: typeof idea.description === 'string' ? idea.description.replace(/^"|"$/g, '') : '',
        tags: Array.isArray(idea.tags) ? idea.tags.map((tag: any) => 
          typeof tag === 'string' ? tag.replace(/^"|"$/g, '') : tag
        ) : [],
        status: 'generated',
        is_saved: false,
        user_id: session.user.id, // Explicitly set user_id for database compatibility
        emoji: idea.emoji || '🍎',
        hook_text: idea.hook_text || '',
        hook_category: idea.hook_category || ''
      }));

      const newTitles = formattedIdeas.map((idea: any) => idea.title);
      const newCategories = formattedIdeas.map((idea: any) => idea.category || "");
      const newDescriptions = formattedIdeas.map((idea: any) => idea.description || "");
      
      setPreviousIdeasContext(prev => ({
        count: (prev.count || 0) + newTitles.length,
        titles: [...prev.titles, ...newTitles].slice(-30),
        categories: [...(prev.categories || []), ...newCategories].slice(-30),
        descriptions: [...(prev.descriptions || []), ...newDescriptions].slice(-30)
      }));

      if (session?.user?.id) {
        const userId = session.user.id;
        
        const ideasWithMetadata = formattedIdeas.map((idea: any) => ({
          ...idea,
          user_id: userId // Ensure user_id is set correctly
        }));
        
        try {
          const { error: saveError } = await supabase
            .from('video_ideas')
            .insert(ideasWithMetadata);
          
          if (saveError) {
            console.error("Error saving ideas to database:", saveError);
            setIdeas(formattedIdeas);
          } else {
            console.log("Ideas saved to database successfully");
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const { data: savedIdeas, error: fetchError } = await supabase
              .from('video_ideas')
              .select('*')
              .eq('user_id', userId)
              .in('title', newTitles)
              .order('created_at', { ascending: false });
            
            if (fetchError) {
              console.error("Error fetching saved ideas:", fetchError);
              setIdeas(formattedIdeas);
            } else {
              console.log("Fetched saved ideas:", savedIdeas);
              setIdeas(savedIdeas.slice(0, 5));
            }
          }
        } catch (dbError) {
          console.error("Database error:", dbError);
          setIdeas(formattedIdeas);
        }
      } else {
        setIdeas(formattedIdeas);
      }
      
      setLoading(false);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error generating ideas:", error);
      
      if (error.name === 'AbortError') {
        setError('The request took too long. Please try again.');
      } else {
        setError(`Error generating ideas: ${error.message || "Unknown error"}`);
      }
      
      setIdeas([]);
      setLoading(false);
    }
  }, [niche, audience, videoType, platform, customIdeas, previousIdeasContext, toast, accountType, contentType, postingFrequency]);

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
    loadingExisting,
    ideas,
    setIdeas,
    generateIdeas,
    customIdeas,
    setCustomIdeas,
    previousIdeasContext,
    setPreviousIdeasContext,
    error,
    setError,
    accountType,
    setAccountType,
    contentType,
    setContentType,
    postingFrequency,
    setPostingFrequency
  };
};
