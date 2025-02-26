
import { Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueFree: () => void;
}

const PricingDialog = ({ open, onOpenChange, onContinueFree }: PricingDialogProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpgradeClick = async (e: React.MouseEvent, tierName: string) => {
    e.preventDefault();
    
    try {
      setLoading(tierName);
      
      // Check authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        navigate('/auth');
        throw new Error('Please sign in to upgrade your plan');
      }

      // Create checkout session
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          tier: tierName,
          userId: session.user.id,
          returnUrl: `${window.location.origin}/account`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create checkout session');
      }

      if (!response.data?.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-0 gap-0">
        <div className="min-h-[800px] bg-gradient-to-b from-[#F9FAFC] to-[#F2F4F8] px-4 py-12">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h1 className="text-[48px] font-bold text-[#222831] mb-4">Choose Your Plan</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Unlock the full potential of AI-powered content creation with our flexible pricing plans
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="text-gray-600">Monthly</span>
              <button
                className="relative inline-flex items-center cursor-pointer"
                onClick={() => setIsYearly(!isYearly)}
              >
                <div className={`w-14 h-7 ${isYearly ? 'bg-[#4F92FF]' : 'bg-gray-200'} rounded-full transition-colors relative`}>
                  <div className={`absolute top-0.5 left-[4px] bg-white border border-gray-300 rounded-full h-6 w-6 transition-transform ${isYearly ? 'translate-x-7' : ''}`} />
                </div>
              </button>
              <span className="text-gray-600">Yearly</span>
              <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">Save 30%</span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {/* Pro Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg transform transition-all duration-300 hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#222831]">Pro</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#222831]">£19.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Check className="text-[#4F92FF] mr-3" />
                  <span>10 video idea generations/day</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-[#4F92FF] mr-3" />
                  <span>20 script generations/day</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-[#4F92FF] mr-3" />
                  <span>Basic analytics</span>
                </div>
              </div>
              <Button
                onClick={(e) => handleUpgradeClick(e, 'pro')}
                disabled={loading === 'pro'}
                className="w-full mt-8 bg-[#F2F4F8] text-[#222831] hover:bg-gray-200 transition-colors"
              >
                {loading === 'pro' ? 'Processing...' : 'Get Started'}
              </Button>
            </div>

            {/* Plus Plan */}
            <div className="bg-gradient-to-br from-[#4F92FF] to-[#6BA5FF] rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:-translate-y-2 scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-[#4F92FF] px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white">Plus</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">£29.99</span>
                  <span className="text-white/80">/month</span>
                </div>
              </div>
              <div className="space-y-4 text-white">
                <div className="flex items-center">
                  <Check className="text-white mr-3" />
                  <span>20 video idea generations/day</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-white mr-3" />
                  <span>30 script generations/day</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-white mr-3" />
                  <span>Advanced analytics</span>
                </div>
              </div>
              <Button
                onClick={(e) => handleUpgradeClick(e, 'plus')}
                disabled={loading === 'plus'}
                className="w-full mt-8 bg-white text-[#4F92FF] hover:bg-gray-50 transition-colors"
              >
                {loading === 'plus' ? 'Processing...' : 'Get Started'}
              </Button>
            </div>

            {/* Business Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg transform transition-all duration-300 hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#222831]">Business</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#222831]">£69.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Check className="text-[#4F92FF] mr-3" />
                  <span>Unlimited video generations</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-[#4F92FF] mr-3" />
                  <span>Unlimited script generations</span>
                </div>
                <div className="flex items-center">
                  <Check className="text-[#4F92FF] mr-3" />
                  <span>Priority support</span>
                </div>
              </div>
              <Button
                onClick={(e) => handleUpgradeClick(e, 'business')}
                disabled={loading === 'business'}
                className="w-full mt-8 bg-[#F2F4F8] text-[#222831] hover:bg-gray-200 transition-colors"
              >
                {loading === 'business' ? 'Processing...' : 'Get Started'}
              </Button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto text-center mt-8">
            <Button
              variant="link"
              onClick={onContinueFree}
              className="text-gray-500 hover:text-gray-700"
            >
              Continue with the free plan instead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingDialog;
