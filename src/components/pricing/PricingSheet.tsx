
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PricingSection } from "@/components/ui/pricing-section";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Zap, ArrowDownToDot } from "lucide-react";

interface PricingSheetProps {
  trigger: React.ReactNode;
}

const PricingSheet = ({ trigger }: PricingSheetProps) => {
  const [open, setOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (tierName: string) => {
    try {
      setLoading(tierName);
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        setOpen(false);
        navigate('/auth');
        throw new Error('Please sign in to upgrade your plan');
      }
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          tier: tierName,
          userId: session.user.id,
          returnUrl: `${window.location.origin}/settings`,
          isYearly: isYearly
        }
      });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create checkout session');
      }
      if (!response.data?.url) {
        throw new Error('No checkout URL received');
      }
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start checkout process",
      });
    } finally {
      setLoading(null);
    }
  };

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
      onSelect: () => {
        setOpen(false);
        navigate('/auth');
      },
      isLoading: false,
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
      onSelect: () => handleCheckout('pro'),
      isLoading: loading === 'pro',
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
      onSelect: () => handleCheckout('business'),
      isLoading: loading === 'business',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl lg:max-w-3xl xl:max-w-5xl overflow-y-auto p-0">
        <div className="px-6">
          <SheetHeader>
            <SheetTitle className="text-2xl">Choose your plan</SheetTitle>
          </SheetHeader>
        </div>
        <div>
          <PricingSection 
            tiers={pricingTiers} 
            isYearly={isYearly} 
            onToggleBilling={(yearly) => setIsYearly(yearly)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PricingSheet;
