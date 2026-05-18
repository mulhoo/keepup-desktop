import { parseDistrictSubdomain } from '@/lib/subdomain'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DISTRICT_SUBDOMAIN = parseDistrictSubdomain()
const DEMO_TOKEN_KEY   = 'keepup_demo_token'
const DEMO_ROLE_KEY    = 'keepup_demo_role'
const SAFETY_TOKEN_KEY = 'keepup_safety_token'

export { DEMO_MODE }

export function getDemoToken(): string | null {
  return localStorage.getItem(DEMO_TOKEN_KEY)
}

export function setDemoToken(token: string): void {
  localStorage.setItem(DEMO_TOKEN_KEY, token)
}

export function clearDemoToken(): void {
  localStorage.removeItem(DEMO_TOKEN_KEY)
}

export function getDemoRole(): string | null {
  return localStorage.getItem(DEMO_ROLE_KEY)
}

export function setDemoRole(role: string): void {
  localStorage.setItem(DEMO_ROLE_KEY, role)
}

export function clearDemoRole(): void {
  localStorage.removeItem(DEMO_ROLE_KEY)
}

export function getSafetyToken(): string | null {
  return localStorage.getItem(SAFETY_TOKEN_KEY)
}

export function setSafetyToken(token: string): void {
  localStorage.setItem(SAFETY_TOKEN_KEY, token)
}

export function clearSafetyToken(): void {
  localStorage.removeItem(SAFETY_TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const demoToken   = DEMO_MODE ? getDemoToken() : null
  const safetyToken = getSafetyToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: DEMO_MODE ? 'omit' : 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(DISTRICT_SUBDOMAIN ? { 'X-District-Subdomain': DISTRICT_SUBDOMAIN } : {}),
      ...(demoToken    ? { Authorization: `Bearer ${demoToken}` } : {}),
      ...(safetyToken  ? { 'X-Safety-Token': safetyToken }        : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
