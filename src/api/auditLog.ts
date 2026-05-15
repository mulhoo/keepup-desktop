import { api } from './client'

export interface AuditEntry {
  id: number
  accessor_name: string
  accessor_role: string
  accessed_user_name: string
  resource_type: string
  reason: string
  school_name: string
  school_id: number
  sport_name?: string
  occurred_at: string
  anomaly_flagged: boolean
  anomaly_score?: number
  anomaly_reason?: string
}

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  return api.get<AuditEntry[]>('/demo/safety/audit_events')
}
