import { api, setDemoToken, clearDemoToken, setDemoRole, clearDemoRole, DEMO_MODE, getDemoRole } from './client'

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
  { key: 'district_admin',    label: 'District Admin',    description: 'Hajos School District', blurb: 'Monitor activity across every school and respond to district-wide alerts' },
  { key: 'school_admin',      label: 'School Admin',      description: 'Alfred High School',    blurb: 'Oversee school-wide communication, staff access, and compliance reporting' },
  { key: 'athletic_director', label: 'Athletic Director', description: 'Alfred High School',    blurb: 'Manage all sports programs and review flagged messages across your school' },
  { key: 'head_coach',        label: 'Head Coach',        description: 'Varsity Swimming',      blurb: 'Send announcements, manage your roster, and monitor team conversations' },
  { key: 'assistant_coach',   label: 'Assistant Coach',   description: 'Varsity Swimming',      blurb: 'Support your coaching staff with team communication and scheduling' },
  { key: 'student',           label: 'Student',           description: 'Varsity Swimming',      blurb: 'View your team\'s schedule, results, and coach announcements' },
  { key: 'parent',            label: 'Parent',            description: 'Alfred High School',    blurb: 'Stay connected to your athlete\'s team through official school channels' },
] as const

export type DemoRole = typeof DEMO_ROLES[number]['key']

export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/session', { email, password })
}

export async function loginAsDemo(role: DemoRole): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/demo/session', { role })
  if (res.token) setDemoToken(res.token)
  setDemoRole(role)
  return res
}

export async function logout(): Promise<void> {
  await api.delete('/auth/session').catch(() => {})
}

export async function resetDemoData(): Promise<void> {
  await api.post('/demo/reset', {}).catch(() => {})
}

export async function resetDemo(): Promise<void> {
  await resetDemoData()
  clearDemoToken()
  clearDemoRole()
  await api.delete('/demo/session').catch(() => {})
}

export async function getCurrentUser(): Promise<{ user: SessionUser }> {
  if (DEMO_MODE) {
    const data = await api.get<SessionUser>('/demo/me')
    return { user: { ...data, managing_role: getDemoRole() } }
  }
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
