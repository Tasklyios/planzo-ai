
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);

  const tiers = [
    {
      name: "Free",
      description: "Try out basic features",
      price: "0",
      features: [
        "5 AI video ideas per day",
        "3 script generations per day",
        "Basic content calendar",
        "Community support"
      ],
      cta: "Get Started",
      color: "gray"
    },
    {
      name: "Pro",
      description: "Perfect for growing creators",
      price: isYearly ? "19" : "29",
      features: [
        "50 AI video ideas per day",
        "25 script generations per day",
        "Advanced content calendar",
        "Hook generator",
        "AI voiceovers (15/mo)",
        "Priority support"
      ],
      cta: "Get Pro",
      color: "primary"
    },
    {
      name: "Business",
      description: "For teams and agencies",
      price: isYearly ? "49" : "69",
      features: [
        "Unlimited AI video ideas",
        "Unlimited script generations",
        "Team collaboration (up to 5)",
        "AI voiceovers (unlimited)",
        "Custom branding",
        "API access",
        "Dedicated account manager"
      ],
      cta: "Get Business",
      color: "gray"
    }
  ];

  const handleUpgradeClick = (tier: string) => {
    // For now, just redirect to account page
    // We'll implement Stripe checkout later
    navigate('/auth');
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Plans that grow with your content strategy
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-${isYearly ? 'gray-500' : 'gray-900'} font-medium`}>Monthly</span>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isYearly} 
                onChange={() => setIsYearly(!isYearly)}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </div>
            <span className={`text-${isYearly ? 'gray-900' : 'gray-500'} font-medium`}>Yearly</span>
            <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">Save 30%</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div 
              key={tier.name}
              className={`bg-white rounded-xl overflow-hidden border ${
                tier.color === 'primary' ? 'border-primary shadow-xl border-2' : 'border-gray-200 shadow'
              } transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative`}
            >
              {tier.color === 'primary' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-6">
                  {tier.description}
                </p>
                <div className="text-4xl font-bold text-gray-900 mb-6">
                  ${tier.price}
                  <span className="text-lg font-normal text-gray-600">
                    /{isYearly ? 'year' : 'month'}
                  </span>
                </div>
                
                <Button 
                  className={`w-full py-6 ${
                    tier.color === 'primary' 
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                  onClick={() => handleUpgradeClick(tier.name.toLowerCase())}
                >
                  {tier.cta}
                </Button>
                
                <div className="pt-8">
                  <p className="text-sm text-gray-500 font-medium mb-4">What's included:</p>
                  <ul className="space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="text-green-500 mr-3 h-5 w-5 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
