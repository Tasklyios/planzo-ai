import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import Ideas from "./pages/Ideas";
import Calendar from "./pages/Calendar";
import Signup from "./pages/Signup";

function App() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {isMounted ? (
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
      ) : null}
    </ThemeProvider>
  );
}

export default App;
