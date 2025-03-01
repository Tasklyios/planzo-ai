
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@12.18.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  console.log("Received request to link-subscription");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No Authorization header provided");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: corsHeaders, status: 401 }
      );
    }

    // Validate the JWT and get the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: corsHeaders, status: 401 }
      );
    }

    // Get the request body
    const requestData = await req.json();
    const { email } = requestData;

    console.log("Processing link request for email:", email);

    if (!email) {
      console.log("No email provided in request");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Find customer by email
    console.log("Looking up Stripe customer with email:", email);
    const customers = await stripe.customers.list({ email });
    
    if (!customers.data.length) {
      console.log("No Stripe customer found with email:", email);
      return new Response(
        JSON.stringify({ error: "No Stripe customer found with this email" }),
        { headers: corsHeaders, status: 404 }
      );
    }

    const customer = customers.data[0];
    console.log("Found Stripe customer:", customer.id);
    
    // Find active subscriptions
    console.log("Checking for active subscriptions for customer:", customer.id);
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
    });
    
    if (!subscriptions.data.length) {
      console.log("No active subscription found for customer:", customer.id);
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { headers: corsHeaders, status: 404 }
      );
    }

    const subscription = subscriptions.data[0];
    console.log("Found active subscription:", subscription.id);
    
    // Determine tier from product
    const productId = subscription.items.data[0]?.price.product as string;
    let tier = "free";
    
    if (productId) {
      console.log("Getting product details for product:", productId);
      const product = await stripe.products.retrieve(productId);
      const metadata = product.metadata || {};
      tier = metadata.tier || "free";
      console.log("Subscription tier:", tier);
    }
    
    // Link subscription to user account
    console.log("Linking subscription to user:", user.id, "with customer:", customer.id);
    const { error } = await supabase.rpc("link_stripe_customer", {
      p_email: email,
      p_stripe_customer_id: customer.id,
      p_stripe_subscription_id: subscription.id,
      p_tier: tier,
      p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

    if (error) {
      console.error("Error linking subscription:", error);
      return new Response(
        JSON.stringify({ error: "Failed to link subscription: " + error.message }),
        { headers: corsHeaders, status: 500 }
      );
    }

    console.log("Successfully linked subscription");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription linked successfully",
        subscription: {
          customer_id: customer.id,
          subscription_id: subscription.id,
          tier: tier,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }
      }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
