
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TrustBadge from "@/components/TrustBadge";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-white pt-16 md:pt-20 lg:pt-24">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white z-0 h-[90%]"></div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="mb-6">
            <TrustBadge />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto mb-6">
            <span className="text-primary">AI-Powered</span> Video Content Creation
            <span className="block mt-2">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Generate viral video ideas, create engaging scripts, and plan your content calendar with AI - all in one platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full" 
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
        
        <div className="relative max-w-5xl mx-auto rounded-xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-blue-400/50 opacity-30 z-0"></div>
          <img
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/3516410965-89c7ff372bd4166625c6.png"
            alt="Planzo AI Dashboard"
            className="w-full h-auto relative z-10 rounded-xl"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
