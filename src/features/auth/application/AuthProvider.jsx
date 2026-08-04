import { createContext, useContext, useEffect, useMemo } from 'react'
import { supabaseAuthRepository } from '../infrastructure/supabaseAuthRepository'
import { supabaseProfileRepository } from '../infrastructure/supabaseProfileRepository'
import { createAuthService } from './auth.service'
import { useAuthStore, useAuthState } from './auth.store'

const AuthContext = createContext(null)

/**
 * AuthProvider:
 * - Sesión gestionada por Supabase (persistida en storage seguro, refresh automático).
 * - Perfil y rol cargados desde profiles (RLS) y sincronizados con los claims del JWT.
 * - NUNCA guardamos tokens manualmente en localStorage.
 */
export function AuthProvider({ children }) {
  const setSession = useAuthStore((state) => state.setSession)
  const setProfile = useAuthStore((state) => state.setProfile)
  const clearSession = useAuthStore((state) => state.clearSession)
  const userId = useAuthStore((state) => state.user?.id)
  const state = useAuthState()

  const authService = useMemo(
    () =>
      createAuthService({
        authRepository: supabaseAuthRepository,
        profileRepository: supabaseProfileRepository,
      }),
    [],
  )

  useEffect(() => {
    let active = true

    supabaseAuthRepository.getSession().then(({ data }) => {
      if (!active) return
      const session = data.session
      setSession({ session, user: session?.user ?? null })
      if (session?.user?.id) {
        authService
          .fetchProfile(session.user.id)
          .then((profile) => setProfile(profile ?? null))
          .catch(() => setProfile(null))
      }
    })

    const { data } = supabaseAuthRepository.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          clearSession()
          return
        }
        setSession({ session, user: session.user })
        authService
          .fetchProfile(session.user.id)
          .then((profile) => setProfile(profile ?? null))
          .catch(() => setProfile(null))
      },
    )

    return () => {
      active = false
      data?.subscription?.unsubscribe()
    }
  }, [authService, setSession, setProfile, clearSession])

  const refreshProfile = useMemo(
    () => () => {
      if (!userId) return Promise.resolve(null)
      return authService.refreshProfile(userId).then((profile) => {
        setProfile(profile)
        return profile
      })
    },
    [authService, userId, setProfile],
  )

  const value = useMemo(
    () => ({
      ...state,
      authService,
      refreshProfile,
    }),
    [state, authService, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}
