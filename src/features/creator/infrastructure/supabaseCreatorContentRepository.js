import { supabase } from '@/services/supabase/client'

const IMAGE_BUCKET = 'content-images'
const VIDEO_BUCKET = 'content-videos'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

function bucketFor(mimeType) {
  if (IMAGE_TYPES.has(mimeType)) return IMAGE_BUCKET
  if (VIDEO_TYPES.has(mimeType)) return VIDEO_BUCKET
  throw new Error('Tipo de archivo no permitido')
}

export const supabaseCreatorContentRepository = {
  async createPost({ title, description, visibility, price, publish, creator_id }) {
    const { data, error } = await supabase
      .from('creator_posts')
      .insert({
        creator_id,
        title,
        description,
        visibility,
        price: visibility === 'ppv' ? price : null,
        published_at: publish ? new Date().toISOString() : null,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async updatePost(id, fields) {
    const { data, error } = await supabase
      .from('creator_posts')
      .update(fields)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async publishPost(id) {
    return this.updatePost(id, { published_at: new Date().toISOString() })
  },

  async unpublishPost(id) {
    return this.updatePost(id, { published_at: null })
  },

  async deletePost(id) {
    const { error } = await supabase.from('creator_posts').delete().eq('id', id)
    if (error) throw error
  },

  async getMyPosts() {
    const { data, error } = await supabase
      .from('creator_posts')
      .select('*, media:post_media(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async uploadMedia(postId, file) {
    const bucket = bucketFor(file.type)
    const path = `${postId}/${crypto.randomUUID()}`
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) throw error
    return { bucket, path }
  },

  async attachMedia(postId, { bucket, path, file }) {
    const { data, error } = await supabase
      .from('post_media')
      .insert({
        post_id: postId,
        storage_path: path,
        media_type: bucket === IMAGE_BUCKET ? 'image' : 'video',
        mime_type: file.type,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async deleteMedia(path) {
    const { error } = await supabase.storage.remove([path])
    if (error) throw error
  },

  async getMediaSignedUrl(bucket, path) {
    if (!path) return null
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
    if (error) throw error
    return data?.signedUrl ?? null
  },
}
