# Configuración de Supabase

Supabase CLI se usa para: aplicar migraciones, ejecutar Edge Functions y gestionar el proyecto.

## Comandos útiles

- `supabase start` — levanta la pila local.
- `supabase db reset` — aplica migraciones + seed.
- `supabase functions serve ai-agent-reply` — sirve la Edge Function en local.
- `supabase functions deploy ai-agent-reply` — despliega a producción.

## Configuración de la Edge Function IA

La Edge Function `ai-agent-reply` requiere estas variables de entorno
(configuradas con `supabase secrets set --env-file .env.production`):

- `OPENAI_API_KEY` — clave de OpenAI (solo servidor).
- `AI_MODEL` — opcional, por defecto `gpt-4o-mini`.

NUNCA configures `SUPABASE_SERVICE_ROLE_KEY` en el frontend: la Edge Function
la lee automáticamente desde el entorno del servidor.

## Webhook de Realtime

Para auto-respuesta en producción, crea un Database Webhook en
Supabase Dashboard → Database → Webhooks que dispare en `messages` (INSERT)
hacia la URL de la función `ai-agent-reply` (con el header `Authorization`
=`Bearer <service_role_key>`).

El trigger SQL `notify_ai_agent` de `0009_realtime.sql` también emite un
`pg_notify` como respaldo.
