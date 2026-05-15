import { api } from './client'

export interface AppNotification {
  id:                string
  notification_type: string
  title:             string
  body:              string | null
  read:              boolean
  read_at:           string | null
  created_at:        string
  metadata:          Record<string, unknown>
}

export const fetchNotifications = () =>
  api.get<AppNotification[]>('/demo/notifications')

export const markNotificationRead = (id: string) =>
  api.patch<AppNotification>(`/demo/notifications/${id}`, {})

export const markAllNotificationsRead = () =>
  api.patch<{ ok: boolean }>('/demo/notifications/mark_all_read', {})
