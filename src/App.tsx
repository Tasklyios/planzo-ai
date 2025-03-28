
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase, isPasswordResetFlow, cast } from "@/integrations/supabase/client";
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
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import PasswordResetPage from "@/pages/PasswordResetPage";
import ResetPassword from "@/pages/ResetPassword";
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

  // Add the missing handleOnboardingComplete function
  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
  };

  useEffect(() => {
    // Check first if this is a password reset flow before any other logic
    if (isPasswordResetFlow()) {
      console.log("Password reset flow detected in App.tsx, no need to redirect");
      setLoadingProfile(false);
      return;
    }

    const currentDomain = window.location.hostname;
    if (currentDomain === 'planzo.netlify.app') {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      window.location.href = `https://planzoai.com${currentPath}${currentSearch}`;
    }

    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', cast(session.user.id))
            .single();
            
          if (profile?.onboarding_completed) {
            setShowOnboarding(false);
          } else {
            setShowOnboarding(true);
          }
          
          localStorage.setItem('has_seen_pricing', 'true');
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_IN' && session) {
        const checkOnboarding = async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', cast(session.user.id))
              .single();
              
            if (profile?.onboarding_completed) {
              setShowOnboarding(false);
            } else {
              setShowOnboarding(true);
            }
            localStorage.setItem('has_seen_pricing', 'true');
          } catch (error) {
            console.error("Error checking onboarding status:", error);
          }
        };
        
        checkOnboarding();
      }
      
      if (event === 'SIGNED_OUT') {
        setShowOnboarding(false);
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log("Password recovery event detected");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // If we're in a password reset flow, don't show the loading spinner
  // This ensures the PasswordResetPage can render immediately
  if (loadingProfile && !isPasswordResetFlow()) {
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
            {/* Public routes - accessible without authentication */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Index />} 
            />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Put PasswordResetPage outside AuthGuard to avoid redirection */}
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            
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
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          
          {isAuthenticated && !isPasswordResetFlow() && (
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
