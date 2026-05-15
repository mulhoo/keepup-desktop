import { api } from './client'
import type { SportGender } from './sports'

export interface Announcement {
  id:          number
  content:     string
  sender:      { id: number; name: string }
  sport_name:  string
  gender:      SportGender
  school_name: string
  created_at:  string
}

export interface SendAnnouncementParams {
  content:          string
  sport_ids?:       number[]
  school_ids?:      number[]
  athletic_season?: string
}

export interface SendAnnouncementResult {
  sent_count: number
  sports:     string[]
}

export const fetchAnnouncements = () =>
  api.get<Announcement[]>('/demo/announcements')

export const sendAnnouncement = (params: SendAnnouncementParams) =>
  api.post<SendAnnouncementResult>('/demo/announcements', params)
