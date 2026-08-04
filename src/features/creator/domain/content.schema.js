import { z } from 'zod'
import { POST_VISIBILITY } from '@/lib/constants'

export const createPostSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(120),
  description: z.string().max(2000).optional().default(''),
  visibility: z.enum([
    POST_VISIBILITY.FREE,
    POST_VISIBILITY.SUBSCRIBERS,
    POST_VISIBILITY.PPV,
  ]),
  price: z.coerce.number().min(0).optional(),
  publish: z.boolean().default(true),
})

export const MAX_MEDIA_FILES = 20
export const MAX_IMAGE_MB = 10
export const MAX_VIDEO_MB = 500
