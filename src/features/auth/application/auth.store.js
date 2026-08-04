import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

const initialState = {
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  initialized: false,
}

export const useAuthStore = create((set) => ({
  ...initialState,

  setSession({ session, user }) {
    set((state) => ({
      session,
      user: user ?? session?.user ?? null,
      role: session?.user?.app_metadata?.role ?? state.role,
      loading: false,
      initialized: true,
    }))
  },

  setProfile(profile) {
    set(() => ({
      profile,
      role: profile?.role ?? null,
    }))
  },

  clearSession() {
    set({ ...initialState, loading: false, initialized: true })
  },
}))

export function useAuthState() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      session: state.session,
      profile: state.profile,
      role: state.role,
      loading: state.loading,
      initialized: state.initialized,
    })),
  )
}
