import { api } from './client'
import type { SportGender } from './sports'

export interface AnnouncementSport {
  id:              number
  name:            string
  gender:          SportGender
  school_name:     string
  athletic_season: string | null
}

export interface Announcement {
  id:           number
  content:      string
  sender:       { id: number; name: string }
  sports:       AnnouncementSport[]
  school_name:  string
  created_at:   string
  scheduled_at: string | null
}

export interface AnnouncementsResponse {
  sent:      Announcement[]
  scheduled: Announcement[]
}

export interface SendAnnouncementParams {
  content:          string
  sport_ids?:       number[]
  school_ids?:      number[]
  athletic_season?: string
  scheduled_at?:    string
}

export interface SendAnnouncementResult {
  sent_count:   number
  sports:       string[]
  label:        string
  scheduled_at: string | null
}

export const fetchAnnouncements = () =>
  api.get<AnnouncementsResponse>('/demo/announcements')

export const sendAnnouncement = (params: SendAnnouncementParams) =>
  api.post<SendAnnouncementResult>('/demo/announcements', params)
