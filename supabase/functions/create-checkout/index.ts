// create-checkout/index.ts
// Crea el intento de pago para suscripciones o posts PPV.
//
// Body: { provider?: 'stripe'|'ccbill'|'segpay'|'test', plan_id?, post_id? }
//
// - 'test' (modo demo): crea y finaliza el pago al instante.
// - 'stripe': crea una Stripe Checkout Session (página alojada por Stripe)
//   y devuelve redirect_url. El webhook (payment-webhook) finaliza el pago.
// - 'ccbill'/'segpay': devuelve la URL de checkout del proveedor.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? null
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const body = await req.json()
    const provider = body.provider ?? 'stripe'
    const planId = body.plan_id ?? null
    const postId = body.post_id ?? null

    if ((!planId && !postId) || (planId && postId)) {
      return new Response(JSON.stringify({ error: 'plan_id o post_id requerido' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // --- Validar objetivo ---
    let creatorId: string | null = null
    let amount = 0
    let currency = 'usd'
    let productName = 'Contenido'
    let purpose: 'subscription' | 'ppv_unlock' = planId ? 'subscription' : 'ppv_unlock'

    if (planId) {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('creator_id, name, price, currency')
        .eq('id', planId)
        .eq('is_active', true)
        .maybeSingle()
      if (!plan) {
        return new Response(JSON.stringify({ error: 'plan_no_disponible' }), {
          status: 400, headers: corsHeaders,
        })
      }
      creatorId = plan.creator_id
      amount = Number(plan.price)
      currency = String(plan.currency ?? 'USD').toLowerCase()
      productName = `Suscripción a ${plan.name}`

      const { data: activeSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .maybeSingle()
      if (activeSub) {
        return new Response(JSON.stringify({ error: 'ya_suscrito' }), {
          status: 400, headers: corsHeaders,
        })
      }
    } else if (postId) {
      const { data: post } = await supabase
        .from('creator_posts')
        .select('creator_id, title, price')
        .eq('id', postId)
        .eq('visibility', 'ppv')
        .maybeSingle()
      if (!post) {
        return new Response(JSON.stringify({ error: 'post_no_disponible' }), {
          status: 400, headers: corsHeaders,
        })
      }
      creatorId = post.creator_id
      amount = Number(post.price ?? 0)
      productName = post.title && post.title.trim() ? post.title.trim() : 'Contenido premium'

      const { data: alreadyUnlocked } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('purpose', 'ppv_unlock')
        .eq('status', 'completed')
        .maybeSingle()
      if (alreadyUnlocked) {
        return new Response(
          JSON.stringify({
            ok: true,
            payment_id: alreadyUnlocked.id,
            provider,
            already_unlocked: true,
          }),
          { status: 200, headers: corsHeaders },
        )
      }
    }

    // --- Crear payment pendiente ---
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        post_id: postId,
        plan_id: planId,
        purpose,
        provider,
        provider_payment_id: null,
        amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        metadata: { provider, product_name: productName },
      })
      .select('*')
      .single()

    if (paymentError) throw paymentError

    // --- Proveedor test: finalizar al instante ---
    if (provider === 'test') {
      const { error: finalizeError } = await supabase.rpc('finalize_payment', {
        p_payment_id: payment.id,
      })
      if (finalizeError) throw finalizeError
      return new Response(
        JSON.stringify({ ok: true, payment_id: payment.id, provider: 'test' }),
        { status: 200, headers: corsHeaders },
      )
    }

    // --- Stripe: Checkout Session (página de pago alojada) ---
    if (provider === 'stripe') {
      if (!STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ error: 'stripe_no_configurado' }), {
          status: 500, headers: corsHeaders,
        })
      }
      const session = await createStripeCheckoutSession({
        paymentId: payment.id,
        userEmail: user.email,
        amount,
        currency,
        productName,
        purpose,
      })
      await supabase
        .from('payments')
        .update({ provider_payment_id: session.id })
        .eq('id', payment.id)
      return new Response(
        JSON.stringify({
          ok: true,
          payment_id: payment.id,
          redirect_url: session.url,
          provider: 'stripe',
        }),
        { status: 200, headers: corsHeaders },
      )
    }

    // --- CCBill / SegPay ---
    const redirectUrl = buildRedirectUrl(provider, payment.id, amount)
    await supabase
      .from('payments')
      .update({ provider_payment_id: `checkout_${payment.id}` })
      .eq('id', payment.id)
    return new Response(
      JSON.stringify({ ok: true, payment_id: payment.id, redirect_url: redirectUrl }),
      { status: 200, headers: corsHeaders },
    )
  } catch (err) {
    console.error('create-checkout error', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: corsHeaders,
    })
  }
})

async function createStripeCheckoutSession(params: {
  paymentId: string
  userEmail?: string
  amount: number
  currency: string
  productName: string
  purpose: string
}) {
  const body = new URLSearchParams({
    mode: 'payment',
    'success_url': `${SITE_URL}/dashboard/payments?success=1&payment_id=${params.paymentId}`,
    'cancel_url': `${SITE_URL}/dashboard/payments?cancelled=1`,
    'client_reference_id': params.paymentId,
    'metadata[payment_id]': params.paymentId,
    'metadata[purpose]': params.purpose,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': params.currency,
    'line_items[0][price_data][unit_amount]': String(Math.round(params.amount * 100)),
    'line_items[0][price_data][product_data][name]': params.productName,
  })
  if (params.userEmail) {
    body.set('customer_email', params.userEmail)
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${JSON.stringify(json)}`)
  return json
}

function buildRedirectUrl(provider: string, paymentId: string, amount: number) {
  // Placeholder para cada proveedor; reemplazar con sus endpoints reales.
  const common = new URLSearchParams({
    payment_id: paymentId,
    amount: String(amount),
    currency: 'USD',
    return_url: `${SITE_URL}/dashboard/payments?success=1&payment_id=${paymentId}`,
  })
  const endpoints: Record<string, string> = {
    ccbill: 'https://billings.ccbill.com/forms/newcustomersubscribe.cgi',
    segpay: 'https://secure.segpay.com/signup',
  }
  return `${endpoints[provider]}?${common.toString()}`
}
