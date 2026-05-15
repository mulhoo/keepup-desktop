import { api } from './client'

interface MessageSender {
  id:   number
  name: string
}

interface MessageSport {
  id:          number
  name:        string
  gender:      string
  school_name: string
}

interface MessageChannel {
  id:   number
  name: string
}

export interface QuestionableMessage {
  type:             'questionable'
  id:               number
  content:          string
  flag_category:    string | null
  flag_reason:      string | null
  moderation_score: number | null
  sender:           MessageSender
  sport:            MessageSport | null
  channel:          MessageChannel
  sent_at:          string
  created_at:       string
}

export interface ChallengeItem {
  type:             'challenge'
  id:               number   // MessageChallenge id
  content:          string   // the blocked message content
  flag_reason:      string | null
  moderation_score: number | null
  sender:           MessageSender  // the challenger
  challenge_reason: string | null
  sport:            MessageSport | null
  channel:          MessageChannel
  sent_at:          string
  created_at:       string
}

export type FlaggedMessage = QuestionableMessage | ChallengeItem

export interface SignalStats {
  category:      string
  total:         number
  approved:      number
  approval_rate: number | null
}

export interface ReviewResult {
  ok:           boolean
  action_taken: 'approved' | 'rejected'
  message_id:   number
  signal_stats: SignalStats | null
}

export interface ChallengeResult {
  ok:     boolean
  action: 'upheld' | 'denied'
}

export const fetchFlaggedMessages = () =>
  api.get<FlaggedMessage[]>('/demo/flagged_messages')

export const reviewMessage = (id: number, action_taken: 'approved' | 'rejected') =>
  api.patch<ReviewResult>(`/demo/flagged_messages/${id}/review`, { action_taken })

export const upholdChallenge = (id: number) =>
  api.patch<ChallengeResult>(`/demo/message-challenges/${id}/uphold`, {})

export const denyChallenge = (id: number) =>
  api.patch<ChallengeResult>(`/demo/message-challenges/${id}/deny`, {})
