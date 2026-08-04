-- 0010_seed.sql
-- Datos de demostración. Solo para desarrollo.
-- Passwords: Admin123! / Creator123! / Fan123!

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@creatorhub.test',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"username":"superadmin","display_name":"Super Admin","role":"super_admin"}'::jsonb,
    '{"role":"super_admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'creator@creatorhub.test',
    crypt('Creator123!', gen_salt('bf')),
    now(),
    '{"username":"luna","display_name":"Luna","role":"creator"}'::jsonb,
    '{"role":"creator"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'fan@creatorhub.test',
    crypt('Fan123!', gen_salt('bf')),
    now(),
    '{"username":"fan1","display_name":"Fan Uno","role":"subscriber"}'::jsonb,
    '{"role":"subscriber"}'::jsonb,
    now(), now()
  )
on conflict (id) do nothing;

-- Asegurar roles en profiles (el trigger handle_new_user ya los crea).
update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role = 'creator' where id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role = 'subscriber' where id = '00000000-0000-0000-0000-000000000003';

-- Plan de suscripción demo para la creadora.
insert into public.subscription_plans (id, creator_id, name, price, currency, billing_interval, description)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000002',
  'Plan Premium',
  9.99,
  'USD',
  'monthly',
  'Acceso a todo el contenido exclusivo.'
)
on conflict (id) do nothing;

-- Post demo (free).
insert into public.creator_posts (id, creator_id, title, description, visibility, published_at)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000002',
  'Bienvenidos',
  'Contenido de prueba gratuito.',
  'free',
  now()
)
on conflict (id) do nothing;

-- Post demo (PPV).
insert into public.creator_posts (id, creator_id, title, description, visibility, price, published_at)
values (
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000002',
  'Sesión privada',
  'Desbloquea este contenido premium por un pago único.',
  'ppv',
  4.99,
  now()
)
on conflict (id) do nothing;

-- Agente IA demo (desactivado).
insert into public.ai_agents (id, creator_id, enabled, personality, system_prompt)
values (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000002',
  false,
  'Amigable, cariñosa y atenta.',
  'Eres Luna. Responde como una creadora de contenido adulto con estilo cálido y cercano.'
)
on conflict (id) do nothing;
