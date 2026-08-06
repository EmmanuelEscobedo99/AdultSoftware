import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsService } from '../application/payments.service'

export function useMyPayments() {
  return useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentsService.getMyPayments(),
  })
}

export function useMyPayouts() {
  return useQuery({
    queryKey: ['my-payouts'],
    queryFn: () => paymentsService.getMyPayouts(),
  })
}

export function usePayoutMethod(creatorId) {
  return useQuery({
    queryKey: ['payout-method', creatorId],
    queryFn: () => paymentsService.getPayoutMethod(creatorId),
    enabled: Boolean(creatorId),
  })
}

export function useUpsertPayoutMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (method) => paymentsService.upsertPayoutMethod(method),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payout-method', data.creator_id] })
    },
  })
}

export function useCreatorEarnings() {
  return useQuery({
    queryKey: ['creator-earnings'],
    queryFn: () => paymentsService.getCreatorEarnings(),
  })
}

export function useRequestPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => paymentsService.requestPayout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-earnings'] })
      queryClient.invalidateQueries({ queryKey: ['my-payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
    },
  })
}

export function useAdminPayments() {
  return useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => paymentsService.getAllPayments(),
  })
}

export function useAdminPayouts() {
  return useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => paymentsService.getAllPayouts(),
  })
}
