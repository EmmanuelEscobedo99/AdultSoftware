import { supabase } from '@/services/supabase/client'

export const supabaseAdminRepository = {
  async getStats() {
    const [users, creators, subscribers, pendingReports, payments] =
      await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'creator'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'subscriber'),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
      ])
    return {
      users: users.count ?? 0,
      creators: creators.count ?? 0,
      subscribers: subscribers.count ?? 0,
      pendingReports: pendingReports.count ?? 0,
      completedPayments: payments.count ?? 0,
    }
  },

  async listUsers({ role, search, limit = 50 } = {}) {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (role) query = query.eq('role', role)
    if (search) query = query.ilike('username', `%${search}%`)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async setUserRole(userId, role) {
    const { error } = await supabase.rpc('admin_set_role', {
      p_target_user: userId,
      p_new_role: role,
    })
    if (error) throw error
  },

  async banUser(userId, ban) {
    const { error } = await supabase.rpc('admin_ban_user', {
      p_user_id: userId,
      p_ban: ban,
    })
    if (error) throw error
  },

  async listReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reporter_id(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data ?? []
  },

  async updateReport(reportId, status, resolve = false) {
    const { error } = await supabase.rpc('admin_update_report', {
      p_report_id: reportId,
      p_status: status,
      p_resolve: resolve,
    })
    if (error) throw error
  },

  async warnUser(userId, reason, severity = 1) {
    const { error } = await supabase.rpc('admin_warn_user', {
      p_user_id: userId,
      p_reason: reason,
      p_severity: severity,
    })
    if (error) throw error
  },
}
