
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

  useEffect(() => {
    fetchUserPreferences();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
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
        () => {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_type, content_niche, business_niche, product_niche, target_audience, posting_platforms')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (profile) {
        let nicheValue = "";
        switch (profile.account_type) {
          case 'business':
            nicheValue = profile.business_niche || profile.content_niche || "";
            break;
          case 'ecommerce':
            nicheValue = profile.product_niche || profile.content_niche || "";
            break;
          default:
            nicheValue = profile.content_niche || "";
            break;
        }

        setNiche(nicheValue);
        localStorage.setItem("niche", nicheValue);

        if (profile.target_audience) {
          setAudience(profile.target_audience);
          localStorage.setItem("audience", profile.target_audience);
        }
        
        if (profile.posting_platforms && profile.posting_platforms.length > 0) {
          setPlatform(profile.posting_platforms[0]);
          localStorage.setItem("platform", profile.posting_platforms[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
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

      // Use the check-usage-limits edge function instead of rpc call
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

        console.log("Response from generate-ideas:", { data, error });

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
          is_ad: isAdRequest, // Add this field to flag ad ideas
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
