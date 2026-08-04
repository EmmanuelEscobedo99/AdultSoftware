import { supabase } from '@/services/supabase/client'

export const supabaseSubscriberRepository = {
  async listCreators() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .eq('is_banned', false)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getCreatorByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('role', 'creator')
      .maybeSingle()
    if (error) throw error
    return data
  },

  async listPlans(creatorId) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .order('price', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async listFreePosts(creatorId) {
    const { data, error } = await supabase
      .from('creator_posts')
      .select('id, title, description, created_at')
      .eq('creator_id', creatorId)
      .eq('visibility', 'free')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data ?? []
  },

  async listPpvPosts(creatorId) {
    const { data, error } = await supabase
      .from('creator_posts')
      .select('id, title, description, price, created_at')
      .eq('creator_id', creatorId)
      .eq('visibility', 'ppv')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data ?? []
  },

  async getMyPpvUnlocks(creatorId) {
    const { data, error } = await supabase
      .from('payments')
      .select('post_id')
      .eq('creator_id', creatorId)
      .eq('purpose', 'ppv_unlock')
      .eq('status', 'completed')
    if (error) throw error
    return new Set((data ?? []).map((row) => row.post_id))
  },

  async getMyActiveSubscription(creatorId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getMySubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, creator:profiles!creator_id(id, username, display_name, avatar_url), plan:subscription_plans(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async cancelSubscription(subscriptionId) {
    const { data, error } = await supabase.rpc('cancel_subscription', {
      p_subscription_id: subscriptionId,
    })
    if (error) throw error
    return data
  },
}
