import { supabase } from '@/services/supabase/client'

export const supabaseAuthRepository = {
  async signUp({ email, password, username, displayName, role }) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName ?? username,
          role,
        },
      },
    })
  },

  async signIn({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async signOut() {
    return supabase.auth.signOut()
  },

  async resetPassword(email, redirectTo) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
  },

  async updatePassword(password) {
    return supabase.auth.updateUser({ password })
  },

  async getSession() {
    return supabase.auth.getSession()
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
