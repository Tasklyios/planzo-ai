
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
  const [tokenError, setTokenError] = useState<string | null>(null);

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
        
        if (error) {
          console.error("Error validating reset token:", error);
          setTokenError(error.message || "Your password reset link is invalid or has expired");
          setIsValidToken(false);
          return;
        }
        
        if (!data.session) {
          console.log("No session found, token might be expired");
          setTokenError("Your password reset link has expired. Please request a new one.");
          setIsValidToken(false);
          return;
        }
        
        // Token is valid, allow password reset
        console.log("Valid token found, showing password reset form");
        setIsValidToken(true);
        setTokenError(null);
      } catch (error: any) {
        console.error("Error in password reset flow:", error);
        setTokenError(error?.message || "An error occurred. Please try again or request a new reset link.");
        setIsValidToken(false);
      } finally {
        setLoading(false);
      }
    };
    
    verifyResetToken();
  }, [navigate, location, toast]);

  const handleRequestNewLink = () => {
    navigate("/auth?expired=true");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Password Reset Link Expired
            </h1>
            <p className="text-[#555555] mb-6">
              {tokenError || "Your password reset link has expired. Please request a new one."}
            </p>
            <button
              onClick={handleRequestNewLink}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <PasswordReset />;
};

export default PasswordResetPage;
