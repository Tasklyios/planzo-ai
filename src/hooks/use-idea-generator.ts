
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { GeneratedIdea, PreviousIdeasContext, StyleProfile } from "@/types/idea";

export const useIdeaGenerator = () => {
  const [niche, setNiche] = useState(() => localStorage.getItem("niche") || "");
  const [audience, setAudience] = useState(() => localStorage.getItem("audience") || "");
  const [videoType, setVideoType] = useState(() => localStorage.getItem("videoType") || "");
  const [platform, setPlatform] = useState(() => localStorage.getItem("platform") || "TikTok");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [customIdeas, setCustomIdeas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previousIdeasContext, setPreviousIdeasContext] = useState<PreviousIdeasContext>({
    count: 0,
    titles: [],
    categories: [],
    descriptions: []
  });
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
        .select('account_type, content_niche, business_niche, product_niche, target_audience, posting_platforms, content_style, content_personality, active_style_profile_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      console.log("Profile data from database:", profile);

      // Check if user has an active style profile
      if (profile && profile.active_style_profile_id) {
        // Fetch the active style profile
        const { data: styleProfile, error: styleError } = await supabase
          .from('style_profiles')
          .select('*')
          .eq('id', profile.active_style_profile_id)
          .maybeSingle();
          
        if (!styleError && styleProfile) {
          console.log("Active style profile found:", styleProfile);
          
          // Use the style profile content style and personality
          if (styleProfile.content_style) {
            localStorage.setItem("contentStyle", styleProfile.content_style);
          }
          
          if (styleProfile.content_personality) {
            localStorage.setItem("contentPersonality", styleProfile.content_personality);
          }
        }
      } else if (profile) {
        // Determine which niche to use based on account type
        let nicheValue = "";
        
        if (profile.account_type === 'business' && profile.business_niche) {
          nicheValue = profile.business_niche;
        } else if (profile.account_type === 'ecommerce' && profile.product_niche) {
          // For ecommerce, use product_niche for the main niche field
          nicheValue = profile.product_niche;
        } else {
          nicheValue = profile.content_niche || "";
        }

        console.log(`Setting niche based on account type (${profile.account_type}):`, nicheValue);

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

        // Don't auto-fill videoType from profile, leave it to be manually entered
        if (!videoType) {
          // Only set a default value if it's empty
          const defaultVideoType = profile.account_type === 'ecommerce' ? 'Product Showcase' : 'Tutorial';
          setVideoType(defaultVideoType);
          localStorage.setItem("videoType", defaultVideoType);
        }

        // Store content style in localStorage if available
        if (profile.content_style) {
          localStorage.setItem("contentStyle", profile.content_style);
        }
        
        // Store content personality in localStorage if available
        if (profile.content_personality) {
          localStorage.setItem("contentPersonality", profile.content_personality);
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
    console.log("Transforming idea:", idea);
    return {
      id: idea.id,
      title: idea.title || "Untitled",
      category: idea.category || "General",
      description: idea.description || "No description provided",
      tags: idea.tags || [],
      platform: idea.platform || platform,
      color: idea.color || "blue",
      is_saved: Boolean(idea.is_saved),
      scheduled_for: idea.scheduled_for
    };
  };

  // Update previous ideas context with newly generated ideas
  const updatePreviousIdeasContext = (newIdeas: GeneratedIdea[]) => {
    // Limit the number of stored previous ideas to avoid excessive context
    const maxStoredIdeas = 20;
    
    // Extract relevant information from new ideas
    const newTitles = newIdeas.map(idea => idea.title);
    const newCategories = newIdeas.map(idea => idea.category);
    const newDescriptions = newIdeas.map(idea => idea.description);
    
    // Create updated context
    const updatedContext: PreviousIdeasContext = {
      count: previousIdeasContext.count + newIdeas.length,
      titles: [...previousIdeasContext.titles, ...newTitles].slice(-maxStoredIdeas),
      categories: [...previousIdeasContext.categories, ...newCategories].slice(-maxStoredIdeas),
      descriptions: [...previousIdeasContext.descriptions, ...newDescriptions].slice(-maxStoredIdeas)
    };
    
    // Update state and localStorage
    setPreviousIdeasContext(updatedContext);
    localStorage.setItem('previousIdeasContext', JSON.stringify(updatedContext));
    
    console.log("Updated previous ideas context:", updatedContext);
  };

  // Modified function for detecting eco keywords
  const detectEcoKeywords = (niche: string, customIdeas: string): boolean => {
    const ecoKeywords = [
      'eco', 'green', 'sustainable', 'environment', 'recycled', 'organic', 
      'natural', 'biodegradable', 'zero waste', 'eco-friendly', 'vegan', 
      'plant-based', 'carbon neutral', 'compostable', 'ethical', 'clean'
    ];
    
    // Check if any eco keywords are in the niche or custom ideas
    const nicheMatches = ecoKeywords.some(keyword => 
      niche?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const customIdeasMatches = customIdeas && ecoKeywords.some(keyword => 
      customIdeas.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return nicheMatches || customIdeasMatches;
  };

  // Updated helper function to check if user is an ecommerce account and get product category
  const checkIsEcommerce = async (userId: string): Promise<{isEcommerce: boolean, productCategory: string | null}> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_type, product_niche')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error checking account type:", error);
        return { isEcommerce: false, productCategory: null };
      }
      
      // Return true if it's an ecommerce account OR if the niche contains ecommerce-related keywords
      const nicheKeywords = ['product', 'shop', 'store', 'ecommerce', 'e-commerce', 'marketplace'];
      const isEcommerceNiche = data?.product_niche && 
                              nicheKeywords.some(keyword => 
                                data.product_niche.toLowerCase().includes(keyword.toLowerCase()));
      
      return { 
        isEcommerce: data?.account_type === 'ecommerce' || isEcommerceNiche,
        productCategory: data?.product_niche || null
      };
    } catch (error) {
      console.error("Error in checkIsEcommerce:", error);
      return { isEcommerce: false, productCategory: null };
    }
  };

  // New function to generate market research based on product category
  const getMarketResearch = (productCategory: string | null, niche: string): any => {
    // Default market research for general ecommerce
    const defaultResearch = {
      successfulTactics: [
        "Product showcase with key features highlighted",
        "Customer testimonials and reviews",
        "Behind-the-scenes of product creation",
        "Problem-solution format showing how product solves an issue",
        "Day-in-the-life with the product",
        "Unboxing experiences and first impressions"
      ],
      contentTypes: [
        "How-to tutorials",
        "Product comparisons",
        "Limited-time offers and flash sales",
        "Lifestyle usage videos",
        "FAQs answered visually",
        "Product care and maintenance"
      ]
    };

    // Eyewear specific research (Sungod, Oakley)
    const eyewearResearch = {
      successfulTactics: [
        "Durability tests (dropping, bending, sitting on them)",
        "Showcasing polarized lens benefits in different environments",
        "Sports performance demonstrations with athletes",
        "Style pairing suggestions with different outfits",
        "Transition between different lighting conditions",
        "Side-by-side comparison with cheaper alternatives"
      ],
      contentTypes: [
        "Adventure videos with product in action",
        "UV protection demonstrations",
        "Before/after visual clarity comparisons",
        "Customization options and process",
        "Lens technology explanations",
        "Customer transformation stories"
      ],
      brandExamples: [
        "Sungod's UGC featuring customers in extreme sports",
        "Oakley's athlete collaboration content",
        "Ray-Ban's iconic style showcase videos",
        "Warby Parker's home try-on program highlights"
      ]
    };

    // Fashion specific research
    const fashionResearch = {
      successfulTactics: [
        "Outfit transformations and styling tips",
        "Seasonal lookbooks and trending styles",
        "Material quality close-ups and texture showcases",
        "Size inclusivity demonstrations with different body types",
        "Color variants in different lighting conditions",
        "Mix and match possibilities from limited pieces"
      ],
      contentTypes: [
        "Get ready with me (GRWM) featuring products",
        "Fashion hauls and try-ons",
        "Styling one piece multiple ways",
        "Wardrobe essentials featuring your products",
        "Transition videos between outfits",
        "Behind-the-scenes of photoshoots"
      ]
    };
    
    // Tech and gadgets research
    const techResearch = {
      successfulTactics: [
        "Problem-solution demonstrations in real-life contexts",
        "Speed/performance tests against competitors",
        "Unboxing with genuine reactions",
        "Hidden features and tips demonstrations",
        "Battery life and durability showcases",
        "Customer success stories with before/after results"
      ],
      contentTypes: [
        "Quick tech tutorials",
        "Day-in-life productivity improvements",
        "Setup tours and optimization tips",
        "Integration with other popular tech products",
        "Tech hacks featuring your product",
        "Problem-solving scenarios"
      ]
    };
    
    // Determine which research to use based on category or niche
    const lowerNiche = (niche || "").toLowerCase();
    const lowerCategory = (productCategory || "").toLowerCase();
    
    if (lowerCategory.includes('eyewear') || lowerCategory.includes('glasses') || 
        lowerCategory.includes('sunglasses') || lowerNiche.includes('eyewear') || 
        lowerNiche.includes('glasses') || lowerNiche.includes('sunglasses')) {
      return eyewearResearch;
    }
    
    if (lowerCategory.includes('fashion') || lowerCategory.includes('clothing') || 
        lowerCategory.includes('apparel') || lowerNiche.includes('fashion') || 
        lowerNiche.includes('clothing') || lowerNiche.includes('apparel')) {
      return fashionResearch;
    }
    
    if (lowerCategory.includes('tech') || lowerCategory.includes('gadget') || 
        lowerCategory.includes('electronics') || lowerNiche.includes('tech') || 
        lowerNiche.includes('gadget') || lowerNiche.includes('electronics')) {
      return techResearch;
    }
    
    return defaultResearch;
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
    setError(null);
    // Clear previous ideas when generating new ones
    setIdeas([]);

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
        body: { action: 'ideas' }
      });

      if (usageError) {
        console.error("Usage check error:", usageError);
        setError(`Usage check error: ${usageError.message}`);
        setLoading(false);
        return;
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
        setError(message);
        setLoading(false);
        return;
      }

      // Check for eco-related keywords to apply optimizations
      const isEcoRelated = detectEcoKeywords(niche, customIdeas);
      const { isEcommerce, productCategory } = await checkIsEcommerce(userId);
      
      // Get market research data based on product category
      const marketResearch = isEcommerce ? getMarketResearch(productCategory, niche) : null;
      
      // Use a more specific model for ecommerce to speed up generation
      const modelToUse = isEcommerce ? 'gpt-4o-mini' : undefined; // Use mini for ecommerce for speed

      console.log("Calling generate-ideas function with:", { 
        niche, 
        audience, 
        videoType, 
        platform, 
        customIdeas,
        contentStyle: localStorage.getItem("contentStyle") || "",
        contentPersonality: localStorage.getItem("contentPersonality") || "",
        previousIdeasContext,
        numIdeas: 5,
        isEcoRelated,
        isEcommerce,
        modelOverride: modelToUse,
        marketResearch: marketResearch
      });
      
      try {
        const start = performance.now();
        
        const { data, error } = await supabase.functions.invoke('generate-ideas', {
          body: {
            niche: niche.trim(),
            audience: audience.trim(),
            videoType: videoType.trim(),
            platform: platform,
            customIdeas: customIdeas.trim(),
            contentStyle: localStorage.getItem("contentStyle") || "",
            contentPersonality: localStorage.getItem("contentPersonality") || "",
            previousIdeas: previousIdeasContext,
            numIdeas: 5,
            isEcoRelated,
            isEcommerce,
            optimizeForViral: isEcommerce,
            modelOverride: modelToUse,
            marketResearch: marketResearch
          },
        });
        
        const end = performance.now();
        console.log(`Idea generation took ${end - start}ms`);
        console.log("Response from generate-ideas:", data, error);

        if (error) {
          console.error("Edge function error:", error);
          setError(`Edge function error: ${error.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }

        if (!data) {
          console.error("Empty response from function");
          setError('Empty response from AI service. Please try again.');
          setLoading(false);
          return;
        }

        if (data.error) {
          console.error("Error in function response:", data.error);
          setError(`Error from AI service: ${data.error}`);
          setLoading(false);
          return;
        }

        if (!data.ideas || !Array.isArray(data.ideas)) {
          console.error("Invalid response format:", data);
          
          if (data.rawResponse) {
            console.log("Raw AI response:", data.rawResponse);
            setError('The AI returned an invalid format. Please try again.');
            setLoading(false);
            return;
          }
          
          setError('Invalid response format from AI: ideas array is missing');
          setLoading(false);
          return;
        }

        console.log("Ideas generated successfully:", data.ideas);

        const isAdRequest = videoType.toLowerCase().includes('ad') || 
                           videoType.toLowerCase().includes('advertisement') ||
                           videoType.toLowerCase().includes('promotional');

        // Only process up to 5 ideas
        const ideasToProcess = (data.ideas || []).slice(0, 5);

        const ideasToSave = ideasToProcess.map((idea: any) => ({
          title: idea.title || "Untitled Idea",
          description: idea.description || "No description provided",
          category: idea.category || "General",
          tags: idea.tags || [],
          platform: platform,
          user_id: userId,
          color: 'blue',
          is_saved: false,
          is_ad: isAdRequest,
          status: "ideas"
        }));

        console.log("Ideas to save:", ideasToSave);

        // Use insert with returning to get the inserted rows
        const { data: insertResult, error: saveError } = await supabase
          .from("video_ideas")
          .insert(ideasToSave)
          .select();

        if (saveError) {
          console.error("Error saving ideas:", saveError);
          setError(`Error saving ideas: ${saveError.message}`);
          setLoading(false);
          return;
        }

        console.log("Insert result:", insertResult);

        if (insertResult && insertResult.length > 0) {
          // Transform the returned data directly instead of fetching again
          const transformedIdeas = insertResult.map(transformSupabaseIdea);
          console.log("Transformed ideas (from insert result):", transformedIdeas);
          
          // Set ideas - make sure this is working
          setIdeas(transformedIdeas);
          updatePreviousIdeasContext(transformedIdeas);
          
          toast({
            title: "Success!",
            description: isAdRequest 
              ? "Your advertisement ideas have been generated."
              : "Your video ideas have been generated.",
          });
        } else {
          // Fallback to fetching if insert doesn't return data
          console.log("Fetching newly created ideas as fallback...");
          const { data: savedIdeas, error: fetchError } = await supabase
            .from("video_ideas")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(ideasToSave.length);

          if (fetchError) {
            console.error("Error fetching saved ideas:", fetchError);
            setError(`Error fetching saved ideas: ${fetchError.message}`);
            setLoading(false);
            return;
          }

          console.log("Fetched ideas:", savedIdeas);
          if (savedIdeas && savedIdeas.length > 0) {
            const transformedIdeas = savedIdeas.map(transformSupabaseIdea);
            console.log("Transformed ideas (from fetch):", transformedIdeas);
            setIdeas(transformedIdeas);
            updatePreviousIdeasContext(transformedIdeas);
            
            toast({
              title: "Success!",
              description: isAdRequest 
                ? "Your advertisement ideas have been generated."
                : "Your video ideas have been generated.",
            });
          } else {
            console.error("No ideas were returned after saving");
            setError("No ideas were generated. Please try again.");
            setLoading(false);
            return;
          }
        }
      } catch (functionError: any) {
        console.error('Error in generate-ideas function:', functionError);
        setError(`Generate Ideas function error: ${functionError.message || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
      toast({
        variant: "destructive",
        title: "Failed to Generate Ideas",
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
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
    setCustomIdeas,
    error,
    setError,
    previousIdeasContext,
    setPreviousIdeasContext
  };
};
