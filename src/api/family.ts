import { api } from './client'

export interface ChildCoach {
  name: string
  role: 'head_coach' | 'assistant_coach'
}

export interface ChildAnnouncement {
  id: number
  content: string
  sender_name: string
  sent_at: string
}

export interface ChildSport {
  season_id: number
  sport_name: string
  level: string
  school_name: string
  season_name: string
  athletic_season: 'fall' | 'winter' | 'spring'
  coaches: ChildCoach[]
  recent_announcements: ChildAnnouncement[]
}

export interface Child {
  id: number
  first_name: string
  last_name: string
  sports: ChildSport[]
}

export async function fetchFamily(): Promise<Child[]> {
  return api.get<Child[]>('/demo/family')
}

// All non-child participants are anonymized server-side to "Student".
// These types intentionally carry no identifying information for other parties.

export interface ParentMessage {
  id:       number
  content:  string
  sender:   string
  sent_at:  string
  is_child: boolean
}

export type ConversationAccess =
  | { type: 'staff' }
  | { type: 'flagged' }
  | { type: 'approved'; expires_at: string; approved_by: string | null }
  | { type: 'locked' }

export interface ParentConversation {
  id:                number
  other_participant: { name: string; staff_role: string | null }
  access:            ConversationAccess
  last_message:      ParentMessage | null
  messages:          ParentMessage[]
}

export interface AccessRequest {
  id:          number
  status:      'pending' | 'approved' | 'denied'
  child_id:    number
  expires_at:  string | null
  reviewed_by: string | null
}

export interface ChildChats {
  child_id:         number
  child_name:       string
  child_first_name: string
  access_request:   AccessRequest | null
  conversations:    ParentConversation[]
}

export interface AdViewRequest {
  id:          number
  status:      'pending' | 'approved' | 'denied'
  parent_name: string
  child_name:  string
  reason:      string
  created_at:  string
  expires_at:  string | null
}

export async function fetchFamilyChats(): Promise<ChildChats[]> {
  return api.get<ChildChats[]>('/demo/family/chats')
}

export async function createViewRequest(child_id: number, reason: string): Promise<AccessRequest> {
  return api.post<AccessRequest>('/demo/parent-view-requests', { child_id, reason })
}

export async function fetchAdViewRequests(): Promise<AdViewRequest[]> {
  return api.get<AdViewRequest[]>('/demo/parent-view-requests')
}

export async function approveViewRequest(id: number): Promise<AdViewRequest> {
  return api.patch<AdViewRequest>(`/demo/parent-view-requests/${id}/approve`, {})
}

export async function denyViewRequest(id: number): Promise<AdViewRequest> {
  return api.patch<AdViewRequest>(`/demo/parent-view-requests/${id}/deny`, {})
}
