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
  getPayoutMethod(creatorId) {
    return supabasePaymentsRepository.getPayoutMethod(creatorId)
  },
  upsertPayoutMethod(method) {
    return supabasePaymentsRepository.upsertPayoutMethod(method)
  },
  getCreatorEarnings() {
    return supabasePaymentsRepository.getCreatorEarnings()
  },
  requestPayout() {
    return supabasePaymentsRepository.requestPayout()
  },
  getAllPayments() {
    return supabasePaymentsRepository.getAllPayments()
  },
  getAllPayouts() {
    return supabasePaymentsRepository.getAllPayouts()
  },
}
