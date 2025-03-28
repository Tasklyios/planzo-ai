
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { hasAuthParamsInUrl, isPasswordResetFlow } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If there are auth parameters but we hit the 404 page,
    // it's likely a misrouted password reset or auth flow
    if (hasAuthParamsInUrl() || isPasswordResetFlow()) {
      console.log("Auth parameters detected on 404 page, redirecting to appropriate page");
      
      // Get the current URL to preserve query params and hash
      const currentURL = window.location.href;
      const url = new URL(currentURL);
      
      // If this is a recovery/reset flow, make sure we add that parameter
      if (isPasswordResetFlow() && !url.searchParams.has('type')) {
        url.searchParams.set('type', 'recovery');
      }
      
      // For password reset flows, go directly to the password-reset page
      if (isPasswordResetFlow()) {
        // Direct the user straight to the password reset page, bypassing auth
        // Make sure to preserve the hash which contains the token
        navigate(`/password-reset${url.search}${url.hash}`, { replace: true });
      } else {
        // For other auth flows, go to the regular auth page
        navigate(`/auth${url.search}${url.hash}`, { replace: true });
      }
    }
  }, [navigate, location]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-medium mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="default">
            <Link to="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
