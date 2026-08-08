import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { supabaseAiRepository } from '../../infrastructure/supabaseAiRepository'
import { useAiAgent } from '../../application/useAiAgent'
import { Sparkles } from 'lucide-react'

const defaults = {
  enabled: false,
  personality: '',
  system_prompt: '',
  max_tokens: 180,
  temperature: 0.7,
  auto_reply: true,
  auto_reply_delay_seconds: 30,
  can_sell_ppv: false,
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
        checked ? 'border-primary/50 bg-primary/5' : 'border-line bg-surface-3/70'
      }`}
    >
      <div>
        <p className="text-sm font-medium text-neutral-100">{label}</p>
        {description ? (
          <p className="text-xs text-neutral-500">{description}</p>
        ) : null}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[#e11d63]"
      />
    </label>
  )
}

export default function AiAgentPage() {
  const queryClient = useQueryClient()
  const { data: agent, isLoading } = useAiAgent()
  const [form, setForm] = useState(defaults)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (agent) {
      setForm({
        enabled: agent.enabled,
        personality: agent.personality ?? '',
        system_prompt: agent.system_prompt ?? '',
        max_tokens: agent.max_tokens,
        temperature: Number(agent.temperature),
        auto_reply: agent.auto_reply,
        auto_reply_delay_seconds: agent.auto_reply_delay_seconds,
        can_sell_ppv: agent.can_sell_ppv,
      })
    }
  }, [agent])

  const update = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const numericForm = {
        ...form,
        max_tokens: Number(form.max_tokens),
        temperature: Number(form.temperature),
        auto_reply_delay_seconds: Number(form.auto_reply_delay_seconds),
      }
      await supabaseAiRepository.upsertAgent(numericForm)
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['ai-agent'] })
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Agente IA</h1>
          <p className="text-sm text-neutral-400">
            Automatiza respuestas a tus fans y ventas PPV.
          </p>
        </div>
        <Badge tone={form.enabled ? 'success' : 'default'} className="ml-auto">
          {form.enabled ? 'Activo' : 'Inactivo'}
        </Badge>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Comportamiento</CardTitle>
            <CardDescription>
              La IA responde en tu nombre cuando no estás disponible.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Toggle
              checked={form.enabled}
              onChange={update('enabled')}
              label="Habilitar agente IA"
              description="Permite que la IA responda mensajes de fans."
            />

            <div>
              <Label htmlFor="personality">Personalidad</Label>
              <Input
                id="personality"
                placeholder="Amigable, cariñosa y atenta…"
                value={form.personality}
                onChange={(e) => update('personality')(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="system_prompt">Prompt del sistema</Label>
              <Textarea
                id="system_prompt"
                rows={5}
                placeholder="Instrucciones sobre cómo debe comportarse la IA…"
                value={form.system_prompt}
                onChange={(e) => update('system_prompt')(e.target.value)}
              />
            </div>

            <Toggle
              checked={form.can_sell_ppv}
              onChange={update('can_sell_ppv')}
              label="Vender contenido PPV"
              description="La IA podrá recomendar y ofrecer posts de pago."
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajustes</CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="max_tokens">Máx. tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                min="16"
                max="2048"
                value={form.max_tokens}
                onChange={(e) => update('max_tokens')(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="temperature">Temperatura</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) => update('temperature')(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="delay">Retardo (seg)</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                max="600"
                value={form.auto_reply_delay_seconds}
                onChange={(e) => update('auto_reply_delay_seconds')(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Toggle
              checked={form.auto_reply}
              onChange={update('auto_reply')}
              label="Respuesta automática"
              description="Responde automáticamente a cada mensaje nuevo."
            />
          </div>
        </Card>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {saved ? (
          <p className="text-sm text-emerald-400">Configuración guardada.</p>
        ) : null}

        <Button type="submit" loading={saving}>
          Guardar configuración
        </Button>
      </form>
    </div>
  )
}
