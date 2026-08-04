import { supabaseCreatorContentRepository } from '../infrastructure/supabaseCreatorContentRepository'
import { createPostSchema, MAX_MEDIA_FILES } from '../domain/content.schema'

export const creatorContentService = {
  async createPost(input, userId) {
    const data = createPostSchema.parse(input)
    return supabaseCreatorContentRepository.createPost({ ...data, creator_id: userId })
  },

  async updatePost(id, fields) {
    return supabaseCreatorContentRepository.updatePost(id, fields)
  },

  async publishPost(id) {
    return supabaseCreatorContentRepository.publishPost(id)
  },

  async unpublishPost(id) {
    return supabaseCreatorContentRepository.unpublishPost(id)
  },

  async deletePost(id) {
    return supabaseCreatorContentRepository.deletePost(id)
  },

  getMyPosts() {
    return supabaseCreatorContentRepository.getMyPosts()
  },

  /**
   * Crea el post y sube todos los archivos en una sola operación.
   * Si algo falla, limpia los archivos ya subidos.
   */
  async createPostWithMedia(input, files, userId) {
    if (!files?.length) {
      const post = await this.createPost(input, userId)
      return post
    }
    if (files.length > MAX_MEDIA_FILES) {
      throw new Error(`Máximo ${MAX_MEDIA_FILES} archivos por post`)
    }

    const post = await this.createPost(input, userId)
    const uploaded = []
    try {
      for (const file of files) {
        const { bucket, path } =
          await supabaseCreatorContentRepository.uploadMedia(post.id, file)
        uploaded.push({ bucket, path })
        await supabaseCreatorContentRepository.attachMedia(post.id, {
          bucket,
          path,
          file,
        })
      }
    } catch (error) {
      for (const { path } of uploaded) {
        await supabaseCreatorContentRepository.deleteMedia(path).catch(() => {})
      }
      await supabaseCreatorContentRepository.deletePost(post.id).catch(() => {})
      throw error
    }
    return post
  },

  getMediaUrl(bucket, path) {
    return supabaseCreatorContentRepository.getMediaSignedUrl(bucket, path)
  },
}
