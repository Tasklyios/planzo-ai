
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Link subscription function loaded");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('You must be logged in to link a subscription');
    }

    // Get request body
    const requestData = await req.json();
    const { email } = requestData;

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error('Please provide a valid email address');
    }

    console.log(`Looking up subscription for email: ${email}`);

    // Create a Supabase admin client to access Stripe data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Stripe credentials
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    // Initialize Stripe
    const stripe = new (await import("https://esm.sh/stripe@12.9.0")).default(
      stripeSecretKey
    );

    // Find the Stripe customer by email
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    
    if (!customers.data.length) {
      throw new Error(`No Stripe customer found with email: ${email}`);
    }
    
    const customer = customers.data[0];
    console.log(`Found Stripe customer: ${customer.id}`);

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (!subscriptions.data.length) {
      throw new Error(`No active subscription found for email: ${email}`);
    }
    
    const subscription = subscriptions.data[0];
    console.log(`Found active subscription: ${subscription.id}`);
    
    // Get subscription items to determine the plan
    let tier = 'free';
    
    // Get the product details to determine the tier
    if (subscription.items.data.length > 0) {
      const item = subscription.items.data[0];
      const productId = item.price.product;
      
      // Get the product name/details to determine the tier
      const product = await stripe.products.retrieve(productId.toString());
      console.log(`Product name: ${product.name}`);
      
      // Determine tier based on product name instead of amounts
      const productName = product.name.toLowerCase();
      if (productName.includes('pro')) {
        tier = 'pro';
      } else if (productName.includes('plus')) {
        tier = 'plus';
      } else if (productName.includes('business')) {
        tier = 'business';
      }
      
      console.log(`Determined tier: ${tier} based on product name: ${product.name}`);
    }

    // Call the link_stripe_customer function to update the database
    const { data: dbData, error: dbError } = await supabaseAdmin.rpc(
      'link_stripe_customer',
      {
        p_email: email,
        p_stripe_customer_id: customer.id,
        p_stripe_subscription_id: subscription.id,
        p_tier: tier,
        p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }
    );

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to link subscription: ${dbError.message}`);
    }

    console.log(`Successfully linked subscription for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          customer_id: customer.id,
          tier: tier,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error linking subscription:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unknown error occurred',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});
