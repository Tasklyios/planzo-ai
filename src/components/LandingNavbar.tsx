
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const LandingNavbar = () => {
  const navigate = useNavigate();

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
          <Link to="#features">
            <Button variant="ghost" className="text-[#333333]">Features</Button>
          </Link>
          <Link to="#how-it-works">
            <Button variant="ghost" className="text-[#333333]">How it works</Button>
          </Link>
          <Link to="#pricing">
            <Button variant="ghost" className="text-[#333333]">Pricing</Button>
          </Link>
          
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
        <div className="md:hidden flex items-center">
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
