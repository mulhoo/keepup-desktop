import { api } from './client'

interface StaffMember { first_name: string; last_name: string; email: string }

export interface School {
  id: number
  name: string
  district_id: number
  district_name: string
  sport_count: number
  member_count: number
  principal?: StaffMember
  athletic_director?: StaffMember
}

export async function fetchSchools(): Promise<School[]> {
  return api.get<School[]>('/demo/schools')
}

export async function fetchSchool(schoolId: number): Promise<School> {
  return api.get<School>(`/demo/schools/${schoolId}`)
}
