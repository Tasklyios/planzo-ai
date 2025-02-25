
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const updateSubscription = async (subscription: Stripe.Subscription) => {
  const customerId = subscription.customer as string
  const { data: userData } = await supabaseClient
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userData?.user_id) {
    console.error('No user found for customer:', customerId)
    return
  }

  // Map Stripe price IDs to subscription tiers
  const priceToTier: { [key: string]: 'free' | 'pro' | 'plus' | 'business' } = {
    [Deno.env.get('STRIPE_PRO_PRICE_ID') || '']: 'pro',
    [Deno.env.get('STRIPE_PLUS_PRICE_ID') || '']: 'plus',
    [Deno.env.get('STRIPE_BUSINESS_PRICE_ID') || '']: 'business',
  }

  const priceId = subscription.items.data[0].price.id
  const tier = priceToTier[priceId] || 'free'

  // Update user's subscription in database
  await supabaseClient
    .from('user_subscriptions')
    .update({
      tier,
      stripe_subscription_id: subscription.id,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('user_id', userData.user_id)

  console.log(`Updated subscription for user ${userData.user_id} to ${tier}`)
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!endpointSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET')
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    )

    console.log(`Processing event type ${event.type}`)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await updateSubscription(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        const { data: userData } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userData?.user_id) {
          await supabaseClient
            .from('user_subscriptions')
            .update({
              tier: 'free',
              stripe_subscription_id: null,
              current_period_end: null,
            })
            .eq('user_id', userData.user_id)
          
          console.log(`Reset subscription to free for user ${userData.user_id}`)
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
