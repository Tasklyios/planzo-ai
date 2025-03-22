
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./hooks/use-theme"; // Using our custom theme provider instead
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/hooks/use-toast";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import Ideas from "./pages/Ideas";
import Calendar from "./pages/Calendar";
import Signup from "./pages/Signup";

function App() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="vite-ui-theme"
    >
      {isMounted ? (
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/account" element={<Account />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/calendar" element={<Calendar />} />
            </Routes>
            <Toaster />
          </Router>
        </ToastProvider>
      ) : null}
    </ThemeProvider>
  );
}

export default App;
