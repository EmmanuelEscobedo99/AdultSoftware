import { supabase } from '@/services/supabase/client'

export const supabaseSubscriberRepository = {
  async listCreators({ search } = {}) {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .eq('is_banned', false)
    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(
        `display_name.ilike.${term},username.ilike.${term},bio.ilike.${term}`,
      )
    }
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data ?? []
  },

  async getActiveSubscriberCounts() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('creator_id, count')
      .eq('status', 'active')
    if (error) throw error
    const counts = {}
    for (const row of data ?? []) counts[row.creator_id] = row.count
    return counts
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
      .select(
        'id, title, description, created_at, media:post_media(storage_path, media_type, sort_order)',
      )
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
      .select(
        'id, title, description, price, created_at, media:post_media(storage_path, media_type, sort_order)',
      )
      .eq('creator_id', creatorId)
      .eq('visibility', 'ppv')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data ?? []
  },

  async getPostMediaUrl(media) {
    if (!media?.storage_path) return null
    const bucket = media.media_type === 'video' ? 'content-videos' : 'content-images'
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(media.storage_path, 60 * 60)
    if (error) throw error
    return data?.signedUrl ?? null
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
