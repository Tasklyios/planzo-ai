
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { priceId, userId, returnUrl } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create Stripe customer
    const { data: subscriptionData } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = subscriptionData?.stripe_customer_id;

    if (!customerId) {
      // Get user email from auth.users
      const { data: userData, error: userError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          userId: userId,
        },
      });

      customerId = customer.id;

      // Update user_subscriptions with Stripe customer ID
      await supabaseClient
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?success=false`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        userId: userId,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
