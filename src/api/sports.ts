export type MemberRole = 'head_coach' | 'assistant_coach' | 'student_captain' | 'student'

export interface ParentContact {
  name: string
  email: string
  phone?: string
  relationship?: string
}

export interface SportMember {
  user_id:       number
  first_name:    string
  last_name:     string
  role:          MemberRole
  email?:        string
  phone?:        string
  dob?:          string | null
  jersey_number?: string | null
  grade?:        string | null
  level?:        string | null
  position?:     string | null
  is_captain?:   boolean
  graduated?:    boolean
  parents?:      ParentContact[]
}

export interface SportMemberUpdate {
  dob?:          string
  jersey_number?: string
  grade?:        string
  level?:        string
  position?:     string
  is_captain?:   boolean
}

export interface SportCoach {
  id: number
  first_name: string
  last_name: string
  role: 'head_coach' | 'assistant_coach'
}

export interface SportCommissioner {
  id: number
  first_name: string
  last_name: string
  email: string
}

export type SchoolDivision = '4A' | '3A' | '2A' | '1A'
export type SportGender    = 'girls' | 'boys' | 'coed'

export interface SportRecord {
  wins: number
  losses: number
  ties?: number
}

export interface Sport {
  id: number
  name: string
  gender: SportGender
  school_id: number
  school_name: string
  division?: SchoolDivision
  district_id?: number
  sport_template_id?: number
  season: 'fall' | 'winter' | 'spring'
  school_year: string
  status: 'active' | 'completed' | 'pending'
  athlete_count: number
  coaches: SportCoach[]
  commissioner: SportCommissioner | null
  levels: string[]
  record?: SportRecord
  home_venue?: string
  notes?: string
}

export function sportDisplayName(sport: Pick<Sport, 'name' | 'gender'>): string {
  if (sport.gender === 'girls') return `Girls ${sport.name}`
  if (sport.gender === 'boys')  return `Boys ${sport.name}`
  return sport.name
}

export interface SportDetail extends Sport {
  members: SportMember[]
}

// Demo coach identity map — keyed by demoRole, then sportId → role held in that sport.
// head_coach  demo = Chris Nguyen  (coach.swim@ahs.edu):
//   - HC of Girls Swimming, AHS  (sport 1)
//   - Asst Coach of Boys Swimming, BHS (sport 9) — same Hajos district
// assistant_coach demo = Dana Patel (asst.swim@ahs.edu):
//   - Asst of Girls Swimming, AHS (sport 1)
export const DEMO_COACH_SPORTS: Partial<Record<string, Record<number, 'head_coach' | 'assistant_coach'>>> = {
  head_coach:      { 1: 'head_coach', 9: 'assistant_coach' },
  assistant_coach: { 1: 'assistant_coach' },
}

// API-layer normalization: mock data stores full names ("Girls Swimming").
// fetchSports strips the gender prefix → name becomes "Swimming", gender becomes "girls".
const GENDER_RE = /^(Girls?|Boys?|Co-?ed|Women'?s?|Men'?s?|Mixed)\s+/i

function normalizeSport<T extends { name: string }>(s: T): T & { name: string; gender: SportGender } {
  const match = s.name.match(GENDER_RE)?.[1]?.toLowerCase() ?? ''
  const gender: SportGender =
    match.startsWith('girl') || match.startsWith('women') ? 'girls' :
    match.startsWith('boy')  || match.startsWith('men')   ? 'boys'  : 'coed'
  const name = s.name.replace(GENDER_RE, '').trim()
  return { ...s, name, gender }
}


export async function fetchSports(): Promise<Sport[]> {
  const sports = await api.get<Sport[]>('/admin/sports')
  return sports.map(s => normalizeSport(s))
}

export async function fetchSportDetail(sportId: number): Promise<SportDetail> {
  const sport = await api.get<SportDetail>(`/admin/sports/${sportId}`)
  return normalizeSport(sport)
}


import { api } from './client'

export async function fetchAdminSports(): Promise<Sport[]> {
  return api.get<Sport[]>('/admin/sports')
}

export async function setCommissioner(sportId: number, email: string): Promise<Sport> {
  return api.patch<Sport>(`/admin/sports/${sportId}/set_commissioner`, { email })
}

export async function removeCommissioner(sportId: number): Promise<Sport> {
  return api.delete<Sport>(`/admin/sports/${sportId}/remove_commissioner`)
}

export async function updateMember(sportId: number, userId: number, data: SportMemberUpdate): Promise<SportMember> {
  return api.patch<SportMember>(`/admin/sports/${sportId}/members/${userId}`, data)
}

export async function purgeStudentData(userId: number): Promise<void> {
  return api.delete(`/admin/students/${userId}`)
}

export async function updateSportLevels(sportId: number, levels: string[]): Promise<Sport> {
  return api.patch<Sport>(`/admin/sports/${sportId}/update_levels`, { levels })
}
