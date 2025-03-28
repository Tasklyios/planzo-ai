
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

  // Function to extract parameters from both URL search and hash
  const getUrlParams = () => {
    // Parse search params (query string)
    const searchParams = new URLSearchParams(location.search);
    
    // Parse hash params (fragment)
    let hashParams = new URLSearchParams();
    if (location.hash) {
      // Remove the leading '#' if present
      const hashString = location.hash.startsWith('#') 
        ? location.hash.substring(1) 
        : location.hash;
      hashParams = new URLSearchParams(hashString);
    }
    
    // Combined parameters object with hash taking precedence
    const params = {
      type: searchParams.get('type') || hashParams.get('type'),
      token: searchParams.get('token') || hashParams.get('token'),
      token_hash: searchParams.get('token_hash') || hashParams.get('token_hash'),
      refresh_token: searchParams.get('refresh_token') || hashParams.get('refresh_token'),
      access_token: searchParams.get('access_token') || hashParams.get('access_token'),
      error: searchParams.get('error') || hashParams.get('error'),
      error_code: searchParams.get('error_code') || hashParams.get('error_code'),
      error_description: searchParams.get('error_description') || hashParams.get('error_description'),
      expired: searchParams.get('expired') || hashParams.get('expired'),
    };
    
    return params;
  };

  // Function to check if the current URL has authentication flow parameters
  const isAuthFlow = () => {
    const params = getUrlParams();
    
    // Check for various authentication flow parameters
    return !!(
      params.type === 'recovery' ||
      params.type === 'otp' ||
      params.token ||
      params.token_hash ||
      params.refresh_token ||
      params.access_token ||
      params.error ||
      params.error_description ||
      params.error_code ||
      params.expired
    );
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
          console.log("No session found");
          setIsAuthenticated(false);
          
          // Clear all localStorage on session check failure
          // But preserve any ongoing auth flows
          if (!isAuthFlow()) {
            localStorage.removeItem('has_seen_pricing');
            // Do not fully clear localStorage as it might contain auth related data
          }
          
          // Check if this is a password reset flow with error
          const params = getUrlParams();
          
          // Handle expired token or error case - redirect to auth page with expired parameter
          if (params.error_code === 'otp_expired' || 
              (params.error && params.error_description)) {
            console.log("Password reset token expired or error detected");
            navigate("/auth?expired=true", { replace: true });
            return;
          }
          
          // Don't redirect if this is another type of auth flow or already on auth page
          if (!isAuthFlow() && location.pathname !== '/auth') {
            navigate("/auth", { state: { from: location.pathname } });
          }
        } else {
          console.log("Session found, user is authenticated", session.user.id);
          setIsAuthenticated(true);
          
          // If this is a password reset flow, explicitly navigate to the auth page with recovery type
          const params = getUrlParams();
          if ((params.type === 'recovery' || params.type === 'otp') && location.pathname !== '/auth') {
            navigate(`/auth?type=${params.type}`);
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
        if (params.type === 'recovery' || params.type === 'otp') {
          console.log("Password reset flow detected after sign in");
          navigate(`/auth?type=${params.type}`);
          return;
        }
        
        // Skip redirect for verification flows, otherwise redirect to dashboard
        if (!isAuthFlow()) {
          const currentPath = location.pathname;
          if (currentPath === "/" || currentPath === "/auth") {
            // Always set this flag when a user explicitly signs in to prevent 
            // pricing dialog from showing unexpectedly
            localStorage.setItem('has_seen_pricing', 'true');
            navigate("/dashboard");
          }
        }
      } else if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event detected");
        // Make sure we show the reset password form
        navigate("/auth?type=otp");
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
    
    // Handle expired tokens or other errors from hash or search params
    if (params.error || params.error_code) {
      if (params.error_code === 'otp_expired' || 
          (params.error_description && params.error_description.toLowerCase().includes('expired'))) {
        // Redirect to auth page with expired parameter
        navigate("/auth?expired=true", { replace: true });
        toast({
          variant: "destructive",
          title: "Password Reset Code Expired",
          description: "Your password reset code has expired. Please request a new one."
        });
      }
    }
    
    // If we have a recovery token in the URL but we're not on the auth page, redirect
    if ((params.type === 'recovery' || params.type === 'otp') && location.pathname !== '/auth') {
      navigate(`/auth?type=${params.type}`, { replace: true });
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
