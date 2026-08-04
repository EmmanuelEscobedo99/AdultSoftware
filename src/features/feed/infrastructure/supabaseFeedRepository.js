import { supabase } from '@/services/supabase/client'

const FEED_BUCKET = 'content-videos'

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
    const { error } = await supabase.from('video_likes').insert({ video_id: videoId })
    if (error) throw error
  },

  async unlikeVideo(videoId) {
    const { error } = await supabase
      .from('video_likes')
      .delete()
      .eq('video_id', videoId)
    if (error) throw error
  },

  async bookmarkVideo(videoId) {
    const { error } = await supabase
      .from('video_bookmarks')
      .insert({ video_id: videoId })
    if (error) throw error
  },

  async removeBookmark(videoId) {
    const { error } = await supabase
      .from('video_bookmarks')
      .delete()
      .eq('video_id', videoId)
    if (error) throw error
  },

  async recordView(videoId) {
    const { error } = await supabase
      .from('video_views')
      .insert({ video_id: videoId, session_id: crypto.randomUUID() })
    if (error) throw error
  },

  async getMyLikes() {
    const { data, error } = await supabase
      .from('video_likes')
      .select('video_id')
    if (error) throw error
    return new Set((data ?? []).map((row) => row.video_id))
  },

  async getMyBookmarks() {
    const { data, error } = await supabase
      .from('video_bookmarks')
      .select('video_id')
    if (error) throw error
    return new Set((data ?? []).map((row) => row.video_id))
  },
}
