import { supabase } from '@/services/supabase/client'

export const supabasePaymentsRepository = {
  async checkout({ planId, postId, provider = 'stripe' }) {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        plan_id: planId ?? null,
        post_id: postId ?? null,
        provider,
      },
    })
    if (error) {
      // FunctionsHttpError: leer el body de la Edge Function para mostrar el motivo real.
      let message = error.message ?? 'Error en el checkout'
      try {
        const body = error.context?.json ? await error.context.json() : null
        if (body?.error) message = body.error
      } catch {
        // sin body legible, mantener el mensaje por defecto
      }
      throw new Error(message)
    }
    // Si la función responde con content-type text/plain, supabase-js devuelve
    // el JSON como string: lo normalizamos a objeto.
    let result = data
    if (typeof data === 'string') {
      try {
        result = JSON.parse(data)
      } catch {
        throw new Error('Respuesta inesperada del servidor')
      }
    }
    if (result?.ok === false) throw new Error(result.error ?? 'Error en el checkout')
    return result
  },

  async getMyPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, creator:profiles!creator_id(id, username, display_name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getMyTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getMyPayouts() {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getAllPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, user:profiles!user_id(id, username, display_name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return data ?? []
  },

  async getAllPayouts() {
    const { data, error } = await supabase
      .from('payouts')
      .select('*, creator:profiles!creator_id(id, username, display_name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
}
