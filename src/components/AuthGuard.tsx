
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Authentication check error:", error);
          setError(error.message);
          setIsAuthenticated(false);
          navigate("/auth", { state: { from: location.pathname, error: error.message } });
          return;
        }
        
        if (!session) {
          setIsAuthenticated(false);
          navigate("/auth", { state: { from: location.pathname } });
        } else {
          // Store the session access token for edge functions to use
          localStorage.setItem('supabase.auth.token', session.access_token);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setIsAuthenticated(false);
        navigate("/auth", { state: { from: location.pathname, error: error instanceof Error ? error.message : "Unknown error" } });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem('supabase.auth.token');
        setIsAuthenticated(false);
        navigate("/auth");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Update the token in localStorage
        if (session?.access_token) {
          localStorage.setItem('supabase.auth.token', session.access_token);
        }
        
        setIsAuthenticated(true);
        
        // Redirect to dashboard if user signs in and isn't already on a protected route
        const currentPath = location.pathname;
        if (currentPath === "/" || currentPath === "/auth") {
          navigate("/dashboard");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h2 className="text-red-700 text-xl font-semibold mb-2">Authentication Error</h2>
        <p className="text-red-600">{error}</p>
        <p className="text-gray-700 mt-4">
          Please ensure your domain is allowed in the Supabase authentication settings.
        </p>
        <button 
          onClick={() => window.location.href = '/auth'} 
          className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Return to Login
        </button>
      </div>
    </div>;
  }

  // Only render children if the user is authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
