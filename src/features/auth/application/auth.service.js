import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  parseSchema,
} from '../domain/auth.schema'

function toAuthError(error) {
  if (!error) return null
  const message = error.message ?? 'Error de autenticación'
  if (message.includes('Invalid login credentials')) {
    return { code: 'invalid_credentials', message: 'Email o contraseña incorrectos' }
  }
  if (message.includes('Email not confirmed')) {
    return { code: 'email_not_confirmed', message: 'Confirma tu email antes de iniciar sesión' }
  }
  if (message.includes('already registered')) {
    return { code: 'email_in_use', message: 'Ya existe una cuenta con este email' }
  }
  if (message.includes('Username already taken') || message.includes('duplicate key')) {
    return { code: 'username_taken', message: 'El nombre de usuario ya está en uso' }
  }
  if (message.includes('User already registered')) {
    return { code: 'email_in_use', message: 'Ya existe una cuenta con este email' }
  }
  return { code: 'unknown', message }
}

/**
 * Casos de uso de autenticación.
 * Dependencias inyectadas (repositorios) para respetar Clean Architecture.
 */
export function createAuthService({ authRepository, profileRepository }) {
  async function register(input) {
    const data = parseSchema(registerSchema, input)
    const { data: result, error } = await authRepository.signUp(data)
    return { data: result, error: toAuthError(error) }
  }

  async function login(input) {
    const data = parseSchema(loginSchema, input)
    const { data: result, error } = await authRepository.signIn(data)
    return { data: result, error: toAuthError(error) }
  }

  async function logout() {
    const { error } = await authRepository.signOut()
    return { error: toAuthError(error) }
  }

  async function requestPasswordReset(email) {
    parseSchema(forgotPasswordSchema, { email })
    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { data, error } = await authRepository.resetPassword(email, redirectTo)
    return { data, error: toAuthError(error) }
  }

  async function updatePassword(password) {
    const data = parseSchema(resetPasswordSchema, { password, confirmPassword: password })
    const { data: result, error } = await authRepository.updatePassword(data.password)
    return { data: result, error: toAuthError(error) }
  }

  async function fetchProfile(userId) {
    if (!userId) return null
    return profileRepository.getProfile(userId)
  }

  async function refreshProfile(userId) {
    return fetchProfile(userId)
  }

  return {
    register,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
    fetchProfile,
    refreshProfile,
  }
}
