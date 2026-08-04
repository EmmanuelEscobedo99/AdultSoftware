import { useQuery } from '@tanstack/react-query'
import { supabaseProfileRepository } from '@/features/auth/infrastructure/supabaseProfileRepository'

export function useProfileImage(path) {
  return useQuery({
    queryKey: ['profile-image', path],
    queryFn: () => supabaseProfileRepository.getAvatarUrl(path),
    enabled: Boolean(path),
    staleTime: 60 * 60 * 1000,
  })
}
