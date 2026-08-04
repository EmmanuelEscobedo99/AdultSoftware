import { useQuery } from '@tanstack/react-query'
import { supabaseAiRepository } from '../infrastructure/supabaseAiRepository'

export function useAiAgent() {
  return useQuery({
    queryKey: ['ai-agent'],
    queryFn: () => supabaseAiRepository.getMyAgent(),
    staleTime: 30_000,
  })
}
