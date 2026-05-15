import { api } from './client'

export type EventType   = 'game' | 'meet' | 'practice' | 'tournament' | 'other'
export type HomeAway    = 'home' | 'away' | 'neutral'
export type EventStatus = 'scheduled' | 'cancelled' | 'postponed'

export interface EventAnnotation {
  warmup_time: string | null
  team_notes:  string | null
}

export interface CalendarEvent {
  id:         number
  sport_id:   number
  title:      string
  event_type: EventType
  home_away:  HomeAway
  location:   string | null
  opponent:   string | null
  starts_at:  string
  ends_at:    string | null
  notes:      string | null
  status:     EventStatus
  annotation: EventAnnotation | null
}

export interface ScheduleEvent extends CalendarEvent {
  sport_name:  string
  school_name: string
}

export interface EventFormData {
  title:      string
  event_type: EventType
  home_away:  HomeAway
  location:   string
  opponent:   string
  starts_at:  string
  ends_at:    string
  notes:      string
  status:     EventStatus
}

export async function fetchCalendarEvents(sportId: number): Promise<CalendarEvent[]> {
  return api.get<CalendarEvent[]>(`/admin/sports/${sportId}/calendar_events`)
}

export async function createCalendarEvent(
  sportId: number,
  data: Partial<EventFormData>,
): Promise<CalendarEvent> {
  return api.post<CalendarEvent>(`/admin/sports/${sportId}/calendar_events`, data)
}

export async function updateCalendarEvent(
  sportId: number,
  eventId: number,
  data: Partial<EventFormData>,
): Promise<CalendarEvent> {
  return api.patch<CalendarEvent>(`/admin/sports/${sportId}/calendar_events/${eventId}`, data)
}

export async function deleteCalendarEvent(sportId: number, eventId: number): Promise<void> {
  await api.delete(`/admin/sports/${sportId}/calendar_events/${eventId}`)
}

export async function annotateEvent(
  eventId: number,
  data: Partial<EventAnnotation>,
): Promise<EventAnnotation> {
  return api.patch<EventAnnotation>(`/admin/calendar_events/${eventId}/annotate`, data)
}

export async function fetchSchedule(
  params: { from: string; to: string; sport_template_ids?: number[] },
): Promise<ScheduleEvent[]> {
  const qs = new URLSearchParams({ from: params.from, to: params.to })
  params.sport_template_ids?.forEach(id => qs.append('sport_template_ids[]', String(id)))
  return api.get<ScheduleEvent[]>(`/admin/schedule?${qs}`)
}
