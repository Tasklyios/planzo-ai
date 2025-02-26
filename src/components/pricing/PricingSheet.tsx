import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
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

const initializeStripe = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-stripe-key');
    
    if (error) {
      console.error('Error fetching Stripe key:', error);
      throw error;
    }
    
    if (!data?.publishableKey) {
      console.error('No publishable key received from server');
      throw new Error('Invalid publishable key');
    }

    console.log('Initializing Stripe with key:', data.publishableKey);
    return loadStripe(data.publishableKey);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }
};

// Initialize Stripe with the publishable key from Supabase
const stripePromise = initializeStripe();

interface PricingSheetProps {
  trigger: React.ReactNode;
}

const PricingSheet = ({ trigger }: PricingSheetProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Verify Stripe initialization on component mount
    stripePromise.catch(error => {
      console.error('Error initializing Stripe:', error);
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Failed to initialize payment system. Please try again later.",
      });
    });
  }, [toast]);

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
      color: "white",
      stripePriceId: 'price_1OpXCZG4Kts8pL4FlyWa2YWW'
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
      color: "primary",
      stripePriceId: 'price_1OpXCZG4Kts8pL4FpEFRkN9E'
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
      color: "primary",
      stripePriceId: 'price_1OpXCZG4Kts8pL4FOUStPIin'
    }
  ];

  const handleUpgradeClick = async (tier: string, priceId: string | undefined) => {
    if (!priceId) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Subscription configuration is incomplete. Please try again later.",
      });
      return;
    }

    try {
      console.log('Starting upgrade process for tier:', tier, 'with priceId:', priceId);
      setLoading(tier);

      // Check authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        console.log('User not authenticated, redirecting to auth page');
        navigate('/auth');
        return;
      }

      console.log('User authenticated:', session.user.id);

      // Create checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: { 
            priceId,
            userId: session.user.id,
            returnUrl: window.location.origin + '/account'
          }
        }
      );

      console.log('Checkout session response:', checkoutData, checkoutError);

      if (checkoutError || !checkoutData?.url) {
        console.error('Checkout error:', checkoutError);
        throw new Error(checkoutError?.message || 'Failed to create checkout session');
      }

      // Redirect to checkout
      console.log('Redirecting to:', checkoutData.url);
      window.location.href = checkoutData.url;
      
    } catch (error: any) {
      console.error('Error in upgrade process:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Upgrade Your Plan</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
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
              <Button
                className={`mt-6 w-full ${
                  tier.color === 'primary'
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
                onClick={() => handleUpgradeClick(tier.name.toLowerCase(), tier.stripePriceId)}
                disabled={!!loading}
              >
                {loading === tier.name.toLowerCase() ? "Loading..." : tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PricingSheet;
