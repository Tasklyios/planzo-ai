
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
      
      // Check if the URL contains the duplicate domain issue
      // (e.g., "https://planzoai.com/https://planzo.netlify.app/")
      const pathContainsDuplicateURL = url.pathname.includes('http');
      
      if (pathContainsDuplicateURL) {
        // Extract the real path, search, and hash from the malformed URL
        const extractedUrl = url.pathname.substring(url.pathname.indexOf('http'));
        try {
          const parsedExtractedUrl = new URL(extractedUrl);
          
          // Get the parts we need from the extracted URL
          const cleanPath = parsedExtractedUrl.pathname;
          const cleanSearch = parsedExtractedUrl.search;
          const cleanHash = parsedExtractedUrl.hash;
          
          // Create a new clean URL to redirect to
          let redirectPath = cleanPath || '/';
          if (redirectPath === '/' && (isPasswordResetFlow() || currentURL.includes('recovery'))) {
            redirectPath = '/password-reset';
          }
          
          console.log(`Fixing malformed URL, redirecting to: ${redirectPath}${cleanSearch}${cleanHash}`);
          navigate(`${redirectPath}${cleanSearch}${cleanHash}`, { replace: true });
          return;
        } catch (e) {
          console.error("Error parsing extracted URL:", e);
        }
      }
      
      // If this is a recovery/reset flow, make sure we add that parameter
      if (isPasswordResetFlow() && !url.searchParams.has('type')) {
        url.searchParams.set('type', 'recovery');
      }
      
      // For password reset flows, go directly to the password-reset page
      if (isPasswordResetFlow()) {
        // Direct the user straight to the password reset page, preserving parameters
        console.log("Redirecting to password reset page:", `/password-reset${url.search}${url.hash}`);
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
