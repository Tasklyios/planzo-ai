
import { Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PricingSheetProps {
  trigger: React.ReactNode;
}

const PricingSheet = ({ trigger }: PricingSheetProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // We'll fetch the price IDs from the backend to ensure we're using the correct ones
  const handleUpgradeClick = async (e: React.MouseEvent, tier: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setLoading(tier);
      
      console.log('Starting upgrade process for tier:', tier);

      // Check authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        navigate('/auth');
        throw new Error('Please sign in to upgrade your plan');
      }

      console.log('User authenticated, creating checkout session...');

      // Pass the tier name instead of price ID - let the backend handle price ID mapping
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          tier, // Send tier name instead of price ID
          userId: session.user.id,
          returnUrl: `${window.location.origin}/account`
        }
      });

      console.log('Checkout response:', response);

      if (response.error) {
        console.error('Checkout error:', response.error);
        throw new Error(response.error.message || 'Failed to create checkout session');
      }

      if (!response.data?.url) {
        console.error('No URL in response:', response.data);
        throw new Error('No checkout URL received');
      }

      console.log('Redirecting to:', response.data.url);
      window.location.href = response.data.url;
      
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start checkout process",
      });
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: "Pro",
      description: "Perfect to get started",
      price: "19.99",
      features: [
        "2 AI video ideas per day",
        "2 script generations per day",
        "Basic analytics",
        "Simple calendar features"
      ],
      cta: "Get Pro",
      color: "white"
    },
    {
      name: "Plus",
      description: "For serious creators",
      price: "29.99",
      features: [
        "20 AI video ideas per day",
        "20 script generations per day",
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
      color: "primary"
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Upgrade Your Plan</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6 pb-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 rounded-lg border ${
                tier.color === 'primary' ? 'bg-primary text-white' : 'bg-background'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{tier.name}</h3>
                  <p className={`mt-1 text-sm ${
                    tier.color === 'primary' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {tier.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">£{tier.price}</div>
                  <div className={`text-sm ${
                    tier.color === 'primary' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    per month
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <Check className={`mr-2 h-4 w-4 ${
                      tier.color === 'primary' ? 'text-white' : 'text-primary'
                    }`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-6 w-full px-4 py-2 rounded-md font-medium transition-colors ${
                  tier.color === 'primary'
                    ? 'bg-white text-primary hover:bg-white/90 border border-white'
                    : 'bg-primary text-white hover:bg-primary/90'
                } ${loading === tier.name.toLowerCase() ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => handleUpgradeClick(e, tier.name.toLowerCase())}
                disabled={loading === tier.name.toLowerCase()}
              >
                {loading === tier.name.toLowerCase() ? "Loading..." : tier.cta}
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PricingSheet;
