import { supabase } from '@/services/supabase/client'

export const supabaseProfileRepository = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getProfileByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async updateProfile(userId, fields) {
    const { data, error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', userId)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async updateAvatar(userId, file) {
    const path = `${userId}/${crypto.randomUUID()}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) throw uploadError

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: path })
      .eq('id', userId)
    if (updateError) throw updateError
    return path
  },

  async updateCover(userId, file) {
    const path = `${userId}/cover-${crypto.randomUUID()}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) throw uploadError

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ cover_url: path })
      .eq('id', userId)
    if (updateError) throw updateError
    return path
  },

  async getAvatarUrl(path) {
    if (!path) return null
    const { data } = await supabase.storage
      .from('avatars')
      .createSignedUrl(path, 60 * 60 * 24)
    return data?.signedUrl ?? null
  },
}
