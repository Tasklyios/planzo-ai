
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isPasswordResetFlow, hasAuthParamsInUrl } from "@/integrations/supabase/client";
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

  useEffect(() => {
    // If this is a password reset flow, don't do auth checks
    // This ensures the user can access the reset password form
    if (isPasswordResetFlow()) {
      console.log("Password reset flow detected in AuthGuard, skipping auth check");
      setIsLoading(false);
      // Make sure user lands on the password reset page for password reset
      if (location.pathname !== '/password-reset') {
        console.log("Redirecting to password reset page");
        // Preserve any query parameters and hash from the current URL
        const currentUrl = new URL(window.location.href);
        const queryParams = currentUrl.search || '';
        const hashFragment = currentUrl.hash || '';
        
        navigate(`/password-reset${queryParams}${hashFragment}`);
      }
      return;
    }

    // For other auth-related URLs that aren't password reset
    // Let Supabase handle the token extraction
    if (hasAuthParamsInUrl() && location.pathname !== '/auth') {
      console.log("Auth params detected in URL, redirecting to auth page");
      navigate("/auth" + location.search + location.hash);
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      setIsLoading(true);
      try {
        console.log("Checking authentication status...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Authentication check error:", error);
          setIsAuthenticated(false);
          
          // Don't redirect if already on auth page
          if (location.pathname !== '/auth') {
            navigate("/auth", { state: { from: location.pathname } });
          }
          return;
        }
        
        if (!data.session) {
          console.log("No session found");
          setIsAuthenticated(false);
          
          // Don't redirect if already on auth page
          if (location.pathname !== '/auth') {
            navigate("/auth", { state: { from: location.pathname } });
          }
        } else {
          console.log("Session found, user is authenticated", data.session.user.id);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        
        // Don't redirect if already on auth page
        if (location.pathname !== '/auth') {
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
        
        // Skip redirect for verification flows, otherwise redirect to dashboard
        if (!hasAuthParamsInUrl()) {
          const currentPath = location.pathname;
          if (currentPath === "/" || currentPath === "/auth") {
            // Set this flag when a user explicitly signs in
            localStorage.setItem('has_seen_pricing', 'true');
            navigate("/dashboard");
          }
        }
      } else if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event detected");
        // Direct the user to the password reset form
        navigate("/password-reset");
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Always allow auth page and password reset page access regardless of authentication status
  if (location.pathname === '/auth' || location.pathname === '/password-reset' || location.pathname === '/reset-password') {
    return <>{children}</>;
  }

  // Always allow password reset flows
  if (isPasswordResetFlow()) {
    return <>{children}</>;
  }

  // Only render children if the user is authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
