
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
          name: "3 script generations per day",
          description: "Create engaging scripts",
          included: true,
        },
        {
          name: "Basic content calendar",
          description: "Plan your content schedule",
          included: true,
        },
        {
          name: "Community support",
          description: "Access to our community forums",
          included: true,
        },
      ],
    },
    {
      name: "Pro",
      price: {
        monthly: 29,
        yearly: 19,
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
          name: "25 script generations per day",
          description: "Create more engaging scripts",
          included: true,
        },
        {
          name: "Advanced content calendar",
          description: "Full planning capabilities",
          included: true,
        },
        {
          name: "Hook generator",
          description: "Create attention-grabbing hooks",
          included: true,
        },
        {
          name: "AI voiceovers (15/mo)",
          description: "Professional audio for your content",
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
        monthly: 69,
        yearly: 49,
      },
      description: "For teams and agencies",
      icon: (
        <div className="relative">
          <ArrowDownToDot className="w-7 h-7 relative z-10 text-gray-700" />
        </div>
      ),
      features: [
        {
          name: "Unlimited AI video ideas",
          description: "Unlimited creativity",
          included: true,
        },
        {
          name: "Unlimited script generations",
          description: "No limits on script creation",
          included: true,
        },
        {
          name: "Team collaboration",
          description: "Up to 5 team members",
          included: true,
        },
        {
          name: "AI voiceovers",
          description: "Unlimited voiceovers",
          included: true,
        },
        {
          name: "Custom branding",
          description: "Add your brand to all assets",
          included: true,
        },
        {
          name: "API access",
          description: "Integrate with your tools",
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
