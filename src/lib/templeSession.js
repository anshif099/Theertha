const TEMPLE_SESSION_KEY = 'theertha-temple-session'

export function getTempleSession() {
  const storedSession = sessionStorage.getItem(TEMPLE_SESSION_KEY)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)
  } catch {
    sessionStorage.removeItem(TEMPLE_SESSION_KEY)
    return null
  }
}

export function startTempleSession(temple) {
  sessionStorage.setItem(
    TEMPLE_SESSION_KEY,
    JSON.stringify({
      id: temple.id,
      loginId: temple.loginId,
      name: temple.name,
    }),
  )
}

export function endTempleSession() {
  sessionStorage.removeItem(TEMPLE_SESSION_KEY)
}
