
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
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import NotFound from "@/pages/NotFound";
import Script from "@/pages/Script";
import ContentPlanner from "@/pages/ContentPlanner";
import Hooks from "@/pages/Hooks";
import SavedHooks from "@/pages/SavedHooks";
import EmailTemplates from "@/pages/EmailTemplates";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/hooks/use-theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Onboarding from "@/components/auth/Onboarding";
import IdeaGenerator from "@/pages/IdeaGenerator";

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();
          
        if (!error && profile && !profile.onboarding_completed) {
          setShowOnboarding(true);
        }
      }
      
      setLoadingProfile(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_IN' && session) {
        const checkOnboarding = async () => {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();
            
          if (!error && profile && !profile.onboarding_completed) {
            setShowOnboarding(true);
          }
        };
        
        checkOnboarding();
      }
      
      if (event === 'SIGNED_OUT') {
        setShowOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const currentDomain = window.location.hostname;
    if (currentDomain === 'planzo.netlify.app') {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      window.location.href = `https://planzoai.com${currentPath}${currentSearch}`;
    }
  }, []);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    
    const hasSeenPricing = localStorage.getItem('has_seen_pricing') === 'true';
    if (!hasSeenPricing) {
    }
  };

  if (loadingProfile) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Index />} 
            />
            {/* Auth route doesn't need AuthGuard to prevent circular dependencies */}
            <Route 
              path="/auth" 
              element={<Auth />} 
            />
            <Route 
              path="/privacy-policy" 
              element={<PrivacyPolicy />} 
            />
            <Route 
              path="/terms-of-service" 
              element={<TermsOfService />} 
            />
            <Route element={<AuthGuard><Outlet /></AuthGuard>}>
              <Route element={<AppLayout><Outlet /></AppLayout>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/generator" element={<Generator />} />
                <Route path="/idea-generator" element={<IdeaGenerator />} />
                <Route path="/content-planner" element={<ContentPlanner />} />
                <Route path="/script" element={<Script />} />
                <Route path="/hooks" element={<Hooks />} />
                <Route path="/saved-hooks" element={<SavedHooks />} />
                <Route path="/planner" element={<ContentPlanner />} />
                <Route path="/ideas" element={<Ideas />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/account" element={<Account />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/email-templates" element={<EmailTemplates />} />
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          
          {isAuthenticated && (
            <Onboarding 
              open={showOnboarding} 
              onOpenChange={setShowOnboarding}
              onComplete={handleOnboardingComplete}
            />
          )}
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
