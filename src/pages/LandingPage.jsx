import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { Button } from '@/components/ui/Button'
import {
  BadgeCheck,
  CreditCard,
  Heart,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#creadores', label: 'Para creadores' },
  { href: '#fans', label: 'Para fans' },
  { href: '#precios', label: 'Precios' },
]

const FEATURES = [
  {
    Icon: CreditCard,
    title: 'Suscripciones recurrentes',
    text: 'Cobra por mes, trimestre o año con planes que tú defines. Tus fans pagan en segundos.',
  },
  {
    Icon: Video,
    title: 'Feed de videos',
    text: 'Publica tu contenido en un feed vertical tipo TikTok, ideal para mostrar y enganchar.',
  },
  {
    Icon: MessageCircle,
    title: 'Chat con IA',
    text: 'Tu asistente personal responde a tus fans en tu nombre, incluso mientras duermes.',
  },
  {
    Icon: ShieldCheck,
    title: 'Pagos seguros',
    text: 'Stripe, CCBill y SegPay. Tú eliges el proveedor y cobras tu dinero de forma segura.',
  },
]

const CREATOR_POINTS = [
  'Ganas dinero desde el primer fan',
  'Vende contenido premium (PPV)',
  'Tu propia marca con foto y portada',
  'Estadísticas de tus ganancias',
  'Solicita tus pagos cuando quieras',
]

const FAN_POINTS = [
  'Suscripción sencilla a tus creadores',
  'Contenido exclusivo de pago por vista',
  'Mensajes directos y privados',
  'Feed de videos personalizado',
  'Guardas tus publicaciones favoritas',
]

