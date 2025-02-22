
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Generator from "@/pages/Generator";
import Ideas from "@/pages/Ideas";
import Calendar from "@/pages/Calendar";
import Account from "@/pages/Account";
import NotFound from "@/pages/NotFound";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-16">
                  <Dashboard />
                </main>
              </div>
            </AuthGuard>
          }
        />
        <Route
          path="/generator"
          element={
            <AuthGuard>
              <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-16">
                  <Generator />
                </main>
              </div>
            </AuthGuard>
          }
        />
        <Route
          path="/ideas"
          element={
            <AuthGuard>
              <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-16">
                  <Ideas />
                </main>
              </div>
            </AuthGuard>
          }
        />
        <Route
          path="/calendar"
          element={
            <AuthGuard>
              <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-16">
                  <Calendar />
                </main>
              </div>
            </AuthGuard>
          }
        />
        <Route
          path="/account"
          element={
            <AuthGuard>
              <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-16">
                  <Account />
                </main>
              </div>
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
