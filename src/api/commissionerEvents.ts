import { api } from './client'

export type CommissionerEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'postponed'
export type CommissionerEventType   = 'meet' | 'tournament' | 'other'

export interface EventTeam {
  sport_id:    number
  school_id:   number
  school_name: string
  team_name:   string
}

export interface MatchupPair {
  home_school_id: number
  away_school_id: number
}

export interface EventCoach {
  name:        string
  role:        'head_coach' | 'assistant_coach'
  email:       string
  school_name: string
}

export interface CommissionerEvent {
  id:             number
  title:          string
  event_type:     CommissionerEventType
  sport_name:     string
  starts_at:      string
  ends_at:        string
  venue:          string
  teams:          EventTeam[]
  matchup_pairs:  MatchupPair[]
  coaches:        EventCoach[]
  status:         CommissionerEventStatus
  has_results:    boolean
  result_summary?: string
  notes:          string
}

export interface EditEventInput {
  title?:         string
  starts_at?:     string
  ends_at?:       string
  venue?:         string
  status?:        CommissionerEventStatus
  notes?:         string
  matchup_pairs?: MatchupPair[]
}

export function coachesForEvent(event: CommissionerEvent): EventCoach[] {
  return event.coaches
}

export async function fetchCommissionerEvents(): Promise<CommissionerEvent[]> {
  return api.get<CommissionerEvent[]>('/demo/commissioner_events')
}

export async function updateCommissionerEvent(
  id: number,
  input: EditEventInput,
): Promise<CommissionerEvent> {
  return api.patch<CommissionerEvent>(`/demo/commissioner_events/${id}`, input)
}

export async function sendEventNotifications(id: number): Promise<void> {
  await api.post(`/demo/commissioner_events/${id}/notify`, {})
}
