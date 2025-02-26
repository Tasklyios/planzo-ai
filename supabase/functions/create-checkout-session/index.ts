
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/getting_started/installation

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

    // Get the request body
    const { tier, userId, returnUrl } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Map tier to price ID
    const priceId = (() => {
      switch (tier) {
        case 'pro':
          return Deno.env.get('STRIPE_PRO_PRICE_ID');
        case 'plus':
          return Deno.env.get('STRIPE_PLUS_PRICE_ID');
        case 'business':
          return Deno.env.get('STRIPE_BUSINESS_PRICE_ID');
        default:
          throw new Error('Invalid tier');
      }
    })();

    if (!priceId) {
      throw new Error(`Price ID not found for tier: ${tier}`);
    }

    console.log('Creating checkout session with price ID:', priceId);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: returnUrl,
      cancel_url: returnUrl,
      client_reference_id: userId,
    });

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
