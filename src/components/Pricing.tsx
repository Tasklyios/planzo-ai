
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, ArrowDownToDot } from "lucide-react";
import { PricingSection } from "@/components/ui/pricing-section";

const Pricing = () => {
  const navigate = useNavigate();

  const pricingTiers = [
    {
      name: "Free",
      price: {
        monthly: 0,
        yearly: 0,
      },
      description: "Try out basic features",
      icon: (
        <div className="relative">
          <Zap className="w-7 h-7 relative z-10 text-gray-500 dark:text-gray-400" />
        </div>
      ),
      features: [
        {
          name: "5 AI video ideas per day",
          description: "Generate unique content ideas",
          included: true,
        },
        {
          name: "1 script generation per day",
          description: "Create engaging scripts",
          included: true,
        },
        {
          name: "4 hooks per day",
          description: "Create attention-grabbing hooks",
          included: true,
        },
        {
          name: "Community support",
          description: "Access to our community forums",
          included: true,
        },
        {
          name: "Customization",
          description: "Personalize your experience",
          included: false,
        },
      ],
    },
    {
      name: "Pro",
      price: {
        monthly: 19.99,
        yearly: 199,
      },
      description: "Perfect for growing creators",
      highlight: true,
      badge: "Most Popular",
      icon: (
        <div className="relative">
          <Sparkles className="w-7 h-7 relative z-10 text-primary" />
        </div>
      ),
      features: [
        {
          name: "50 AI video ideas per day",
          description: "Never run out of content ideas",
          included: true,
        },
        {
          name: "10 script generations per day",
          description: "Create more engaging scripts",
          included: true,
        },
        {
          name: "20 hooks per day",
          description: "Create attention-grabbing hooks",
          included: true,
        },
        {
          name: "Advanced script generation",
          description: "More refined script outputs",
          included: true,
        },
        {
          name: "Colour customization",
          description: "Personalize your experience",
          included: true,
        },
        {
          name: "Priority support",
          description: "Get help when you need it",
          included: true,
        },
      ],
    },
    {
      name: "Business",
      price: {
        monthly: 39.99,
        yearly: 399,
      },
      description: "For teams and agencies",
      icon: (
        <div className="relative">
          <ArrowDownToDot className="w-7 h-7 relative z-10 text-gray-700" />
        </div>
      ),
      features: [
        {
          name: "100 AI video ideas per day",
          description: "Maximum creativity",
          included: true,
        },
        {
          name: "20 script generations per day",
          description: "High volume script creation",
          included: true,
        },
        {
          name: "40 hooks per day",
          description: "More hook variety",
          included: true,
        },
        {
          name: "Advanced script generation",
          description: "Premium script outputs",
          included: true,
        },
        {
          name: "Colour customization",
          description: "Personalize your experience",
          included: true,
        },
        {
          name: "Coming soon: Extra feature",
          description: "Advanced capability (in development)",
          included: true,
        },
        {
          name: "Dedicated account manager",
          description: "Personalized support",
          included: true,
        },
      ],
    },
  ];

  return (
    <section id="pricing" className="bg-gray-50">
      <PricingSection tiers={pricingTiers} />
    </section>
  );
};

export default Pricing;
