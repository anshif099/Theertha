// Base path detection and normalized routing for root and subfolder deployments

export function getBasePath() {
  if (typeof window === 'undefined') return ''

  const viteBase = (import.meta.env.BASE_URL || '').replace(/\/+$/, '')
  if (viteBase && viteBase !== '') {
    return viteBase.startsWith('/') ? viteBase : `/${viteBase}`
  }

  const path = window.location.pathname

  // 1. Check if pathname matches /<subfolder>/(temple|superadmin|receipt|temple-login)
  const routeMatch = path.match(/^(.*?)(\/(?:temple|superadmin|receipt|temple-login)(?:[/?#]|$))/)
  if (routeMatch && routeMatch[1]) {
    return routeMatch[1]
  }

  // 2. If path is a subfolder without sub-routes (e.g. /theertha or /theertha/)
  const trimmed = path.replace(/\/+$/, '')
  if (trimmed) {
    const segments = trimmed.split('/').filter(Boolean)
    const first = segments[0]
    if (first && !['temple', 'superadmin', 'receipt', 'temple-login'].includes(first)) {
      return `/${first}`
    }
  }

  return ''
}

export function getNormalizedPath() {
  if (typeof window === 'undefined') return '/'
  const path = window.location.pathname
  const base = getBasePath()
  if (base && path.startsWith(base)) {
    const stripped = path.slice(base.length)
    return stripped.startsWith('/') ? stripped : '/' + stripped
  }
  return path || '/'
}

export function toAppUrl(path) {
  if (!path || typeof path !== 'string') return path
  if (
    path.startsWith('#') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('//') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:')
  ) {
    return path
  }

  const base = getBasePath()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${cleanPath}` : cleanPath
}

export function navigateTo(path) {
  window.location.href = toAppUrl(path)
}

export function initNavigationListener() {
  if (typeof window === 'undefined') return

  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    const anchor = event.target.closest('a')
    if (!anchor) return

    if (anchor.target && anchor.target !== '_self') return

    const href = anchor.getAttribute('href')
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return
    }

    if (href.startsWith('/')) {
      const base = getBasePath()
      if (base && !href.startsWith(base + '/') && href !== base) {
        event.preventDefault()
        window.location.href = `${base}${href}`
      }
    }
  })
}
