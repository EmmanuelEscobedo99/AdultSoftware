import { useQuery } from '@tanstack/react-query'
import { supabaseAdminRepository } from '../infrastructure/supabaseAdminRepository'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => supabaseAdminRepository.getStats(),
    staleTime: 30_000,
  })
}

export function useUsers({ role, search } = {}) {
  return useQuery({
    queryKey: ['admin-users', role, search],
    queryFn: () => supabaseAdminRepository.listUsers({ role, search }),
    staleTime: 15_000,
  })
}

export function useReports() {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => supabaseAdminRepository.listReports(),
    staleTime: 15_000,
  })
}
