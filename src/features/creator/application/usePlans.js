import { useQuery } from '@tanstack/react-query'
import { supabasePlansRepository } from '../infrastructure/supabasePlansRepository'

export function useMyPlans() {
  return useQuery({
    queryKey: ['my-plans'],
    queryFn: () => supabasePlansRepository.listMyPlans(),
    staleTime: 30_000,
  })
}

export function useMySubscribers() {
  return useQuery({
    queryKey: ['my-subscribers'],
    queryFn: () => supabasePlansRepository.listMySubscribers(),
    staleTime: 30_000,
  })
}
