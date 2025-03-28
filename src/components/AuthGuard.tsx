
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to check URL parameters in both search and hash parts
  const getUrlParams = () => {
    const searchParams = new URLSearchParams(location.search);
    
    // Check if we have hash params (like #error=access_denied)
    const hashParams = new URLSearchParams(
      location.hash.startsWith('#') 
        ? location.hash.substring(1) 
        : location.hash
    );
    
    // Combine both parameter sources
    const params = {
      type: searchParams.get('type') || hashParams.get('type'),
      token_hash: searchParams.get('token_hash') || hashParams.get('token_hash'),
      refresh_token: searchParams.get('refresh_token') || hashParams.get('refresh_token'),
      access_token: searchParams.get('access_token') || hashParams.get('access_token'),
      error: searchParams.get('error') || hashParams.get('error'),
      error_code: searchParams.get('error_code') || hashParams.get('error_code'),
      error_description: searchParams.get('error_description') || hashParams.get('error_description'),
    };
    
    return params;
  };

  // Function to check if the current URL has authentication flow parameters
  const isAuthFlow = () => {
    const params = getUrlParams();
    
    // Check for various authentication flow parameters
    if (
      (params.type === 'recovery') ||
      params.token_hash ||
      params.refresh_token ||
      params.access_token ||
      params.error || // Check for error parameters too
      params.error_description
    ) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        console.log("Checking authentication status...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Authentication check error:", error);
          setIsAuthenticated(false);
          
          // Don't redirect if this is an auth flow (password reset, verification, etc.)
          if (!isAuthFlow() && location.pathname !== '/auth') {
            navigate("/auth", { state: { from: location.pathname } });
          }
          return;
        }
        
        if (!session) {
          console.log("No session found, redirecting to auth");
          setIsAuthenticated(false);
          localStorage.clear(); // Clear all localStorage on session check failure
          
          // Don't redirect if this is an auth flow or already on auth page
          if (!isAuthFlow() && location.pathname !== '/auth') {
            navigate("/auth", { state: { from: location.pathname } });
          }
        } else {
          console.log("Session found, user is authenticated", session.user.id);
          setIsAuthenticated(true);
          
          // If this is a password reset flow, explicitly navigate to the auth page with recovery type
          const params = getUrlParams();
          if (params.type === 'recovery' && location.pathname !== '/auth') {
            navigate("/auth?type=recovery");
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        
        // Don't redirect if this is an auth flow
        if (!isAuthFlow() && location.pathname !== '/auth') {
          navigate("/auth", { state: { from: location.pathname } });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up subscription to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "session exists" : "no session");
      
      if (event === "SIGNED_OUT") {
        console.log("User signed out, redirecting to landing page");
        localStorage.clear(); // Clear all localStorage
        setIsAuthenticated(false);
        // Force navigate to landing page
        window.location.href = "/";
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("User signed in or token refreshed", session?.user.id);
        setIsAuthenticated(true);
        
        // Check if this is a password reset flow
        const params = getUrlParams();
        if (params.type === 'recovery') {
          console.log("Password reset flow detected after sign in");
          navigate("/auth?type=recovery");
          return;
        }
        
        // Skip redirect for verification flows, otherwise redirect to dashboard
        if (!isAuthFlow()) {
          const currentPath = location.pathname;
          if (currentPath === "/" || currentPath === "/auth") {
            navigate("/dashboard");
          }
        }
      } else if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event detected");
        // Make sure we show the reset password form
        navigate("/auth?type=recovery");
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  // Check for error parameters in the URL - handle both query params and hash params
  useEffect(() => {
    const params = getUrlParams();
    
    // Handle hash or search params indicating expired tokens or other errors
    if (params.error || params.error_code) {
      // If we're already on the auth page, just update the URL parameters
      if (location.pathname === '/auth') {
        if (params.error_code === 'otp_expired' || 
            (params.error_description && params.error_description.toLowerCase().includes('expired'))) {
          navigate("/auth?expired=true", { replace: true });
          toast({
            variant: "destructive",
            title: "Password Reset Link Expired",
            description: "Your password reset link has expired. Please request a new one."
          });
        }
      } 
      // If we're not on the auth page, redirect there with the expired parameter
      else if (params.error_code === 'otp_expired' || 
               (params.error_description && params.error_description.toLowerCase().includes('expired'))) {
        navigate("/auth?expired=true", { replace: true });
        toast({
          variant: "destructive",
          title: "Password Reset Link Expired",
          description: "Your password reset link has expired. Please request a new one."
        });
      }
    }
    
    // If we have a recovery token in the URL but we're not on the auth page, redirect
    if (params.type === 'recovery' && location.pathname !== '/auth') {
      navigate(`/auth?type=recovery`, { replace: true });
    }
  }, [location, navigate, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Special handling for auth flows - must handle both auth page and error redirects
  if (location.pathname === '/auth' || isAuthFlow()) {
    return <>{children}</>;
  }

  // Only render children if the user is authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
