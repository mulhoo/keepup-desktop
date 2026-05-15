import { api } from './client'

export type StaffRole = 'school_admin' | 'athletic_director' | 'head_coach' | 'assistant_coach'

export interface DistrictSettings {
  id: number
  name: string
  email_domain: string | null
}

export interface StaffMember {
  id:          number   // institution role ID
  user_id:     number
  first_name:  string
  last_name:   string
  email:       string
  role:        StaffRole
  school_id:   number
  school_name: string | null
  active:      boolean
  start_date:  string        // ISO date — official start date set by admin
  end_date:    string | null // ISO date — departure date; null if still active
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  school_admin:      'School Admin',
  athletic_director: 'Athletic Director',
  head_coach:        'Head Coach',
  assistant_coach:   'Asst. Coach',
}

// Roles each manager type can create
export const CREATABLE_BY: Record<string, StaffRole[]> = {
  district_admin:    ['school_admin', 'athletic_director', 'head_coach', 'assistant_coach'],
  school_admin:      ['athletic_director', 'head_coach', 'assistant_coach'],
  athletic_director: ['head_coach', 'assistant_coach'],
}

export async function fetchStaff(): Promise<{ staff: StaffMember[] }> {
  return api.get<{ staff: StaffMember[] }>('/admin/staff')
}

export async function inviteStaff(data: {
  first_name:  string
  last_name:   string
  email:       string
  phone?:      string
  role:        StaffRole
  start_date:  string
  sport_id?:   number
  school_id?:  number
}): Promise<StaffMember> {
  return api.post<StaffMember>('/admin/staff', data)
}

export async function updateUser(roleId: number, data: {
  first_name?: string
  last_name?:  string
  email?:      string
  start_date?: string
  end_date?:   string | null
}): Promise<StaffMember> {
  return api.patch<StaffMember>(`/admin/staff/${roleId}`, data)
}

export async function archiveCoach(roleId: number): Promise<void> {
  return api.delete(`/admin/staff/${roleId}`)
}

export async function restoreStaff(roleId: number): Promise<StaffMember> {
  return api.patch<StaffMember>(`/admin/staff/${roleId}/restore`, {})
}

export async function assignSport(roleId: number, sportId: number): Promise<StaffMember> {
  return api.patch<StaffMember>(`/admin/staff/${roleId}/assign_sport`, { sport_id: sportId })
}

export async function fetchDistrictSettings(): Promise<DistrictSettings> {
  return api.get<DistrictSettings>('/admin/district')
}

export async function updateDistrictSettings(data: { email_domain: string }): Promise<DistrictSettings> {
  return api.patch<DistrictSettings>('/admin/district', data)
}
