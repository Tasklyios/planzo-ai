
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
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
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/hooks/use-toast";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<AuthGuard><Outlet /></AuthGuard>}>
              <Route element={<AppLayout><Outlet /></AppLayout>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/generator" element={<Generator />} />
                <Route path="/script" element={<Script />} />
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
  );
}

export default App;
