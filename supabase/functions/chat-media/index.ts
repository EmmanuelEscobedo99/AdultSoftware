// chat-media/index.ts
// Subida y URLs firmadas de adjuntos de chat con service_role (bypass de RLS).
//
// Motivo: desde abril 2025 Supabase NO permite crear políticas RLS sobre
// storage.objects (lo que rompía Storage). Por eso los adjuntos del bucket
// 'chat-media' se gestionan aquí, validando la pertenencia a la conversación
// consultando conversation_participants con service_role.
//
// Acciones (verify_jwt = true, solo usuarios autenticados):
//   upload  — POST multipart: { action: 'upload', conversation_id, file }
//             → { path, mediaType }
//   sign    — POST JSON:       { action: 'sign', path }
//             → { url }
//
// Usa SOLO service_role (nunca expuesto al frontend).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const MAX_BYTES = 200 * 1024 * 1024

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function mediaTypeOf(mime: string) {
  if (IMAGE_TYPES.has(mime)) return 'image'
  if (VIDEO_TYPES.has(mime)) return 'video'
  return null
}

function extensionOf(name: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name ?? '')
  return match ? `.${match[1]}` : ''
}

async function getCaller(req: Request) {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { data, error } = await supabase.auth.getUser(auth.slice(7))
  return error || !data?.user ? null : data.user
}

async function isParticipant(conversationId: string, userId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()
  return !error && !!data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getCaller(req)
    if (!user) return json({ error: 'no_autorizado' }, 401)

    const url = new URL(req.url)
    const contentType = req.headers.get('content-type') ?? ''
    let action = url.searchParams.get('action')
    let jsonBody: Record<string, unknown> | null = null
    let form: FormData | null = null

    if (!action && contentType.includes('application/json')) {
      jsonBody = await req.json()
      action = String(jsonBody?.action ?? '')
    }
    if (!action && contentType.includes('multipart/form-data')) {
      form = await req.formData()
      action = String(form.get('action') ?? 'upload')
    }
    action = action || 'upload'

    if (action === 'sign') {
      const path = String(jsonBody?.path ?? '')
      const conversationId = path.split('/')[0]
      if (!path || !conversationId) return json({ error: 'path_invalido' }, 400)
      if (!(await isParticipant(conversationId, user.id))) {
        return json({ error: 'no_eres_participante' }, 403)
      }
      const { data, error } = await supabase.storage
        .from('chat-media')
        .createSignedUrl(path, 60 * 60)
      if (error) return json({ error: 'no_se_pudo_generar_url' }, 400)
      return json({ url: data.signedUrl })
    }

    const conversationId = String(form?.get('conversation_id') ?? '')
    const file = form?.get('file')

    if (!conversationId || !(file instanceof File)) {
      return json({ error: 'conversacion_o_archivo_requerido' }, 400)
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return json({ error: 'archivo_demasiado_grande' }, 413)
    }
    const mediaType = mediaTypeOf(file.type)
    if (!mediaType) {
      return json({ error: 'formato_no_permitido' }, 415)
    }
    if (!(await isParticipant(conversationId, user.id))) {
      return json({ error: 'no_eres_participante' }, 403)
    }

    const path = `${conversationId}/${crypto.randomUUID()}${extensionOf(file.name)}`
    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) return json({ error: 'no_se_pudo_subir_el_archivo' }, 400)

    return json({ path, mediaType })
  } catch (err) {
    console.error('chat-media error', err)
    return json({ error: String(err) }, 500)
  }
})
