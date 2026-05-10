// Known app-level hostnames that are not district subdomains
const APP_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'keepup.hajos.app',
  'dev-keepup.hajos.app',
  'staging-keepup.hajos.app',
])

export function parseDistrictSubdomain(): string | null {
  const hostname = window.location.hostname

  // Local dev: opt-in via ?district=slug so you can test routing without DNS
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return new URLSearchParams(window.location.search).get('district')
  }

  if (APP_HOSTS.has(hostname)) return null

  // District URL shape: {slug}.keepup.hajos.app
  const parts = hostname.split('.')
  if (parts.length === 4 && parts[1] === 'keepup' && parts[2] === 'hajos' && parts[3] === 'app') {
    return parts[0]
  }

  return null
}
