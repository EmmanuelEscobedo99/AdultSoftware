// ai-agent-reply/index.ts
// Responde a mensajes de fans en nombre del creador usando su agente de IA.
//
// Invocación:
//  1. Webhook de Supabase (HTTP trigger en `messages` INSERT) — modo producción.
//  2. Invocación directa: POST con { message_id: uuid }.
//
// Usa SOLO service_role (nunca expuesto al frontend).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const MODEL = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function loadMessage(messageId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .maybeSingle()
  if (error || !data) return null
  return data
}

async function loadCreatorAndAgent(conversationId: string) {
  const { data: participants, error } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)

  if (error || !participants) return { creator: null, agent: null }

  const userIds = participants.map((p) => p.user_id)

  const { data: creators } = await supabase
    .from('profiles')
    .select('id, display_name, username')
    .in('id', userIds)
    .eq('role', 'creator')

  const creator = creators?.[0] ?? null
  if (!creator) return { creator: null, agent: null }

  const { data: agent } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('creator_id', creator.id)
    .eq('enabled', true)
    .maybeSingle()

  return { creator, agent }
}

async function loadHistory(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('sender_id, is_ai, body')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20)
  if (error) return []
  return data ?? []
}

async function complete(system: string, history: Array<{ role: string; content: string }>) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, ...history],
      max_tokens: 180,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI ${res.status}: ${body}`)
  }

  const json = await res.json()
  return json?.choices?.[0]?.message?.content ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY no configurada' }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  try {
    const body = await req.json()

    // Webhook de Supabase: { type: 'INSERT', record: { id, ... } }
    // Invocación directa: { message_id } | { message: { id } }
    const messageId =
      body?.message_id ??
      body?.record?.id ??
      body?.message?.id ??
      null

    if (!messageId) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    const message = await loadMessage(messageId)
    if (!message) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_message' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    // Ignorar mensajes del propio agente.
    if (message.is_ai) {
      return new Response(JSON.stringify({ ok: true, skipped: 'is_ai' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    const { creator, agent } = await loadCreatorAndAgent(message.conversation_id)
    if (!creator || !agent) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_agent' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    const system = buildSystemPrompt(agent, creator)
    const history = buildHistory(await loadHistory(message.conversation_id), creator.id)

    const reply = await complete(system, history)
    if (!reply) {
      return new Response(JSON.stringify({ ok: false, error: 'empty_reply' }), {
        status: 502,
        headers: corsHeaders,
      })
    }

    await supabase.from('messages').insert({
      conversation_id: message.conversation_id,
      sender_id: creator.id,
      body: reply,
      is_ai: true,
    })

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', message.conversation_id)

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('ai-agent-reply error', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})

function buildSystemPrompt(agent: any, creator: any): string {
  const base =
    agent.system_prompt ??
    `Eres ${creator.display_name ?? creator.username}, un creador de contenido adulto. ` +
      `Responde con calidez, cercanía y coqueteo, pero mantén límites claros y seguros. ` +
      `Nunca te hagas pasar por otra persona y no compartas información real de contacto.`

  const extras: string[] = []

  if (agent.personality) {
    extras.push(`Personalidad: ${agent.personality}`)
  }

  if (agent.can_sell_ppv) {
    extras.push(
      `Puedes recomendar contenido de pago (PPV) de forma natural cuando el fan muestre interés, ` +
        `sugiriendo posts exclusivos y mencionando que se desbloquean con un pago único. ` +
        `Nunca prometas contenido gratuito si no está marcado como libre.`,
    )
  }

  extras.push(
    `Si el fan pide ver contenido, recuérdale que el contenido para suscriptores y PPV ` +
      `se desbloquea tras suscribirse o pagar.`,
  )

  return [base, ...extras].join('\n\n')
}

function buildHistory(rows: any[], creatorId: string) {
  return rows
    .filter((m) => m.body && typeof m.body === 'string')
    .map((m) => {
      const role =
        m.sender_id === creatorId || m.is_ai ? 'assistant' : 'user'
      return { role, content: m.body }
    })
}
