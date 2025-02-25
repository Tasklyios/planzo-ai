
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const navigate = useNavigate();

  const tiers = [
    {
      name: "Free",
      description: "Perfect to get started",
      price: "0",
      features: [
        "2 AI video ideas per day",
        "2 script generations per day",
        "Basic analytics",
        "Simple calendar features"
      ],
      cta: "Get Started",
      color: "white"
    },
    {
      name: "Pro",
      description: "For serious creators",
      price: "29",
      features: [
        "20 AI video ideas per day",
        "20 script generations per day",
        "Advanced analytics",
        "Full calendar features",
        "Priority support"
      ],
      cta: "Upgrade to Pro",
      color: "primary"
    },
    {
      name: "Business",
      description: "For teams and agencies",
      price: "99",
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
      color: "primary"
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
              className={`bg-${tier.color} p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 fade-up ${
                tier.color === 'primary' ? 'text-white' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <p className={`${tier.color === 'primary' ? 'text-white/70' : 'text-dark/70'} mb-6`}>
                {tier.description}
              </p>
              <div className="text-4xl font-bold mb-8">
                ${tier.price}
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
                    : 'bg-primary text-white hover:bg-primary/90'
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
