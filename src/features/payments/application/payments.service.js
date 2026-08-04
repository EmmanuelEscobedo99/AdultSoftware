import { supabasePaymentsRepository } from '../infrastructure/supabasePaymentsRepository'

export const paymentsService = {
  checkout(payload) {
    return supabasePaymentsRepository.checkout(payload)
  },

  getMyPayments() {
    return supabasePaymentsRepository.getMyPayments()
  },
  getMyTransactions() {
    return supabasePaymentsRepository.getMyTransactions()
  },
  getMyPayouts() {
    return supabasePaymentsRepository.getMyPayouts()
  },
  getAllPayments() {
    return supabasePaymentsRepository.getAllPayments()
  },
  getAllPayouts() {
    return supabasePaymentsRepository.getAllPayouts()
  },
}
