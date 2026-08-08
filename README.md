# CreatorHub

Plataforma de suscripción para creadores de contenido (estilo OnlyFans / Fansly /
Patreon) con feed tipo TikTok, chat en tiempo real y un agente de IA que ayuda a
creadores a vender más.

## Stack

**Frontend:** React 19 · Vite · React Router · Zustand · TanStack Query ·
React Hook Form · Zod · Tailwind CSS v4.

**Backend:** Supabase (Auth · PostgreSQL · RLS · Storage · Realtime ·
Edge Functions).

## Estructura

```
src/
  app/           bootstrap (providers, raíz)
  features/      módulos verticales (auth, creator, subscriber, admin,
                 chat, feed, payments) con Clean Architecture:
                   domain/ · application/ · infrastructure/ · presentation/
  components/    UI atómica reutilizable
  hooks/         hooks compartidos
  lib/           constantes, helpers
  routes/        router + route guards (Protected/Guest/Role)
  services/      clientes de infraestructura (supabase)
  stores/        stores Zustand
  utils/         utilidades puras
  pages/         páginas globales (landing, 404, 403)

supabase/
  migrations/     migraciones SQL (0001..0025): tablas, RLS, triggers, RPCs
  functions/      Edge Functions (ai-agent-reply, chat-media, create-checkout, payment-webhook)
```

## Diseño de interfaz (dark premium)

Sistema de diseño propio definido en `src/index.css`:

- **Tipografía**: Inter (texto) + Sora (títulos, `font-display`).
- **Paleta**: `surface`/`surface-2`/`surface-3`/`surface-4`, `line`, `primary`
  (`#e11d63`) y `accent` (`#8b5cf6`).
- **Utilidades**: `bg-brand-gradient`, `text-gradient`, `bg-grid`, `bg-noise`,
  `shadow-card`, `shadow-soft`, `shadow-glow`.
- **Componentes**: `ui/Button`, `Card`, `Input`, `Badge`, `Loader`, `Skeleton`,
  `BrandLogo`, `Segmented` (control segmentado con estado seleccionado en
  degradado). Patrones recurrentes: avatares con anillo degradado, mosaicos de
  iconos en degradado para encabezados, orbes difuminados y fondo `bg-grid` en
  landing/auth.

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env` a partir de `.env.example` y rellenar las variables del proyecto
   Supabase (solo la **publishable/anon key**; la `service_role_key` jamás se usa
   en el frontend).

3. Aplicar migraciones y seed (requiere Supabase CLI):

   ```bash
   supabase start                 # local
   supabase db reset              # aplica migraciones + seed
   ```

   Usuarios demo (del seed):
   - `admin@creatorhub.test` / `Admin123!`
   - `creator@creatorhub.test` / `Creator123!`
   - `fan@creatorhub.test` / `Fan123!`

4. Arrancar el frontend:

   ```bash
   npm run dev
   ```

## Edge Functions

| Función               | Propósito                                              |
| --------------------- | ------------------------------------------------------ |
| `ai-agent-reply`      | Responde a fans con la IA del creador (auto-reply).    |
| `chat-media`          | Sube adjuntos de chat y firma URLs (service_role).     |
| `create-checkout`     | Crea el pago (Stripe / CCBill / SegPay / test).        |
| `payment-webhook`     | Verifica y finaliza pagos desde los proveedores.       |

Despliegue:

```bash
supabase functions deploy ai-agent-reply
supabase functions deploy chat-media
supabase functions deploy create-checkout
supabase functions deploy payment-webhook
```

Variables secretas (`supabase secrets set --env-file .env.production`):
`OPENAI_API_KEY`, `AI_MODEL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`CCBILL_SECRET`, `SEGPAY_SECRET`, `SITE_URL`.

## Seguridad

- **RLS activada en todas las tablas.** Las políticas usan `security definer`
  helpers (`is_staff`, `has_active_subscription`, `has_post_access`, etc.).
- **Roles** en `profiles.role`, sincronizados con los claims `app_metadata.role`
  del JWT. Los cambios de rol solo se hacen vía RPC `admin_set_role`
  (verificado en servidor). En el registro solo se aceptan `subscriber` y
  `creator` (migración 0025); cualquier rol privilegiado solicitado se fuerza a
  `subscriber`.
- **Frontend**: únicamente `anon key`. La `service_role_key` vive solo en
  Edge Functions / webhooks.
- **Chat** protegido por RPCs `security definer` (`start_conversation`,
  `send_message`); Realtime filtra por RLS.
- **Storage**: buckets privados (`content-images`, `content-videos`, `avatars`),
  acceso por Signed URLs con verificación de entitlement.
- **Pagos**: la activación de suscripciones/PPV ocurre solo desde el webhook.
  El cliente llama siempre a la Edge Function `create-checkout` (nunca a RPCs
  de escritura directos). En modo `test` (por defecto en dev) el pago se
  finaliza al instante; en producción elige `stripe` / `ccbill` / `segpay`
  desde el perfil del creador.
- **PPV**: los metadatos de los posts PPV (título, descripción, precio) son
  visibles para cualquier usuario autenticado; el contenido (media) solo se
  muestra a quien tiene acceso (`has_post_access` / `has_unlocked_post`).
  `finalize_payment` solo lo puede ejecutar `service_role` (webhook).

## Deploy del frontend

- **Vercel**: usa `vercel.json` (rewrites SPA). Comando `npm run build`.
- **Netlify**: usa `public/_redirects`. Comando `npm run build`.

## Scripts

```bash
npm run dev        # dev server
npm run build      # build de producción (con code-splitting)
npm run lint       # oxlint
npm run preview    # previsualizar build
```
