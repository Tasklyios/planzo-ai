
import { useEffect, useState } from "react";
import { CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PricingSheet from "@/components/pricing/PricingSheet";
import LinkSubscriptionDialog from "@/components/billing/LinkSubscriptionDialog";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type Subscription = {
  tier: 'free' | 'pro' | 'plus' | 'business';
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const Billing = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        navigate('/auth');
        return;
      }

      // Get the subscription data with detailed logging
      const { data, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (subError) {
        console.error("Error fetching subscription data:", subError);
        throw subError;
      }
      
      console.log("Raw subscription data from database:", data);
      
      // If we have valid subscription data, use it
      if (data) {
        // Make sure we're explicitly getting the tier as a string and logging it
        const subscriptionTier = data.tier ? String(data.tier).toLowerCase() : 'free';
        console.log("Subscription tier detected:", subscriptionTier);
        
        setSubscription({
          tier: subscriptionTier as 'free' | 'pro' | 'plus' | 'business',
          current_period_end: data.current_period_end,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id
        });
      } else {
        console.log("No subscription data found, defaulting to free tier");
        // Default to free tier if no subscription is found
        setSubscription({
          tier: 'free',
          current_period_end: null,
          stripe_customer_id: null,
          stripe_subscription_id: null
        });
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error fetching subscription:", err);
      setError(err.message);
      // In case of error, default to free plan to avoid UI issues
      setSubscription({
        tier: 'free',
        current_period_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    
    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });
    
    // Set up a subscription to subscription changes
    const channel = supabase
      .channel('public:user_subscriptions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
      }, () => {
        console.log('Subscription data changed, refreshing...');
        fetchSubscription();
      })
      .subscribe();

    // Poll for changes every 30 seconds in case webhook fails
    const interval = setInterval(() => {
      console.log('Polling for subscription changes...');
      fetchSubscription();
    }, 30000);

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [navigate]);

  const handleRefresh = () => {
    setRefreshing(true);
    toast({
      title: "Refreshing subscription data",
      description: "Getting your latest subscription information",
    });
    fetchSubscription();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (err) {
      return 'Invalid date';
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (!subscription?.stripe_customer_id) {
        throw new Error("No subscription found to manage");
      }
      
      // This is a placeholder for future stripe portal functionality
      toast({
        title: "Coming Soon",
        description: "Subscription management portal will be available soon.",
      });
      
      // For future implementation:
      // const { data: { session } } = await supabase.auth.getSession();
      // const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${session.access_token}`,
      //   },
      //   body: JSON.stringify({
      //     customer_id: subscription.stripe_customer_id
      //   }),
      // });
      // 
      // const { url } = await response.json();
      // window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="container mx-auto p-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-40 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded mt-4" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Current Subscription
            </CardTitle>
            <CardDescription>
              Your current plan and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Current Plan</h3>
                <p className="text-2xl font-bold capitalize">
                  {subscription?.tier || "Free"}
                </p>
              </div>
              
              {subscription?.current_period_end && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Renews On</h3>
                  <p className="font-medium">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              )}
              
              {subscription?.tier !== 'free' && subscription?.stripe_customer_id && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleManageSubscription}
                >
                  Manage Subscription
                </Button>
              )}
              
              {!subscription || subscription?.tier === 'free' ? (
                <span className="text-sm text-muted-foreground block mt-2">
                  Upgrade to get access to more features
                </span>
              ) : (
                <span className="text-sm text-muted-foreground block mt-2">
                  Your subscription is active and will automatically renew
                </span>
              )}
            </div>
            
            {subscription && (
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <p>Subscription ID: {subscription.stripe_subscription_id || 'N/A'}</p>
                <p>Customer ID: {subscription.stripe_customer_id || 'N/A'}</p>
                <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>
                Choose the plan that best fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <PricingSheet 
                  trigger={
                    <Button className="w-full">
                      {subscription?.tier !== 'free' ? "Change Plan" : "Upgrade"}
                    </Button>
                  }
                />
                
                {!subscription?.stripe_subscription_id && (
                  <LinkSubscriptionDialog onSuccess={fetchSubscription} />
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                All plans include a 14-day money-back guarantee
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Billing;
