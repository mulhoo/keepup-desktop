import { api } from './client'

export interface Activity {
  id: number
  event_type: 'message_flagged' | 'data_accessed'
  occurred_at: string
  summary: string
  actor: { name: string } | null
  tier: string | null
  sport: string | null
  season: string | null
  channel: string | null
  flag_action: string | null
  flag_reason: string | null
  accessed_user_name: string | null
  accessor_role: string | null
  parents_notified_at: string | null
  ad_notified_at: string | null
  ad_notified_name: string | null
  district_notified_at: string | null
  district_notified_by_name: string | null
  district_notified_by_role: string | null
  peer_notified_name: string | null
}

export interface NotifyResponse {
  notified_at: string
}

export const fetchActivities = () =>
  api.get<Activity[]>('/demo/activities')

export const notifyParents = (id: number) =>
  api.post<NotifyResponse>(`/demo/activities/${id}/notify_parents`, {})

export const notifyAD = (id: number) =>
  api.post<NotifyResponse>(`/demo/activities/${id}/notify_ad`, {})

export const notifyDistrictAdmin = (id: number) =>
  api.post<NotifyResponse>(`/demo/activities/${id}/notify_district_admin`, {})
