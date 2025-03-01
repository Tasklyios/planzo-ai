
import { useEffect, useState } from "react";
import { CreditCard, AlertCircle, RefreshCw, LinkIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [linkingSubscription, setLinkingSubscription] = useState(false);
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

      const { data, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (subError) throw subError;
      
      console.log("Fetched subscription data:", data);
      setSubscription(data);

      // Pre-fill email if we have a session
      if (session.user?.email && !email) {
        setEmail(session.user.email);
      }
    } catch (err: any) {
      console.error("Error fetching subscription:", err);
      setError(err.message);
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

    return () => {
      authListener.subscription.unsubscribe();
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

  const handleLinkSubscription = async () => {
    try {
      setLinkingSubscription(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to link a subscription",
        });
        return;
      }
      
      // Call our new edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to link subscription");
      }
      
      toast({
        title: "Success!",
        description: "Your subscription has been linked to your account",
      });
      
      setLinkDialogOpen(false);
      handleRefresh();
    } catch (err: any) {
      console.error("Error linking subscription:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to link subscription",
      });
    } finally {
      setLinkingSubscription(false);
    }
  };

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

  if (loading && !refreshing) {
    return (
      <div className="container mx-auto p-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLinkDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            Link Existing Subscription
          </Button>
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
      </div>

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
            
            {subscription && (
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <p>Subscription ID: {subscription.stripe_subscription_id || 'N/A'}</p>
                <p>Customer ID: {subscription.stripe_customer_id || 'N/A'}</p>
                <p>Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link your existing subscription</DialogTitle>
            <DialogDescription>
              If you've purchased a subscription but it's not showing up in your account,
              you can link it here using the email you used for payment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email used for subscription</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the email you used for payment"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
              disabled={linkingSubscription}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkSubscription}
              disabled={!email || linkingSubscription}
            >
              {linkingSubscription ? 'Linking...' : 'Link Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
