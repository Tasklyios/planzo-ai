
import { useState } from "react";
import { Menu } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full glass shadow-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-primary">TrendAI</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <span className="text-dark hover:text-primary cursor-pointer transition-colors">How It Works</span>
            <span className="text-dark hover:text-primary cursor-pointer transition-colors">Pricing</span>
            <span className="text-dark hover:text-primary cursor-pointer transition-colors">Get Started</span>
            <button className="btn-primary">Sign Up</button>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-dark">
              <Menu size={24} />
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="md:hidden pt-4 pb-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <span className="text-dark hover:text-primary cursor-pointer transition-colors">How It Works</span>
              <span className="text-dark hover:text-primary cursor-pointer transition-colors">Pricing</span>
              <span className="text-dark hover:text-primary cursor-pointer transition-colors">Get Started</span>
              <button className="btn-primary">Sign Up</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
