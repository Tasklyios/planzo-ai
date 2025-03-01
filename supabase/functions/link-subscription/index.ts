
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      status: 204,
    });
  }

  // Authentication check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }

    const requestData = await req.json();
    const { email } = requestData;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify email matches authenticated user
    if (user.email !== email) {
      return new Response(JSON.stringify({ error: "Email mismatch" }), {
        headers: { "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Find customer by email
    const customers = await stripe.customers.list({ email });
    
    if (!customers.data.length) {
      return new Response(JSON.stringify({ error: "No Stripe customer found with this email" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customer = customers.data[0];
    
    // Find active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
    });
    
    if (!subscriptions.data.length) {
      return new Response(JSON.stringify({ error: "No active subscription found" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }

    const subscription = subscriptions.data[0];
    
    // Determine tier from product
    const productId = subscription.items.data[0]?.price.product;
    let tier = "free";
    
    if (productId) {
      const product = await stripe.products.retrieve(productId);
      const metadata = product.metadata || {};
      tier = metadata.tier || "free";
    }
    
    // Link subscription to user account
    const { error } = await supabase.rpc("link_stripe_customer", {
      p_email: email,
      p_stripe_customer_id: customer.id,
      p_stripe_subscription_id: subscription.id,
      p_tier: tier,
      p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

    if (error) {
      console.error("Error linking subscription:", error);
      return new Response(JSON.stringify({ error: "Failed to link subscription" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subscription linked successfully",
      subscription: {
        customer_id: customer.id,
        subscription_id: subscription.id,
        tier: tier,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
