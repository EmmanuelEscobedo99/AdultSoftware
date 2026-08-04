/**
 * Contrato del repositorio de autenticación (interfaz de dominio).
 * La implementación concreta vive en infrastructure/.
 *
 * @typedef {Object} AuthRepository
 * @property {(input: {email: string, password: string, username: string, displayName?: string, role: 'creator'|'subscriber'}) => Promise<{data: *, error: *}>} signUp
 * @property {(input: {email: string, password: string}) => Promise<{data: *, error: *}>} signIn
 * @property {() => Promise<{error: *}>} signOut
 * @property {(email: string, redirectTo?: string) => Promise<{data: *, error: *}>} resetPassword
 * @property {(password: string) => Promise<{data: *, error: *}>} updatePassword
 * @property {() => Promise<{data: {session: *}, error: *}>} getSession
 * @property {(callback: (event: string, session: *) => void) => {data: {subscription: *}}} onAuthStateChange
 * @property {(password: string) => Promise<{data: *, error: *}>} refreshSession
 */
