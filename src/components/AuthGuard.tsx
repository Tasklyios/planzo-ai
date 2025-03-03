
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No session found, redirecting to auth");
          navigate("/auth");
        } else {
          console.log("Session found, user is authenticated");
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "session exists" : "no session");
      
      if (event === "SIGNED_OUT") {
        console.log("User signed out, redirecting to auth");
        setIsAuthenticated(false);
        navigate("/auth");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("User signed in or token refreshed");
        setIsAuthenticated(true);
        
        // Redirect to dashboard if user signs in and isn't already on a protected route
        const currentPath = location.pathname;
        if (currentPath === "/" || currentPath === "/auth") {
          navigate("/dashboard");
        }
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

  // Only render children if the user is authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
