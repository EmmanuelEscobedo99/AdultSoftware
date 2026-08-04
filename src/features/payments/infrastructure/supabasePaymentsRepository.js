import { supabase } from '@/services/supabase/client'

export const supabasePaymentsRepository = {
  async checkout({ planId, postId, provider = 'test' }) {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        plan_id: planId ?? null,
        post_id: postId ?? null,
        provider,
      },
    })
    if (error) throw error
    if (data?.ok === false) throw new Error(data.error ?? 'Error en el checkout')
    return data
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
