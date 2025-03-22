
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Onboarding from "@/components/auth/Onboarding";

export default function Signup() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If not logged in, redirect to auth page
        navigate("/auth");
        return;
      }

      // Check if onboarding is completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, first_name")
        .eq("id", session.user.id)
        .single();

      if (profile && profile.onboarding_completed && profile.first_name) {
        // If onboarding is completed and first name is set, redirect to dashboard
        navigate("/dashboard");
      }
    };

    checkUserOnboarding();
  }, [navigate]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate("/dashboard");
  };

  return (
    <div>
      <Onboarding 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
    </div>
  );
}
