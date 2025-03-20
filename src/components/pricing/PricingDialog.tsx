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

      // Create checkout session with isYearly parameter
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          tier: tierName,
          userId: session.user.id,
          returnUrl: `${window.location.origin}/account`,
          isYearly: isYearly
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
          <div id="pricing-header" className="max-w-7xl mx-auto text-center mb-16">
            <h1 className="text-[48px] font-bold text-[#222831] mb-4">Choose Your Plan</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Unlock the full potential of AI-powered content creation with our flexible pricing plans
            </p>
            <div id="billing-toggle" className="mt-8 flex items-center justify-center gap-4">
              <div className="flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                <button
                  type="button"
                  className={`px-6 py-2 rounded-full transition-colors ${
                    !isYearly ? 'bg-[#4F92FF] text-white' : 'bg-transparent text-gray-600'
                  }`}
                  onClick={() => setIsYearly(false)}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`px-6 py-2 rounded-full transition-colors ${
                    isYearly ? 'bg-[#4F92FF] text-white' : 'bg-transparent text-gray-600'
                  }`}
                  onClick={() => setIsYearly(true)}
                >
                  Yearly
                </button>
              </div>
              {isYearly && <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">Save 20%</span>}
            </div>
          </div>

          <div id="pricing-cards" className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div id="pro-plan" className="bg-[#F6F6F6] rounded-2xl p-8 shadow-sm border border-gray-100 transform transition-all duration-300 hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#222831]">Pro</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#222831]">£19.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-[#4F92FF] mr-3"></i>
                  <span>10 video idea generations/day</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-[#4F92FF] mr-3"></i>
                  <span>20 script generations/day</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-[#4F92FF] mr-3"></i>
                  <span>Basic analytics</span>
                </div>
              </div>
              <button 
                onClick={(e) => handleUpgradeClick(e, 'pro')}
                disabled={loading === 'pro'}
                className="w-full mt-8 bg-[#F2F4F8] text-[#222831] py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                {loading === 'pro' ? 'Processing...' : 'Get Started'}
              </button>
            </div>

            <div id="plus-plan" className="bg-gradient-to-br from-[#4F92FF] to-[#6BA5FF] rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:-translate-y-2 scale-105 relative">
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
                  <i className="fa-solid fa-check text-white mr-3"></i>
                  <span>20 video idea generations/day</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-white mr-3"></i>
                  <span>30 script generations/day</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-white mr-3"></i>
                  <span>Advanced analytics</span>
                </div>
              </div>
              <button 
                onClick={(e) => handleUpgradeClick(e, 'plus')}
                disabled={loading === 'plus'}
                className="w-full mt-8 bg-white text-[#4F92FF] py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                {loading === 'plus' ? 'Processing...' : 'Get Started'}
              </button>
            </div>

            <div id="business-plan" className="bg-[#F6F6F6] rounded-2xl p-8 shadow-sm border border-gray-100 transform transition-all duration-300 hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#222831]">Business</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#222831]">£99.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-[#4F92FF] mr-3"></i>
                  <span>Unlimited video generations</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-[#4F92FF] mr-3"></i>
                  <span>Unlimited script generations</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-check text-[#4F92FF] mr-3"></i>
                  <span>Priority support</span>
                </div>
              </div>
              <button 
                onClick={(e) => handleUpgradeClick(e, 'business')}
                disabled={loading === 'business'}
                className="w-full mt-8 bg-[#F2F4F8] text-[#222831] py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                {loading === 'business' ? 'Processing...' : 'Get Started'}
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto text-center mt-8">
            <button
              onClick={onContinueFree}
              className="text-gray-500 hover:text-gray-700"
            >
              Continue with the free plan instead
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingDialog;
