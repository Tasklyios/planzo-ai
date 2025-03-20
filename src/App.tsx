
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AppLayout from "@/components/layout/AppLayout";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import AuthGuard from "@/components/AuthGuard";
import Account from "./pages/Account";

// Import the pages
import SocialAccounts from "./pages/SocialAccounts";
import NewSocialAccount from "./pages/NewSocialAccount";
import Calendar from "./pages/Calendar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </AuthGuard>
          }
        />
        {/* Social accounts routes */}
        <Route
          path="/social-accounts"
          element={
            <AuthGuard>
              <AppLayout>
                <SocialAccounts />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/social-accounts/new"
          element={
            <AuthGuard>
              <AppLayout>
                <NewSocialAccount />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/content-planner"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Content Planner</div>
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/calendar"
          element={
            <AuthGuard>
              <AppLayout>
                <Calendar />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/idea-generator"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Idea Generator</div>
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/generator"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Idea Generator</div>
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/script"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Script Generator</div>
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/hooks"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Hook Generator</div>
              </AppLayout>
            </AuthGuard>
          }
        />
         <Route
          path="/ideas"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Saved Ideas</div>
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/saved-hooks"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Saved Hooks</div>
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/find-your-style"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Content Style</div>
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/account"
          element={
            <AuthGuard>
              <AppLayout>
                <Account />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/billing"
          element={
            <AuthGuard>
              <AppLayout>
                <div>Billing</div>
              </AppLayout>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
