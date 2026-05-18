import { api, DEMO_MODE } from './client'

const base = DEMO_MODE ? '/demo/safety' : '/admin/safety'

export interface SafetyRequestCodeResponse {
  sent:          boolean
  email?:        string
  dev_bypass?:   boolean
  safety_token?: string
}

export interface SafetyVerifyResponse {
  verified:    boolean
  verified_at: string
}

export interface SafetyEndSessionResponse {
  ended:            boolean
  duration_seconds: number | null
}

export interface ChatMessage {
  id:          number
  content:     string
  sender_name: string
  sender_role: string
  sent_at:     string
  flagged:     boolean
  flag_action: string | null
  deleted:     boolean
}

export interface ChatChannel {
  channel_id:   number
  channel_name: string
  channel_type: string
  sport:        string | null
  season:       string | null
  messages:     ChatMessage[]
}

export interface ChatStudentResult {
  student_id:   number
  student_name: string
  channels:     ChatChannel[]
}

export interface ChatSearchResponse {
  results:             ChatStudentResult[]
  members_not_found?:  string[]
  searched_from:       string
  searched_to:         string
  keyword:             string | null
  total_messages:      number
}

export interface ChatSearchParams {
  student_names: string[]
  from:          string
  to:            string
  keyword?:      string
}

export const requestSafetyCode = (password: string) =>
  api.post<SafetyRequestCodeResponse>(`${base}/request_code`, { password })

export const verifySafetyCode = (code: string) =>
  api.post<SafetyVerifyResponse>(`${base}/verify`, { code })

export const endSafetySession = (reason: 'manual' | 'inactivity') =>
  api.post<SafetyEndSessionResponse>(`${base}/end_session`, { reason })

export interface SafetyAuditDbEvent {
  id:               number
  event_type:       'safety_accessed' | 'safety_exited' | 'chat_searched'
  occurred_at:      string
  notes:            string | null
  reason:           string | null
  duration_seconds: number | null
  accessor_role:    string | null
  student_names:    string[] | null
  keyword:          string | null
}

export const searchChats = (params: ChatSearchParams) =>
  api.post<ChatSearchResponse>(`${base}/chats/search`, {
    student_names: params.student_names,
    from:          params.from,
    to:            params.to,
    keyword:       params.keyword ?? null,
  })

export const fetchSafetyAuditEvents = () =>
  api.get<SafetyAuditDbEvent[]>(`${base}/audit_events`)

export interface FlagConversationParams {
  student_name: string
  channel_id:   number
  channel_name: string
  note:         string
  notify:       ('ad' | 'school_admin')[]
}

export const flagConversation = (params: FlagConversationParams) =>
  api.post<{ ok: boolean; notified: string[] }>(`${base}/flag_conversation`, params)
