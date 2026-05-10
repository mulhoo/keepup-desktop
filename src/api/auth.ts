import { api, setToken } from './client'

export interface SessionUser {
  id: number
  first_name: string
  last_name: string
  email: string
  theme: Record<string, string>
}

export interface LoginResponse {
  token: string
  expires_in: number
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
  { key: 'student_captain',   label: 'Student Captain',   description: 'Varsity Swimming' },
  { key: 'student',           label: 'Student',           description: 'Varsity Swimming' },
  { key: 'parent',            label: 'Parent',            description: 'Alfred High School' },
] as const

export type DemoRole = typeof DEMO_ROLES[number]['key']

export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/session', { email, password })
  setToken(res.token)
  return res
}

export async function loginAsDemo(role: DemoRole): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/demo/session', { role })
  setToken(res.token)
  return res
}

export async function logout(): Promise<void> {
  await api.delete('/auth/session').catch(() => {})
}
