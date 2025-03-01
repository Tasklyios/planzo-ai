
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { StyleProfile } from "@/types/idea";

export const useStyleProfiles = () => {
  const [styleProfiles, setStyleProfiles] = useState<StyleProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<StyleProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStyleProfiles = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user) {
        console.log("No authenticated user");
        return;
      }

      const userId = sessionData.session.user.id;

      // Fetch all style profiles for this user
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching style profiles:', error);
        throw error;
      }

      if (data) {
        setStyleProfiles(data);
        
        // Find the active profile (if any)
        const active = data.find(profile => profile.is_active);
        if (active) {
          setActiveProfile(active);
        }
      }

    } catch (error) {
      console.error('Error in fetchStyleProfiles:', error);
      toast({
        variant: "destructive",
        title: "Failed to load style profiles",
        description: "There was an error loading your style profiles.",
      });
    } finally {
      setLoading(false);
    }
  };

  const activateStyleProfile = async (profileId: string) => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user) {
        console.log("No authenticated user");
        return;
      }

      const userId = sessionData.session.user.id;

      // First, deactivate all profiles
      const { error: deactivateError } = await supabase
        .from('style_profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) {
        console.error('Error deactivating profiles:', deactivateError);
        throw deactivateError;
      }

      // Then activate the selected profile
      const { error: activateError } = await supabase
        .from('style_profiles')
        .update({ is_active: true })
        .eq('id', profileId);

      if (activateError) {
        console.error('Error activating profile:', activateError);
        throw activateError;
      }

      // Update the profile's content style and personality in local storage
      const selectedProfile = styleProfiles.find(p => p.id === profileId);
      if (selectedProfile) {
        if (selectedProfile.content_style) {
          localStorage.setItem("contentStyle", selectedProfile.content_style);
        }
        
        if (selectedProfile.content_personality) {
          localStorage.setItem("contentPersonality", selectedProfile.content_personality);
        }

        // Also update the active profile in the users's profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ active_style_profile_id: profileId })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating user profile:', profileError);
        }
      }

      // Refetch the profiles
      await fetchStyleProfiles();

      toast({
        title: "Style Profile Activated",
        description: "Your selected style profile has been activated.",
      });

    } catch (error) {
      console.error('Error in activateStyleProfile:', error);
      toast({
        variant: "destructive",
        title: "Failed to activate style profile",
        description: "There was an error activating your style profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize profiles on component mount
  useEffect(() => {
    fetchStyleProfiles();
  }, []);

  return {
    styleProfiles,
    activeProfile,
    loading,
    fetchStyleProfiles,
    activateStyleProfile
  };
};
