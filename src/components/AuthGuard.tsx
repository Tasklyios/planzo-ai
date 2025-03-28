
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
    
    // Check for password recovery flow
    if (searchParams.has('type') && searchParams.get('type') === 'recovery') {
      return true;
    }
    
    // Check for email verification flow (has token_hash or error_description)
    if (searchParams.has('token_hash') || searchParams.has('error_description')) {
      return true;
    }
    
    // Check for other auth flows that might have access_token
    if (searchParams.has('access_token') || searchParams.has('token')) {
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

  // For auth flows (password reset, verification), we need to return children without authentication
  if (isAuthFlow() && location.pathname === "/auth") {
    console.log("Auth flow detected, bypassing authentication check");
    return <>{children}</>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Only render children if the user is authenticated or it's a special case
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
