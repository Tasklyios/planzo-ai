
import { Home, FileText, Anchor, LightbulbIcon } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const LandingTubelightNavbar = () => {
  const navigate = useNavigate();
  
  const navItems = [
    { name: 'Features', url: '#features', icon: Home },
    { name: 'How it works', url: '#how-it-works', icon: FileText },
    { name: 'Pricing', url: '#pricing', icon: Anchor },
    { name: 'Get Started', url: '/auth', icon: LightbulbIcon }
  ];

  return (
    <div className="fixed w-full z-50 flex justify-between items-center h-16 px-4 sm:px-6 bg-white border-b border-border">
      <div className="flex items-center">
        <a href="/" className="flex items-center">
          <Logo size="medium" />
        </a>
      </div>

      <NavBar items={navItems} className="static translate-x-0 left-auto pt-0 ml-auto" />
    </div>
  );
};

export default LandingTubelightNavbar;
