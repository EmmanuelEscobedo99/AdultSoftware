import { useQuery } from '@tanstack/react-query'
import { paymentsService } from '../application/payments.service'

export function useMyPayments() {
  return useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentsService.getMyPayments(),
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
