import { api, setDemoToken, clearDemoToken } from './client'

export interface SessionUser {
  id: number
  first_name: string
  last_name: string
  email: string
  theme: Record<string, string> | null
  managing_role?: string | null
}

export interface LoginResponse {
  token?: string
  expires_in?: number
  demo?: boolean
  role?: string
  user: SessionUser
}

export const DEMO_ROLES = [
  { key: 'district_admin',    label: 'District Admin',    description: 'Hajos School District' },
  { key: 'school_admin',      label: 'School Admin',      description: 'Alfred High School' },
  { key: 'athletic_director', label: 'Athletic Director', description: 'Alfred High School' },
  { key: 'head_coach',        label: 'Head Coach',        description: 'Varsity Swimming' },
  { key: 'assistant_coach',   label: 'Assistant Coach',   description: 'Varsity Swimming' },
  { key: 'student',           label: 'Student',           description: 'Varsity Swimming' },
  { key: 'parent',            label: 'Parent',            description: 'Alfred High School' },
] as const

export type DemoRole = typeof DEMO_ROLES[number]['key']

export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/session', { email, password })
}

export async function loginAsDemo(role: DemoRole): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/demo/session', { role })
  if (res.token) setDemoToken(res.token)
  return res
}

export async function logout(): Promise<void> {
  await api.delete('/auth/session').catch(() => {})
}

export async function resetDemoData(): Promise<void> {
  await api.post('/demo/reset').catch(() => {})
}

export async function resetDemo(): Promise<void> {
  await resetDemoData()
  clearDemoToken()
  await api.delete('/demo/session').catch(() => {})
}

export async function getCurrentUser(): Promise<{ user: SessionUser }> {
  return api.get<{ user: SessionUser }>('/auth/session')
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/auth/password_reset', { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.patch('/auth/password_reset', { token, password })
}

export function getMicrosoftAuthUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  return `${base}/auth/microsoft`
}
