
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
    // Clear previous ideas before generating new ones
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
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          niche,
          audience,
          videoType,
          platform,
          customIdeas
        },
      });

      if (error) throw error;

      if (!data || !data.ideas) {
        throw new Error('Invalid response format from AI');
      }

      const ideasToSave = data.ideas.map((idea: any) => ({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        tags: idea.tags,
        platform: platform,
        user_id: userId,
        color: 'blue',
        is_saved: false,
      }));

      const { error: saveError } = await supabase
        .from("video_ideas")
        .insert(ideasToSave);

      if (saveError) throw saveError;

      const { data: savedIdeas, error: fetchError } = await supabase
        .from("video_ideas")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(ideasToSave.length);

      if (fetchError) throw fetchError;

      const transformedIdeas = (savedIdeas || []).map(transformSupabaseIdea);
      setIdeas(transformedIdeas);

      toast({
        title: "Success!",
        description: "Your video ideas have been generated and saved.",
      });
    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to generate ideas. Please try again.',
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