const PRICING = [
  {
    name: 'Fan',
    price: 'Gratis',
    period: 'para siempre',
    features: ['Explora y sigue creadores', 'Ve contenido público', 'Mensajes con suscriptores activos'],
    highlight: false,
  },
  {
    name: 'Creador',
    price: '20%',
    period: 'de comisión',
    features: [
      'Publica contenido ilimitado',
      'Cobra suscripciones y PPV',
      'Chat con IA incluido',
      'Solicita pagos cuando quieras',
    ],
    highlight: true,
  },
  {
    name: 'Todo el contenido',
    price: 'Tú decides',
    period: 'sin cuotas ocultas',
    features: ['Suscripciones a tu ritmo', 'Pago por vista individual', 'Sin permanencias'],
    highlight: false,
  },
]

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-64 shrink-0">
      <div className="absolute -inset-8 rounded-[3rem] bg-brand-gradient opacity-25 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-surface-2 shadow-soft">
        <div className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-red-400/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        </div>
        <div className="space-y-4 p-4">
          {[
            { grad: 'from-[#ff5f9e] to-[#ff8fb3]', name: 'Luna Rose', tag: '@lunarose', lines: 3 },
            { grad: 'from-[#a78bfa] to-[#c4b5fd]', name: 'Valentina', tag: '@valentina', lines: 2 },
            { grad: 'from-[#fb7185] to-[#fda4af]', name: 'Mía Stone', tag: '@miastone', lines: 2 },
          ].map((item) => (
            <div
              key={item.tag}
              className="overflow-hidden rounded-2xl border border-line/60 bg-surface-3"
            >
              <div className={`h-28 bg-gradient-to-br ${item.grad}`} />
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-[9px] font-bold text-white">
                    {item.name[0]}
                  </span>
                  <p className="text-xs font-semibold text-neutral-100">{item.name}</p>
                  <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                </div>
                <p className="mt-0.5 text-[10px] text-neutral-500">{item.tag}</p>
                <div className="mt-2 space-y-1">
                  {Array.from({ length: item.lines }).map((_, i) => (
                    <div key={i} className="h-1.5 rounded-full bg-neutral-600/50" />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Heart className="h-3.5 w-3.5 text-red-400" />
                    <Play className="h-3.5 w-3.5 text-neutral-400" />
                    <MessageCircle className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                  <span className="rounded-full bg-brand-gradient px-2.5 py-1 text-[9px] font-semibold text-white">
                    Suscribirse
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="scroll-smooth overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/50 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm">Crear cuenta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_35%,black,transparent)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-gradient opacity-20 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/70 px-3 py-1 text-xs font-medium text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
              Plataforma para creadores · Solo mayores de 18 años
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-neutral-50 sm:text-5xl lg:text-6xl">
              Monetiza tu contenido.
              <br />
              Conquista a tus fans.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-neutral-400">
              Crea tu perfil, publica fotos y videos exclusivos, cobra
              suscripciones y responde a tus fans con un chat con IA. Todo en
              un solo lugar, elegante y seguro.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/auth/register">
                <Button size="lg">Comenzar gratis</Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="outline">
                  <Play className="h-4 w-4" /> Ver cómo funciona
                </Button>
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-8">
              {[
                { Icon: Users, value: '+100', label: 'Creadores listos' },
                { Icon: Star, value: '20%', label: 'Comisión justa' },
                { Icon: Sparkles, value: '24/7', label: 'IA a tu servicio' },
              ].map(({ Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold text-neutral-100">{value}</p>
                    <p className="text-xs text-neutral-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="relative px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Cómo funciona
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-neutral-50 sm:text-4xl">
              Todo lo que necesitas para crecer
            </h2>
            <p className="mt-4 text-neutral-400">
              Una plataforma pensada para que los creadores vivan de su pasión y
              los fans tengan la mejor experiencia.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="group rounded-2xl border border-line/70 bg-surface-2/60 p-6 shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_20px_-8px_rgba(225,29,99,0.6)]">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-neutral-100">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para creadores */}
      <section id="creadores" className="relative px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Para creadores
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-neutral-50 sm:text-4xl">
              Tu contenido vale. Cóbralo.
            </h2>
            <p className="mt-4 text-neutral-400">
              Desde tu primer fan hasta tu primera solicitud de pago: ponemos la
              tecnología y tú pones el talento.
            </p>
            <ul className="mt-8 space-y-3">
              {CREATOR_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gradient">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-neutral-300">{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/auth/register">
                <Button size="lg">Quiero ser creador</Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-gradient opacity-15 blur-3xl" />
            <div className="relative rounded-3xl border border-line/70 bg-surface-2/70 p-8 shadow-soft backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-neutral-100">
                  Tus ganancias del mes
                </p>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  +32%
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: 'Suscripciones', value: '$1,240' },
                  { label: 'Contenido PPV', value: '$560' },
                  { label: 'Comisión', value: '−$360' },
                  { label: 'Tu ganancia', value: '$1,440', accent: true },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-2xl border p-4 ${
                      item.accent
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-line/70 bg-surface-3'
                    }`}
                  >
                    <p className="text-xs text-neutral-500">{item.label}</p>
                    <p
                      className={`mt-1 font-display text-2xl font-bold ${
                        item.accent ? 'text-gradient' : 'text-neutral-100'
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para fans */}
      <section id="fans" className="relative px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-md rounded-3xl border border-line/70 bg-surface-2/70 p-8 shadow-soft backdrop-blur">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-[0_10px_24px_-8px_rgba(225,29,99,0.6)]">
                  <MessageCircle className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-neutral-100">
                    Chat privado
                  </p>
                  <p className="text-xs text-neutral-500">con tu creador favorito</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-brand-gradient px-4 py-2 text-sm text-white">
                  ¡Hola! Me encantó tu último video 😍
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-3 px-4 py-2 text-sm text-neutral-100">
                  ¡Gracias, preciosa! Tengo algo muy especial para ti…
                </div>
                <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-sm bg-brand-gradient px-4 py-2 text-sm text-white">
                  Cuéntame más 👀
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Para fans
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-neutral-50 sm:text-4xl">
              La experiencia más cercana con tus creadores
            </h2>
            <p className="mt-4 text-neutral-400">
              Olvídate de plataformas confusas. Aquí todo es rápido, claro y
              pensado para que disfrutes.
            </p>
            <ul className="mt-8 space-y-3">
              {FAN_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gradient">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-neutral-300">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="relative px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Precios
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-neutral-50 sm:text-4xl">
              Simple y sin sorpresas
            </h2>
            <p className="mt-4 text-neutral-400">
              Únete gratis. Solo pagas cuando empiezas a ganar.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-3xl border p-7 shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${
                  tier.highlight
                    ? 'border-primary/50 bg-surface-2 shadow-glow'
                    : 'border-line/70 bg-surface-2/60'
                }`}
              >
                {tier.highlight ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Popular
                  </span>
                ) : null}
                <h3 className="font-display text-lg font-semibold text-neutral-100">
                  {tier.name}
                </h3>
                <p className="mt-4">
                  <span className="font-display text-4xl font-bold text-gradient">
                    {tier.price}
                  </span>
                  <span className="ml-2 text-sm text-neutral-500">{tier.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-neutral-300">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link to="/auth/register" className="block">
                    <Button
                      className="w-full"
                      variant={tier.highlight ? 'primary' : 'outline'}
                    >
                      Empezar ahora
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-24 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-primary/30 bg-gradient-to-br from-primary/25 via-surface-2 to-accent/25 px-6 py-16 text-center shadow-glow sm:px-16">
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-neutral-50 sm:text-5xl">
              Tu momento de brillar empieza hoy
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-neutral-300">
              Crea tu cuenta en menos de un minuto y empieza a monetizar tu
              contenido con la plataforma que sí cuida tu talento.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth/register">
                <Button size="lg">Crear mi cuenta gratis</Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="outline">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line/60 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-2">
              <BrandLogo />
              <p className="max-w-sm text-sm text-neutral-500">
                La plataforma donde los creadores monetizan su contenido y los
                fans viven la experiencia más cercana.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-neutral-300">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Contenido solo para mayores de 18 años
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-200">Plataforma</p>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                <li><a href="#como-funciona" className="transition-colors hover:text-neutral-200">Cómo funciona</a></li>
                <li><a href="#creadores" className="transition-colors hover:text-neutral-200">Para creadores</a></li>
                <li><a href="#fans" className="transition-colors hover:text-neutral-200">Para fans</a></li>
                <li><a href="#precios" className="transition-colors hover:text-neutral-200">Precios</a></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-200">Legal</p>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-500">
                <li><a href="#" className="transition-colors hover:text-neutral-200">Términos de servicio</a></li>
                <li><a href="#" className="transition-colors hover:text-neutral-200">Política de privacidad</a></li>
                <li><a href="#" className="transition-colors hover:text-neutral-200">Política de cookies</a></li>
                <li><a href="#" className="transition-colors hover:text-neutral-200">DMCA</a></li>
                <li><a href="#" className="transition-colors hover:text-neutral-200">2257</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-6">
            <p className="text-xs text-neutral-600">
              © {new Date().getFullYear()} CreatorHub. Todos los derechos reservados.
            </p>
            <p className="text-xs text-neutral-600">
              Al entrar confirmas que eres mayor de 18 años.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
