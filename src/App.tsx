
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Generator from "@/pages/Generator";
import Ideas from "@/pages/Ideas";
import Calendar from "@/pages/Calendar";
import Account from "@/pages/Account";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/AuthGuard";
import Onboarding from "@/components/auth/Onboarding";
import { ThemeProvider } from "@/hooks/use-theme";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <AppLayout>
      {children}
    </AppLayout>
  </AuthGuard>
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="trendai-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
          <Route path="/generator" element={<AuthenticatedLayout><Generator /></AuthenticatedLayout>} />
          <Route path="/ideas" element={<AuthenticatedLayout><Ideas /></AuthenticatedLayout>} />
          <Route path="/calendar" element={<AuthenticatedLayout><Calendar /></AuthenticatedLayout>} />
          <Route path="/account" element={<AuthenticatedLayout><Account /></AuthenticatedLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
