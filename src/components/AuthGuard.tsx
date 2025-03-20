
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

  // Function to check if the current URL has password reset parameters
  const isPasswordResetFlow = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.has('type') && searchParams.get('type') === 'recovery';
  };

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      try {
        console.log("Checking authentication status...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Authentication check error:", error);
          if (mounted) setIsAuthenticated(false);
          
          // Don't redirect if this is a password reset flow
          if (!isPasswordResetFlow() && mounted) {
            navigate("/auth", { state: { from: location.pathname } });
          }
          return;
        }
        
        if (!session) {
          console.log("No session found, redirecting to auth");
          if (mounted) setIsAuthenticated(false);
          localStorage.clear(); // Clear all localStorage on session check failure
          
          // Don't redirect if this is a password reset flow
          if (!isPasswordResetFlow() && mounted) {
            navigate("/auth", { state: { from: location.pathname } });
          }
        } else {
          console.log("Session found, user is authenticated", session.user.id);
          if (mounted) setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (mounted) setIsAuthenticated(false);
        
        // Don't redirect if this is a password reset flow
        if (!isPasswordResetFlow() && mounted) {
          navigate("/auth", { state: { from: location.pathname } });
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkAuth();

    // Set up subscription to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log("Auth state changed:", event, session ? "session exists" : "no session");
      
      if (event === "SIGNED_OUT") {
        console.log("User signed out, redirecting to landing page");
        localStorage.clear(); // Clear all localStorage
        if (mounted) setIsAuthenticated(false);
        // Force navigate to landing page
        window.location.href = "/";
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("User signed in or token refreshed", session?.user.id);
        if (mounted) setIsAuthenticated(true);
        
        // Skip redirect for verification and password reset flows, otherwise redirect to dashboard
        const isEmailVerification = location.pathname === '/auth' && 
                                  (location.search.includes('access_token') || 
                                    location.search.includes('error_description') ||
                                    location.search.includes('token_hash'));
        
        const isPasswordReset = isPasswordResetFlow();
        
        if (!isEmailVerification && !isPasswordReset && mounted) {
          const currentPath = location.pathname;
          if (currentPath === "/" || currentPath === "/auth") {
            navigate("/dashboard");
          }
        }
      } else if (event === "PASSWORD_RECOVERY") {
        // Make sure we show the reset password form
        if (mounted) navigate("/auth?type=recovery");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  // For password reset flow, we need to return children without authentication
  if (isPasswordResetFlow() && location.pathname === "/auth") {
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
