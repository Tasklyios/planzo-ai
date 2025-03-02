
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  const tiers = [
    {
      name: "Pro",
      description: "Perfect to get started",
      price: isYearly ? "13.99" : "19.99",
      features: [
        "20 AI video ideas per day",
        "10 script generations per day",
        "Basic analytics",
        "Simple calendar features"
      ],
      cta: "Get Pro",
      color: "gray"
    },
    {
      name: "Plus",
      description: "For serious creators",
      price: isYearly ? "20.99" : "29.99",
      features: [
        "50 AI video ideas per day",
        "25 script generations per day",
        "Advanced analytics",
        "Full calendar features",
        "Priority support"
      ],
      cta: "Upgrade to Plus",
      color: "primary"
    },
    {
      name: "Business",
      description: "For teams and agencies",
      price: isYearly ? "48.99" : "69.99",
      features: [
        "Unlimited AI video ideas",
        "Unlimited script generations",
        "Advanced analytics",
        "Team collaboration",
        "Custom branding",
        "Priority support",
        "API access"
      ],
      cta: "Upgrade to Business",
      color: "gray"
    }
  ];

  const handleUpgradeClick = (tier: string) => {
    // For now, just redirect to account page
    // We'll implement Stripe checkout later
    navigate('/account');
  };

  return (
    <section className="bg-light-bg py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-8 fade-up">
            Simple Pricing
          </h2>
          <div className="flex items-center justify-center gap-4">
            <span className="text-gray-600">Monthly</span>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isYearly} 
                onChange={() => setIsYearly(!isYearly)}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0073FF]"></div>
            </div>
            <span className="text-gray-600">Yearly</span>
            <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">Save 30%</span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div 
              key={tier.name}
              className={`${
                tier.color === 'primary' 
                  ? 'bg-gradient-to-br from-[#0073FF] to-[#0073FF]/80 text-white scale-105 shadow-xl' 
                  : 'bg-[#F6F6F6] border border-gray-100 shadow-sm'
              } p-8 rounded-2xl transform transition-all duration-300 hover:-translate-y-2 relative`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {tier.color === 'primary' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white text-[#0073FF] px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <p className={`${tier.color === 'primary' ? 'text-white/70' : 'text-dark/70'} mb-6`}>
                {tier.description}
              </p>
              <div className="text-4xl font-bold mb-8">
                £{tier.price}
                <span className={`text-lg font-normal ${tier.color === 'primary' ? 'text-white/70' : 'text-dark/70'}`}>
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className={`${tier.color === 'primary' ? 'text-white' : 'text-[#0073FF]'} mr-2`} size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${
                  tier.color === 'primary' 
                    ? 'bg-white text-[#0073FF] hover:bg-white/90'
                    : 'bg-[#F2F4F8] text-[#222831] hover:bg-gray-200'
                }`}
                onClick={() => handleUpgradeClick(tier.name.toLowerCase())}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
