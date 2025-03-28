
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isPasswordResetFlow } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import PasswordReset from "@/components/auth/PasswordReset";

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Force light mode on reset page
    const root = window.document.documentElement;
    const originalTheme = root.classList.contains('dark') ? 'dark' : 'light';
    
    root.classList.remove('dark');
    root.classList.add('light');
    
    return () => {
      if (originalTheme === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    };
  }, []);

  useEffect(() => {
    const verifyResetToken = async () => {
      setLoading(true);
      
      if (!isPasswordResetFlow()) {
        console.log("Not a password reset flow, redirecting to auth page");
        navigate("/auth");
        return;
      }

      try {
        // Check if the token in the URL is valid
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          console.error("Error validating reset token:", error);
          toast({
            variant: "destructive",
            title: "Invalid or Expired Link",
            description: "Your password reset link is invalid or has expired. Please request a new one.",
          });
          
          navigate("/auth?expired=true");
          return;
        }
        
        // Token is valid, allow password reset
        setIsValidToken(true);
      } catch (error) {
        console.error("Error in password reset flow:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred. Please try again or request a new reset link.",
        });
        
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
    
    verifyResetToken();
  }, [navigate, location, toast]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return null; // Will be redirected by the useEffect
  }

  return <PasswordReset />;
};

export default PasswordResetPage;
