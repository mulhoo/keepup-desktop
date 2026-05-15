import { api } from './client'

export interface GroupMember {
  id:         number
  name:       string
  first_name: string
  role:       'parent' | 'student' | 'unknown'
}

export interface EligibleMember {
  id:        number
  name:      string
  role:      'parent' | 'student'
  child_ids: number[]
}

export interface ParentSeason {
  id:               number
  name:             string
  eligible_members: EligibleMember[]
}

export interface GroupMessage {
  id:          number
  content:     string
  sender:      string
  sender_id:   number
  flag_action: string | null
  created_at:  string
  indicator:   string | null
}

export interface FamilyGroup {
  id:           number
  name:         string
  season:       { id: number; name: string }
  member_count: number
  members:      GroupMember[]
  last_message: { content: string; sender: string; sent_at: string } | null
}

export interface FamilyGroupsResponse {
  groups:         FamilyGroup[]
  parent_seasons: ParentSeason[]
}

export const fetchFamilyGroups = () =>
  api.get<FamilyGroupsResponse>('/demo/family_groups')

export const createFamilyGroup = (data: { name: string; season_id: number; member_ids: number[] }) =>
  api.post<FamilyGroup>('/demo/family_groups', data)

export const fetchGroupMessages = (channelId: number) =>
  api.get<GroupMessage[]>(`/demo/channels/${channelId}/messages`)

export const sendGroupMessage = (channelId: number, content: string) =>
  api.post<{ message: GroupMessage }>(`/demo/channels/${channelId}/messages`, { content })
