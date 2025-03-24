
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/installation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@13.3.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    console.log('Request received');

    // Get the request body
    const { tier, userId, returnUrl, isYearly } = await req.json();
    
    console.log('Request body:', { tier, userId, returnUrl, isYearly });

    // Initialize Stripe with your secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the appropriate price ID based on tier and billing frequency
    let priceIdKey;
    if (isYearly) {
      priceIdKey = `STRIPE_${tier.toUpperCase()}_YEARLY_PRICE_ID`;
    } else {
      priceIdKey = `STRIPE_${tier.toUpperCase()}_PRICE_ID`;
    }
    
    const priceId = Deno.env.get(priceIdKey);
    console.log('Retrieved price ID key:', priceIdKey);
    console.log('Retrieved price ID:', priceId);

    if (!priceId) {
      throw new Error(`Price ID not found for tier: ${tier} (${isYearly ? 'yearly' : 'monthly'})`);
    }

    console.log('Creating checkout session with price ID:', priceId);

    // Create Checkout Session with absolute URL and success/cancel handling
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      client_reference_id: userId,
      allow_promotion_codes: true,
    });

    console.log('Checkout session created:', session.url);

    // Return the session URL
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
