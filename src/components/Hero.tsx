
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TrustBadge from "@/components/TrustBadge";
import { AnimatedTextSwitcher } from "@/components/ui/animated-text-switcher";
import { useIsMobile } from "@/hooks/use-mobile";

const Hero = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Define the use cases for animation
  const useCases = [
    "Entrepreneurs",
    "Business Owners",
    "Marketers", 
    "Content Creators",
    "Social Media Managers",
    "Video Producers"
  ];

  return (
    <section className="relative overflow-hidden bg-pure-white pt-12 md:pt-16 lg:pt-24">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white z-0 h-[90%]"></div>
      
      {/* Technical pattern on the sides */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute left-0 top-0 w-1/3 h-full">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="tech-pattern-left" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="#2582ff" strokeWidth="1" />
              <circle cx="20" cy="20" r="2" fill="#2582ff" />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#tech-pattern-left)" />
          </svg>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="tech-pattern-right" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="10" height="10" fill="#2582ff" opacity="0.2" />
              <rect x="15" y="15" width="10" height="10" fill="#2582ff" opacity="0.2" />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#tech-pattern-right)" />
          </svg>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <div className="mb-4 md:mb-6">
            <TrustBadge />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto mb-4 md:mb-6">
            {isMobile ? (
              <>
                <div>The #1 AI <span className="bg-gradient-to-r from-[#2582ff] to-[#0FA0CE] bg-clip-text text-transparent">Content Creation</span></div>
                <AnimatedTextSwitcher titles={useCases} className="mt-2" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div>The #1 AI <span className="bg-gradient-to-r from-[#2582ff] to-[#0FA0CE] bg-clip-text text-transparent">Content Creation</span></div>
                <div className="mt-1 mb-1">tool for</div>
                <AnimatedTextSwitcher titles={useCases} className="mt-1" />
              </div>
            )}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Generate viral video ideas, create engaging scripts, and plan your content calendar with AI - all in one platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-400 hover:opacity-90 text-white px-8 py-6 text-lg rounded-full" 
              onClick={() => navigate("/auth")}
            >
              Start Creating for Free
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-6 text-lg rounded-full"
            >
              Watch Demo
            </Button>
          </div>
          <div className="mt-8 text-sm text-gray-500">No credit card required</div>
        </div>
        
        {/* Image container with enhanced white stroke - reduced on mobile */}
        <div className="relative max-w-4xl mx-auto rounded-2xl md:rounded-3xl p-3 md:p-8 bg-pure-white shadow-xl border border-gray-100">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-blue-400/50 opacity-30 z-0"></div>
            <img
              src="/lovable-uploads/d68dfb23-7965-4309-b905-63166c7e9fee.png"
              alt="Planzo AI Content Planner"
              className="w-full h-auto relative z-10 rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
