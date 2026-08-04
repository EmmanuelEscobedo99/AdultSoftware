import { supabaseFeedRepository } from '../infrastructure/supabaseFeedRepository'

export const feedService = {
  getFeed({ limit, offset } = {}) {
    return supabaseFeedRepository.getFeedVideos({ limit, offset })
  },

  getVideoUrl(path) {
    return supabaseFeedRepository.getVideoSignedUrl(path)
  },

  async toggleLike(videoId, currentlyLiked) {
    if (currentlyLiked) {
      await supabaseFeedRepository.unlikeVideo(videoId)
      return false
    }
    await supabaseFeedRepository.likeVideo(videoId)
    return true
  },

  async toggleBookmark(videoId, isBookmarked) {
    if (isBookmarked) {
      await supabaseFeedRepository.removeBookmark(videoId)
      return false
    }
    await supabaseFeedRepository.bookmarkVideo(videoId)
    return true
  },

  recordView(videoId) {
    return supabaseFeedRepository.recordView(videoId)
  },

  getMyLikes() {
    return supabaseFeedRepository.getMyLikes()
  },

  getMyBookmarks() {
    return supabaseFeedRepository.getMyBookmarks()
  },
}
