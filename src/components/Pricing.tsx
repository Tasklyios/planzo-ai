
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const navigate = useNavigate();

  const tiers = [
    {
      name: "Pro",
      description: "Perfect to get started",
      price: "19.99",
      features: [
        "10 AI video ideas per day",
        "20 script generations per day",
        "Basic analytics",
        "Simple calendar features"
      ],
      cta: "Get Pro",
      color: "gray"
    },
    {
      name: "Plus",
      description: "For serious creators",
      price: "29.99",
      features: [
        "20 AI video ideas per day",
        "30 script generations per day",
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
      price: "69.99",
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
        <h2 className="text-3xl md:text-4xl font-bold text-center text-dark mb-16 fade-up">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div 
              key={tier.name}
              className={`${
                tier.color === 'primary' 
                  ? 'bg-gradient-to-br from-[#4F92FF] to-[#6BA5FF] text-white scale-105 shadow-xl' 
                  : 'bg-[#F6F6F6] border border-gray-100 shadow-sm'
              } p-8 rounded-2xl transform transition-all duration-300 hover:-translate-y-2 relative`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {tier.color === 'primary' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white text-[#4F92FF] px-4 py-1 rounded-full text-sm font-semibold">
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
                  /month
                </span>
              </div>
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className={`${tier.color === 'primary' ? 'text-white' : 'text-primary'} mr-2`} size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${
                  tier.color === 'primary' 
                    ? 'bg-white text-primary hover:bg-white/90'
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
