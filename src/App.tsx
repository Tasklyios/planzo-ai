
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Generator from "@/pages/Generator";
import Ideas from "@/pages/Ideas";
import Calendar from "@/pages/Calendar";
import Account from "@/pages/Account";
import Billing from "@/pages/Billing";
import NotFound from "@/pages/NotFound";
import Script from "@/pages/Script";
import ContentPlanner from "@/pages/ContentPlanner";
import FindYourStyle from "@/pages/FindYourStyle";
import Hooks from "@/pages/Hooks";
import SavedHooks from "@/pages/SavedHooks";
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Authentication error:", error.message);
          setAuthError(error.message);
          setIsAuthenticated(false);
          return;
        }
        
        setIsAuthenticated(!!session);
        console.log("Auth check complete, authenticated:", !!session);
        if (session) {
          console.log("User ID:", session.user.id);
          console.log("Current URL:", window.location.href);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setAuthError(error instanceof Error ? error.message : "Unknown authentication error");
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, !!session);
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If still checking auth status, return a loading indicator
  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading application...</p>
      </div>
    );
  }

  // If there was an authentication error, show it
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-700 text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-red-600 mb-4">{authError}</p>
          <p className="text-gray-700 mb-4">
            This could be because the Supabase URL configuration does not include this domain. 
            Please ensure your Netlify domain is added to the Supabase authentication settings.
          </p>
          <button 
            onClick={() => window.location.href = '/auth'} 
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Try to Login Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Redirect to dashboard if authenticated and trying to access landing page */}
              <Route 
                path="/" 
                element={isAuthenticated ? <Navigate to="/dashboard" /> : <Index />} 
              />
              <Route 
                path="/auth" 
                element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />} 
              />
              <Route element={<AuthGuard><Outlet /></AuthGuard>}>
                <Route element={<AppLayout><Outlet /></AppLayout>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/generator" element={<Generator />} />
                  <Route path="/script" element={<Script />} />
                  <Route path="/hooks" element={<Hooks />} />
                  <Route path="/saved-hooks" element={<SavedHooks />} />
                  <Route path="/planner" element={<ContentPlanner />} />
                  <Route path="/find-your-style" element={<FindYourStyle />} />
                  <Route path="/ideas" element={<Ideas />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/billing" element={<Billing />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
