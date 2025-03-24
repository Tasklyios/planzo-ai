
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@12.18.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response("Missing stripe-signature header", { status: 400, headers: corsHeaders });
    }

    const body = await req.text();
    let event;

    // Verify the signature using the asynchronous method
    try {
      // Use constructEventAsync instead of constructEvent
      event = await stripe.webhooks.constructEventAsync(
        body, 
        signature, 
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
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
        
        if (!productId) {
          console.error("Product ID not found in subscription");
          break;
        }
        
        const product = await stripe.products.retrieve(productId);
        console.log("Product details:", product);
        
        // Determine tier from product name or metadata
        let tier = "free";
        if (product) {
          const productName = product.name.toLowerCase();
          // Check name first
          if (productName.includes("pro")) {
            tier = "pro";
          } else if (productName.includes("plus")) {
            tier = "plus";
          } else if (productName.includes("business")) {
            tier = "business";
          }
          
          // Fallback to metadata if available
          if (product.metadata && product.metadata.tier) {
            tier = product.metadata.tier;
          }
        }
        
        console.log(`Determined tier: ${tier} for product: ${product.name}`);
        
        // Link the subscription to the user
        const { error } = await supabase.rpc("link_stripe_customer", {
          p_email: customerEmail,
          p_stripe_customer_id: session.customer,
          p_stripe_subscription_id: session.subscription,
          p_tier: tier,
          p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        if (error) {
          console.error("Error linking customer:", error);
          break;
        }
        
        console.log(`Successfully linked customer ${customerEmail} to ${tier} subscription`);
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log(`Subscription updated: ${subscription.id}`);
        
        // Get the customer information
        const customerId = subscription.customer;
        const customer = await stripe.customers.retrieve(customerId);
        
        if (!customer || customer.deleted) {
          console.error("Customer not found or deleted");
          break;
        }
        
        const customerEmail = typeof customer === 'object' ? customer.email : null;
        if (!customerEmail) {
          console.error("Customer email not found");
          break;
        }

        // Check if payment has failed and subscription status has changed
        if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          console.log(`Subscription payment failed: ${subscription.id}, status: ${subscription.status}`);
          
          // Reset the user back to free tier
          const { error } = await supabase.rpc("link_stripe_customer", {
            p_email: customerEmail,
            p_stripe_customer_id: customerId,
            p_stripe_subscription_id: subscription.id,
            p_tier: "free",
            p_current_period_end: null,
          });
          
          if (error) {
            console.error("Error resetting subscription to free tier:", error);
          } else {
            console.log(`Reset ${customerEmail} to free tier due to payment failure`);
          }
          break;
        }
        
        // Determine subscription tier from product
        const productId = subscription.items.data[0]?.price.product;
        if (!productId) {
          console.error("Product ID not found in subscription");
          break;
        }
        
        const product = await stripe.products.retrieve(productId);
        console.log("Product details for updated subscription:", product);
        
        // Determine tier from product name or metadata
        let tier = "free";
        if (product) {
          const productName = product.name.toLowerCase();
          // Check name first
          if (productName.includes("pro")) {
            tier = "pro";
          } else if (productName.includes("plus")) {
            tier = "plus";
          } else if (productName.includes("business")) {
            tier = "business";
          }
          
          // Fallback to metadata if available
          if (product.metadata && product.metadata.tier) {
            tier = product.metadata.tier;
          }
        }
        
        console.log(`Determined tier: ${tier} for product: ${product.name}`);
        
        // Update subscription in database
        const { error } = await supabase.rpc("link_stripe_customer", {
          p_email: customerEmail,
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscription.id,
          p_tier: tier,
          p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Successfully updated ${customerEmail} to ${tier} tier`);
        }
        break;
      }
      
      case "invoice.payment_failed": {
        // Handle payment failure
        const invoice = event.data.object;
        console.log(`Payment failed for invoice: ${invoice.id}`);
        
        // Get the customer information
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        if (!customerId || !subscriptionId) {
          console.error("Missing customer or subscription ID in failed invoice");
          break;
        }
        
        const customer = await stripe.customers.retrieve(customerId);
        
        if (!customer || customer.deleted) {
          console.error("Customer not found or deleted");
          break;
        }
        
        const customerEmail = typeof customer === 'object' ? customer.email : null;
        if (!customerEmail) {
          console.error("Customer email not found");
          break;
        }
        
        console.log(`Payment failed for customer: ${customerEmail}, subscription: ${subscriptionId}`);
        
        // Reset the user back to free tier
        const { error } = await supabase.rpc("link_stripe_customer", {
          p_email: customerEmail,
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscriptionId,
          p_tier: "free",
          p_current_period_end: null,
        });
        
        if (error) {
          console.error("Error resetting subscription to free tier:", error);
        } else {
          console.log(`Reset ${customerEmail} to free tier due to payment failure`);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log(`Subscription deleted: ${subscription.id}`);
        
        // Get the customer to find the email
        const customerId = subscription.customer;
        const customer = await stripe.customers.retrieve(customerId);
        
        if (!customer || customer.deleted) {
          console.error("Customer not found or deleted");
          break;
        }
        
        const customerEmail = typeof customer === 'object' ? customer.email : null;
        if (!customerEmail) {
          console.error("Customer email not found");
          break;
        }
        
        // Get the user id by email
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("email", customerEmail)
          .single();
        
        if (userError || !userData) {
          console.error("Error finding user:", userError || "User not found");
          break;
        }
        
        // Reset subscription to free tier
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            tier: "free",
            current_period_end: null,
          })
          .eq("user_id", userData.id);
        
        if (error) {
          console.error("Error resetting subscription:", error);
        } else {
          console.log(`Successfully reset ${customerEmail} to free tier`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
