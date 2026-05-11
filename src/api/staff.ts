import { api } from './client'

export type StaffRole = 'school_admin' | 'athletic_director' | 'head_coach' | 'assistant_coach'

export interface StaffMember {
  id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  role: StaffRole
  school_id: number | null
  school_name: string | null
  active: boolean
}

export interface DistrictSettings {
  id: number
  name: string
  email_domain: string | null
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  school_admin:      'School Admin',
  athletic_director: 'Athletic Director',
  head_coach:        'Head Coach',
  assistant_coach:   'Assistant Coach',
}

// Roles each manager type can create
export const CREATABLE_BY: Record<string, StaffRole[]> = {
  district_admin:    ['school_admin', 'athletic_director', 'head_coach', 'assistant_coach'],
  school_admin:      ['athletic_director', 'head_coach', 'assistant_coach'],
  athletic_director: ['head_coach', 'assistant_coach'],
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const res = await api.get<{ staff: StaffMember[] }>('/admin/staff')
  return res.staff
}

export async function createStaffMember(data: {
  first_name: string
  last_name: string
  email: string
  role: StaffRole
  school_id?: number
  password?: string
}): Promise<StaffMember> {
  return api.post<StaffMember>('/admin/staff', data)
}

export async function updateStaffMember(id: number, data: {
  first_name?: string
  last_name?: string
  email?: string
}): Promise<StaffMember> {
  return api.patch<StaffMember>(`/admin/staff/${id}`, data)
}

export async function removeStaffMember(id: number): Promise<void> {
  return api.delete(`/admin/staff/${id}`)
}

export async function fetchDistrictSettings(): Promise<DistrictSettings> {
  return api.get<DistrictSettings>('/admin/district')
}

export async function updateDistrictSettings(data: { email_domain: string }): Promise<DistrictSettings> {
  return api.patch<DistrictSettings>('/admin/district', data)
}
