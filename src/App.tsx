
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

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  </AuthGuard>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
        <Route path="/generator" element={<AuthenticatedLayout><Generator /></AuthenticatedLayout>} />
        <Route path="/ideas" element={<AuthenticatedLayout><Ideas /></AuthenticatedLayout>} />
        <Route path="/calendar" element={<AuthenticatedLayout><Calendar /></AuthenticatedLayout>} />
        <Route path="/account" element={<AuthenticatedLayout><Account /></AuthenticatedLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
