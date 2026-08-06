import { supabase } from '@/services/supabase/client'

async function getUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

export const supabasePlansRepository = {
  async listMyPlans() {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async createPlan({ name, price, currency, billing_interval, description }) {
    const creatorId = await getUserId()
    if (!creatorId) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        creator_id: creatorId,
        name,
        price,
        currency,
        billing_interval,
        description,
        is_active: true,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async togglePlan(planId, isActive) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({ is_active: isActive })
      .eq('id', planId)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async deletePlan(planId) {
    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', planId)
    if (error) throw error
  },

  async listMySubscribers() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        '*, subscriber:profiles!subscriber_id(id, username, display_name, avatar_url), plan:subscription_plans(*)',
      )
      .eq('status', 'active')
      .order('started_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
}
