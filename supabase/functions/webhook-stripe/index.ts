
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@12.18.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const body = await req.text();
    let event;

    // Verify the signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Event received: ${event.type}`);

    // Handle each event type
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        
        if (!session.customer || !session.subscription) {
          console.error("Missing customer or subscription ID in session");
          break;
        }
        
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (!customerEmail) {
          console.error("Customer email not found in session");
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const productId = subscription.items.data[0]?.price.product;
        
        let tier = "free";
        if (productId) {
          const product = await stripe.products.retrieve(productId);
          const metadata = product.metadata || {};
          tier = metadata.tier || "free";
        }
        
        // Link the subscription to the user
        const { error } = await supabase.rpc("link_stripe_customer", {
          p_email: customerEmail,
          p_stripe_customer_id: session.customer,
          p_stripe_subscription_id: session.subscription,
          p_tier: tier,
          p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log(`Subscription updated: ${subscription.id}`);
        
        // Get the customer information
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (!customer || customer.deleted) {
          console.error("Customer not found or deleted");
          break;
        }
        
        const customerEmail = customer.email;
        if (!customerEmail) {
          console.error("Customer email not found");
          break;
        }
        
        // Determine subscription tier
        const productId = subscription.items.data[0]?.price.product;
        let tier = "free";
        
        if (productId) {
          const product = await stripe.products.retrieve(productId);
          const metadata = product.metadata || {};
          tier = metadata.tier || "free";
        }
        
        // Update subscription status in database
        const { error } = await supabase.rpc("link_stripe_customer", {
          p_email: customerEmail,
          p_stripe_customer_id: subscription.customer,
          p_stripe_subscription_id: subscription.id,
          p_tier: tier,
          p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log(`Subscription deleted: ${subscription.id}`);
        
        // Get the customer to find the email
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (!customer || customer.deleted) {
          console.error("Customer not found or deleted");
          break;
        }
        
        const customerEmail = customer.email;
        if (!customerEmail) {
          console.error("Customer email not found");
          break;
        }
        
        // Find user by email and update to free tier
        const { data: userData, error: userError } = await supabase
          .from("auth")
          .select("users.id")
          .eq("users.email", customerEmail)
          .single();
        
        if (userError || !userData) {
          console.error("Error finding user:", userError || "User not found");
          break;
        }
        
        // Reset to free tier
        const { error } = await supabase
          .from("user_subscriptions")
          .update({ 
            tier: "free",
            current_period_end: null,
          })
          .eq("user_id", userData.id);
        
        if (error) {
          console.error("Error resetting subscription:", error);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
