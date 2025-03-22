
import { Home, FileText, Anchor, LightbulbIcon, Menu } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

const LandingTubelightNavbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems = [
    { name: 'Features', url: '#features', icon: Home },
    { name: 'How it works', url: '#how-it-works', icon: FileText },
    { name: 'Pricing', url: '#pricing', icon: Anchor },
    { name: 'Get Started', url: '/auth?signup=true', icon: LightbulbIcon }
  ];

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed w-full z-50 flex justify-between items-center h-16 px-4 sm:px-6 bg-white border-b border-border">
      <div className="flex items-center">
        <a href="/" className="flex items-center">
          <Logo size="medium" />
        </a>
      </div>

      {/* Desktop Navigation - Tubelight Navbar */}
      <div className="hidden md:block">
        <NavBar items={navItems} className="static translate-x-0 left-auto pt-0 ml-auto" />
      </div>

      {/* Mobile Navigation - Drawer Menu */}
      <div className="md:hidden flex items-center ml-auto">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4 pt-0">
              <div className="space-y-3 pt-4">
                <DrawerClose asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleScrollToSection('features')}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Features
                  </Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleScrollToSection('how-it-works')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    How it works
                  </Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleScrollToSection('pricing')}
                  >
                    <Anchor className="mr-2 h-4 w-4" />
                    Pricing
                  </Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button 
                    variant="default" 
                    className="w-full bg-primary hover:bg-primary/90 text-white mt-4"
                    onClick={() => navigate("/auth?signup=true")}
                  >
                    <LightbulbIcon className="mr-2 h-4 w-4" />
                    Get Started
                  </Button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        
        <Button 
          variant="default" 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => navigate("/auth?signup=true")}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default LandingTubelightNavbar;
