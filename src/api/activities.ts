import { api } from './client'

export interface DemoChannel {
  id:           number
  name:         string
  channel_type: string
  sport:        string
  season:       string
}

export interface DemoMessageResult {
  message: { id: number; content: string; flag_action: string | null; flagged: boolean }
  moderation: {
    score:                 number
    tier:                  string
    flag_action:           string | null
    reason:                string | null
    visible_to_others:     boolean
    notifications_sent_to: Array<{ role: string; name: string }>
  }
}

export interface OnDeviceResult {
  score:   number
  tier:    'clear' | 'questionable' | 'severe'
  flagged: boolean
  source:  'gemma4' | 'keyword_fallback'
}

export const fetchDemoChannels = () =>
  api.get<DemoChannel[]>('/demo/channels')

export const sendDemoMessage = (channelId: number, content: string) =>
  api.post<DemoMessageResult>(`/demo/channels/${channelId}/messages`, { content })

export const moderateOnDevice = (content: string) =>
  api.post<OnDeviceResult>('/demo/moderate', { content })

export interface Activity {
  id: number
  event_type: 'message_flagged' | 'data_accessed' | 'parent_coach_concern'
  occurred_at: string
  summary: string
  actor: { name: string } | null
  tier: string | null
  sport: string | null
  school_name: string | null
  season: string | null
  channel: string | null
  flag_action:  string | null
  flag_reason:  string | null
  report_notes: string | null
  accessed_user_name: string | null
  accessor_role: string | null
  deleted_everywhere_at: string | null
  deleted_everywhere_count: number | null
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

export interface DeleteMessageResponse {
  deleted_count: number
  deleted_at:    string
}

export const deleteMessageEverywhere = (id: number) =>
  api.post<DeleteMessageResponse>(`/demo/activities/${id}/delete_message`, {})
