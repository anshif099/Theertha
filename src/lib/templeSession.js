const TEMPLE_SESSION_KEY = 'theertha-temple-session'
const COUNTER_SESSION_KEY = 'theertha-counter-session'

export function getCounterSession() {
  const storedSession = sessionStorage.getItem(COUNTER_SESSION_KEY)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)
  } catch {
    sessionStorage.removeItem(COUNTER_SESSION_KEY)
    return null
  }
}

export function endCounterSession() {
  sessionStorage.removeItem(COUNTER_SESSION_KEY)
}

export function getTempleSession() {
  const storedSession = sessionStorage.getItem(TEMPLE_SESSION_KEY)

  if (storedSession) {
    try {
      return JSON.parse(storedSession)
    } catch {
      sessionStorage.removeItem(TEMPLE_SESSION_KEY)
    }
  }

  // Fallback to active counter session so counter users can access daily schedule & accounts
  const counterSession = getCounterSession()
  if (counterSession && counterSession.templeId) {
    return {
      id: counterSession.templeId,
      loginId: counterSession.loginId,
      name: counterSession.templeName,
      isCounter: true,
      counterId: counterSession.counterId,
      counterName: counterSession.counterName,
      counterNo: counterSession.counterNo,
    }
  }

  return null
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

