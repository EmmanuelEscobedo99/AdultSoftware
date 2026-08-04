import { supabase } from '@/services/supabase/client'

const FEED_BUCKET = 'content-videos'

async function getUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

export const supabaseFeedRepository = {
  async getFeedVideos({ limit = 20, offset = 0 }) {
    const { data, error } = await supabase
      .from('creator_videos')
      .select(
        `
        *,
        creator:profiles!creator_id (id, username, display_name, avatar_url)
      `,
      )
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data ?? []
  },

  async getVideoSignedUrl(path, expiresIn = 3600) {
    if (!path) return null
    const { data, error } = await supabase.storage
      .from(FEED_BUCKET)
      .createSignedUrl(path, expiresIn)
    if (error) throw error
    return data?.signedUrl ?? null
  },

  async likeVideo(videoId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('video_likes')
      .insert({ video_id: videoId, user_id: userId })
    if (error) throw error
  },

  async unlikeVideo(videoId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('video_likes')
      .delete()
      .eq('video_id', videoId)
      .eq('user_id', userId)
    if (error) throw error
  },

  async bookmarkVideo(videoId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('video_bookmarks')
      .insert({ video_id: videoId, user_id: userId })
    if (error) throw error
  },

  async removeBookmark(videoId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('video_bookmarks')
      .delete()
      .eq('video_id', videoId)
      .eq('user_id', userId)
    if (error) throw error
  },

  async recordView(videoId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('video_views')
      .insert({ video_id: videoId, user_id: userId, session_id: crypto.randomUUID() })
    if (error) throw error
  },

  async getMyLikes() {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('video_likes')
      .select('video_id')
      .eq('user_id', userId)
    if (error) throw error
    return new Set((data ?? []).map((row) => row.video_id))
  },

  async getMyBookmarks() {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('video_bookmarks')
      .select('video_id')
      .eq('user_id', userId)
    if (error) throw error
    return new Set((data ?? []).map((row) => row.video_id))
  },

  async listComments(videoId) {
    const { data, error } = await supabase
      .from('video_comments')
      .select('*, author:profiles!user_id(id, username, display_name, avatar_url)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async addComment(videoId, body) {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('video_comments')
      .insert({ video_id: videoId, user_id: userId, body })
      .select('*, author:profiles!user_id(id, username, display_name, avatar_url)')
      .single()
    if (error) throw error
    return data
  },

  async deleteComment(commentId) {
    const { error } = await supabase
      .from('video_comments')
      .delete()
      .eq('id', commentId)
    if (error) throw error
  },
}
