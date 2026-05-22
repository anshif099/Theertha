export const ADMIN_CREDENTIALS = {
  username: 'superadmin',
  password: 'theertha@2026',
}

export const SESSION_KEY = 'theertha-superadmin-session'

export function hasAdminSession() {
  return sessionStorage.getItem(SESSION_KEY) === 'active'
}

export function verifyAdminLogin(credentials) {
  return (
    credentials.username === ADMIN_CREDENTIALS.username &&
    credentials.password === ADMIN_CREDENTIALS.password
  )
}

export function startAdminSession() {
  sessionStorage.setItem(SESSION_KEY, 'active')
}

export function endAdminSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
