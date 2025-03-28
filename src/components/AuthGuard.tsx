
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

  // Function to check if the current URL has authentication flow parameters
  const isAuthFlow = () => {
    const searchParams = new URLSearchParams(location.search);
    
    // Check for various authentication flow parameters
    if (
      (searchParams.has('type') && searchParams.get('type') === 'recovery') ||
      searchParams.has('token_hash') ||
      searchParams.has('refresh_token') ||
      searchParams.has('access_token') ||
      searchParams.has('error') || // Check for error parameters too
      searchParams.has('error_description')
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
          const searchParams = new URLSearchParams(location.search);
          if (searchParams.has('type') && searchParams.get('type') === 'recovery' && location.pathname !== '/auth') {
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
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.has('type') && searchParams.get('type') === 'recovery') {
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

  // Special handling for auth flows - must handle both auth page and error redirects
  if (location.pathname === '/auth' || isAuthFlow()) {
    const searchParams = new URLSearchParams(location.search);
    
    // Handle expired token errors by redirecting to auth page with appropriate parameters
    if (searchParams.has('error') && 
        (searchParams.get('error_code') === 'otp_expired' || 
         searchParams.get('error_description')?.includes('expired'))) {
      
      console.log("Expired token detected, redirecting to auth with reset password notice");
      // If we're not already on the auth page, redirect there
      if (location.pathname !== '/auth') {
        navigate("/auth?expired=true");
      } else if (!searchParams.has('expired')) {
        // If we're on auth page but don't have the expired flag, add it
        navigate("/auth?expired=true");
      }
    }
    
    // Always allow auth flows to bypass authentication checks
    if (
      (searchParams.has('type') && searchParams.get('type') === 'recovery') ||
      searchParams.has('token_hash') ||
      searchParams.has('access_token') ||
      searchParams.has('refresh_token') ||
      searchParams.has('expired') ||
      searchParams.has('error')
    ) {
      console.log("Auth flow detected, bypassing authentication check");
      return <>{children}</>;
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Only render children if the user is authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
