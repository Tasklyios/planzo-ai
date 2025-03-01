
import { useEffect, useState } from "react";
import { CreditCard, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PricingSheet from "@/components/pricing/PricingSheet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

type Subscription = {
  tier: 'free' | 'pro' | 'plus' | 'business';
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

const Billing = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session) {
          navigate('/auth');
          return;
        }

        const { data, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (subError) throw subError;
        setSubscription(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [navigate]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanDetails = (tier: string) => {
    const plans = {
      free: { name: 'Free Plan', price: '£0/month' },
      pro: { name: 'Pro Plan', price: '£19.99/month' },
      plus: { name: 'Plus Plan', price: '£29.99/month' },
      business: { name: 'Business Plan', price: '£69.99/month' },
    };
    return plans[tier as keyof typeof plans] || plans.free;
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      // If the user already has a Stripe customer ID, redirect to customer portal
      if (subscription?.stripe_customer_id) {
        toast({
          title: "Redirecting to billing portal",
          description: "You'll be redirected to manage your subscription",
        });
        // Logic to redirect to Stripe customer portal would go here
        // This would typically involve calling a serverless function
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Billing</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>
              Your current plan and billing details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">
                  {getPlanDetails(subscription?.tier || 'free').name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getPlanDetails(subscription?.tier || 'free').price}
                </p>
              </div>
              <div className="flex gap-2">
                {subscription?.stripe_customer_id && (
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={loading}
                  >
                    Manage Subscription
                  </Button>
                )}
                <PricingSheet 
                  trigger={
                    <Button>
                      {subscription?.tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                    </Button>
                  }
                />
              </div>
            </div>

            {subscription?.current_period_end && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Next billing date: {formatDate(subscription.current_period_end)}
                </p>
              </div>
            )}

            {subscription?.stripe_customer_id && (
              <div className="flex items-center gap-2 pt-4">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Payment method on file
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
