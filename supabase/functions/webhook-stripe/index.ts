
import Stripe from 'https://esm.sh/stripe@14.14.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const getTierFromPriceId = (priceId: string): 'free' | 'pro' | 'business' => {
  const priceTierMap: Record<string, 'free' | 'pro' | 'business'> = {
    [Deno.env.get('STRIPE_PRO_PRICE_ID') || '']: 'pro',
    [Deno.env.get('STRIPE_PLUS_PRICE_ID') || '']: 'pro',
    [Deno.env.get('STRIPE_BUSINESS_PRICE_ID') || '']: 'business',
  };
  return priceTierMap[priceId] || 'free';
};

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0].price.id;
        const customerId = subscription.customer as string;

        // Get userId from user_subscriptions table using stripe_customer_id
        const { data: userData, error: userError } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userError) throw userError;

        // Update user_subscriptions
        await supabaseClient
          .from('user_subscriptions')
          .update({
            tier: getTierFromPriceId(priceId),
            stripe_subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userData.user_id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get userId from user_subscriptions table using stripe_customer_id
        const { data: userData, error: userError } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userError) throw userError;

        // Update user_subscriptions
        await supabaseClient
          .from('user_subscriptions')
          .update({
            tier: 'free',
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq('user_id', userData.user_id);

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
