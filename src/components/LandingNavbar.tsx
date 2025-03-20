
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Menu, X } from "lucide-react";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import PricingSheet from "@/components/pricing/PricingSheet";

const LandingNavbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <header className="fixed w-full bg-white border-b border-border z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Logo size="medium" />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Button 
            variant="ghost" 
            className="text-[#333333]"
            onClick={() => scrollToSection('features')}
          >
            Features
          </Button>
          <Button 
            variant="ghost" 
            className="text-[#333333]"
            onClick={() => scrollToSection('how-it-works')}
          >
            How it works
          </Button>
          
          <PricingSheet 
            trigger={
              <Button 
                variant="ghost" 
                className="text-[#333333]"
              >
                Pricing
              </Button>
            }
          />
          
          <Button 
            variant="default" 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full pt-6">
                <div className="space-y-4 flex-1">
                  <SheetClose asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => scrollToSection('features')}
                    >
                      Features
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => scrollToSection('how-it-works')}
                    >
                      How it works
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <PricingSheet 
                      trigger={
                        <Button 
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          Pricing
                        </Button>
                      }
                    />
                  </SheetClose>
                </div>
                <div className="py-6">
                  <SheetClose asChild>
                    <Button 
                      variant="default" 
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      onClick={() => navigate("/auth")}
                    >
                      Get Started
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="default" 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default LandingNavbar;
