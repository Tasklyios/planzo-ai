
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    // Check if this is a password reset link that got lost
    const checkForPasswordReset = () => {
      const url = new URL(window.location.href);
      // Check both hash and search params for recovery tokens
      const isRecoveryFlow = 
        url.hash.includes('type=recovery') || 
        url.search.includes('type=recovery') ||
        url.hash.includes('access_token=') || 
        url.search.includes('access_token=');
      
      if (isRecoveryFlow) {
        setIsPasswordReset(true);
        // Redirect to proper auth recovery page
        window.location.href = "/auth?type=recovery";
        return true;
      }
      return false;
    };
    
    // First check if this might be a lost password reset flow
    if (checkForPasswordReset()) {
      return;
    }

    // Log the 404 error
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Check if there's a session in localStorage to determine authentication status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
  }, [location.pathname]);

  // If we detected a password reset flow, show a loading spinner
  if (isPasswordReset) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-2xl font-semibold mb-2">Page not found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg" className="flex items-center gap-2">
            <Link to={isAuthenticated ? "/dashboard" : "/"}>
              <Home className="w-4 h-4" />
              {isAuthenticated ? "Go to Dashboard" : "Return Home"}
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
