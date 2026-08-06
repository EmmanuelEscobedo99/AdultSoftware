// payment-webhook/index.ts
// Recibe webhooks de Stripe / CCBill / SegPay y finaliza los pagos.
//
// Stripe:  POST /payment-webhook (evento firmado con Stripe-Webhook-Signature)
// CCBill:  POST con form params (aprobado)
// SegPay:  POST con form params
//
// Usa SOLO service_role. Verifica firmas antes de tocar la BD.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? null
const CCBILL_SECRET = Deno.env.get('CCBILL_SECRET') ?? null
const SEGPAY_SECRET = Deno.env.get('SEGPAY_SECRET') ?? null

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function verifyHmac(secret: string | null, body: string, signature: string | null) {
  if (!secret) return false
  if (!signature) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    hexToBuffer(signature),
    new TextEncoder().encode(body),
  )
  return valid
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

async function finalize(paymentId: string, providerTxnId: string) {
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('id', paymentId)
    .maybeSingle()

  if (!payment) {
    // Podría venir identificado por provider_payment_id
    return false
  }

  // Idempotencia: Stripe puede disparar checkout.session.completed y
  // payment_intent.succeeded para el mismo pago.
  if (payment.status === 'completed') return true

  await supabase.from('payments').update({ provider_payment_id: providerTxnId }).eq('id', paymentId)
  const { error } = await supabase.rpc('finalize_payment', { p_payment_id: paymentId })
  return !error
}

async function markFailed(paymentId: string) {
  if (!paymentId) return
  await supabase
    .from('payments')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .in('status', ['pending'])
}

async function handleStripe(bodyText: string, headers: Headers) {
  const signature = headers.get('stripe-signature') ?? null
  if (!STRIPE_WEBHOOK_SECRET) return json({ ok: false, error: 'no_secret' }, 500)

  // Verificación típica de Stripe: 't=<timestamp>,v1=<hmac>'
  const parts = Object.fromEntries(
    (signature ?? '').split(',').map((p) => p.trim().split('=') as [string, string]),
  )
  const valid = await verifyHmac(STRIPE_WEBHOOK_SECRET, `${parts.t}.${bodyText}`, parts.v1 ?? null)
  if (!valid) return json({ ok: false, error: 'invalid_signature' }, 400)

  const event = JSON.parse(bodyText)
  const type = event?.type
  const paymentIntent = event?.data?.object

  if (type === 'payment_intent.succeeded') {
    const meta = paymentIntent?.metadata ?? {}
    const paymentId = meta.payment_id
    if (paymentId) {
      await finalize(paymentId, paymentIntent.id)
    }
  }

  if (type === 'checkout.session.completed') {
    const meta = event?.data?.object?.metadata ?? {}
    if (meta.payment_id) {
      await finalize(meta.payment_id, event.data.object.id)
    }
  }

  return json({ ok: true })
}

async function handleFormProvider(provider: 'ccbill' | 'segpay', form: URLSearchParams, bodyText: string) {
  const secret = provider === 'ccbill' ? CCBILL_SECRET : SEGPAY_SECRET
  const paymentId = form.get('payment_id') ?? form.get('subscription_id')
  const txn = form.get('transactionId') ?? form.get('transaction_id')
  const approved = (form.get('approvalCode') ?? form.get('response') ?? '').toLowerCase()
  const signature = form.get('X') ?? form.get('signature')

  if (!(await verifyHmac(secret, bodyText, signature))) {
    return json({ ok: false, error: 'invalid_signature' }, 400)
  }

  const isApproved =
    approved === 'approved' || approved.includes('ok') || form.get('approved') === '1'

  if (paymentId && isApproved) {
    await finalize(paymentId, txn ?? '')
  }

  return json({ ok: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const provider = url.searchParams.get('provider') ?? 'stripe'
  const bodyText = await req.text()

  try {
    if (provider === 'stripe') return await handleStripe(bodyText, req.headers)
    if (provider === 'ccbill') return await handleFormProvider('ccbill', new URLSearchParams(bodyText), bodyText)
    if (provider === 'segpay') return await handleFormProvider('segpay', new URLSearchParams(bodyText), bodyText)
    return json({ ok: false, error: 'unknown_provider' }, 400)
  } catch (err) {
    console.error('payment-webhook error', err)
    return json({ ok: false, error: String(err) }, 500)
  }
})
