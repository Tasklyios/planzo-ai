
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async () => {
  const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY')
  
  if (!publishableKey) {
    return new Response(
      JSON.stringify({ error: 'Stripe publishable key not found' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ publishableKey }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
