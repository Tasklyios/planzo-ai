import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedIdea, PreviousIdeasContext } from "@/types/idea";

export const useIdeaGenerator = () => {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [videoType, setVideoType] = useState("");
  const [platform, setPlatform] = useState("");
  const [customIdeas, setCustomIdeas] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [previousIdeasContext, setPreviousIdeasContext] = useState<PreviousIdeasContext>({
    titles: [],
    timestamp: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);

  // Add a status enum for better error handling
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const fetchAccountType = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          console.warn("No user session found.");
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching account type:", error);
          return;
        }

        if (profile && profile.account_type) {
          setAccountType(profile.account_type);
          console.log(`Fetched account type: ${profile.account_type}`);
        } else {
          console.warn("Account type not found in profile.");
        }
      } catch (error) {
        console.error("Error fetching account type:", error);
      }
    };

    fetchAccountType();
  }, []);

  const generateIdeas = async (params?: any) => {
    try {
      setLoading(true);
      setStatus('loading');
      setError(null);
      setFallbackMode(false);

      const nicheToUse = params?.currentNiche || niche;
      const audienceToUse = params?.currentAudience || audience;
      const videoTypeToUse = params?.currentVideoType || videoType;
      const platformToUse = params?.currentPlatform || platform;
      const customIdeasToUse = params?.currentCustomIdeas || customIdeas;

      const numIdeas = 5;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      let businessDescription = null;
      let contentType = null;
      let postingFrequency = null;

      if (userId) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('business_description, content_type, posting_frequency')
            .eq('id', userId)
            .single();

          if (error) {
            console.error("Error fetching profile data:", error);
          } else if (profile) {
            businessDescription = profile.business_description;
            contentType = profile.content_type;
            postingFrequency = profile.posting_frequency;
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }

      console.log("Generating ideas with params:", {
        niche: nicheToUse,
        audience: audienceToUse,
        videoType: videoTypeToUse,
        platform: platformToUse,
        customIdeas: customIdeasToUse,
        previousIdeas: previousIdeasContext,
        numIdeas,
        accountType,
        businessDescription,
        contentType,
        postingFrequency
      });

      const baseUrl = process.env.NODE_ENV === "production"
        ? "https://hhkabxkelgabcsczsljf.supabase.co"
        : "http://localhost:54321";

      // Include a timeout mechanism to ensure we don't wait too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${baseUrl}/functions/v1/generate-ideas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add this header to avoid CORS issues if our app is served from a different domain
            "Access-Control-Allow-Origin": "*"
          },
          signal: controller.signal,
          body: JSON.stringify({
            niche: nicheToUse,
            audience: audienceToUse,
            videoType: videoTypeToUse,
            platform: platformToUse,
            customIdeas: customIdeasToUse,
            previousIdeas: previousIdeasContext,
            numIdeas,
            accountType,
            businessDescription,
            contentType,
            postingFrequency
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Something failed with the API call
          console.error(`API error: ${response.status} ${response.statusText}`);
          const errorData = await response.json().catch(() => ({}));

          // Check if the response includes fallback ideas despite the error
          if (errorData.ideas && Array.isArray(errorData.ideas) && errorData.ideas.length > 0) {
            setIdeas(errorData.ideas);
            setFallbackMode(true);
            setStatus('success');
          } else {
            throw new Error(errorData.error || `API error: ${response.status}`);
          }
        } else {
          const data = await response.json();

          // Check if we're using fallback mode
          if (data.using_fallback) {
            setFallbackMode(true);
          }

          if (data.ideas && Array.isArray(data.ideas)) {
            console.log("Received ideas:", data.ideas);
            setIdeas(data.ideas);

            // Update previous ideas context for future calls
            if (data.ideas.length > 0) {
              const newContext: PreviousIdeasContext = {
                titles: data.ideas.map((idea: any) => idea.title),
                timestamp: new Date().toISOString()
              };
              setPreviousIdeasContext(newContext);

              // Store in localStorage for persistence
              try {
                localStorage.setItem('previousIdeasContext', JSON.stringify(newContext));
              } catch (storageError) {
                console.error("Error storing previous ideas context:", storageError);
              }
            }

            setStatus('success');
          } else {
            console.error("Invalid response format:", data);
            throw new Error("Invalid response format from API");
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          console.error("Request timed out");
          throw new Error("Request timed out. Please try again.");
        } else {
          console.error("Fetch error:", fetchError);
          throw fetchError;
        }
      }
    } catch (error: any) {
      console.error("Error generating ideas:", error);
      setStatus('error');

      // Customize error message based on the type of error
      if (error.message?.includes("daily limit")) {
        setError("You've reached your daily generation limit. Please upgrade your plan to continue generating ideas.");
      } else if (error.message?.includes("timeout") || error.message?.includes("network")) {
        setError("Network issue detected. We're having trouble connecting to our servers. Please check your internet connection and try again.");
      } else {
        setError(error.message || "An unexpected error occurred. Please try again.");
      }
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
    setCustomIdeas,
    previousIdeasContext,
    setPreviousIdeasContext,
    error,
    setError,
    accountType,
    status,
    fallbackMode
  };
};
