import { parseDistrictSubdomain } from '@/lib/subdomain'
import { api, ApiError } from './client'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const DISTRICT_SUBDOMAIN = parseDistrictSubdomain()

export interface Season {
  id: number
  name: string
  school_year: string
  sport_name: string
  school_name: string
  status: string
}

export interface MappedRow {
  line:          number
  email:         string
  role:          'student' | 'parent'
  first_name:    string
  last_name:     string
  dob?:          string
  jersey_number?: string
  grade?:        string
  level?:        string
  position?:     string
}

export interface ImportResult {
  added: Array<{ email: string; name: string; role: string }>
  invited: Array<{ email: string; role: string }>
  errors: Array<{ line: number; email: string | null; reason: string }>
}

export interface InvitationDetails {
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  season_name: string
  school_year: string
  school_name: string
  sport_name: string
}


export async function fetchSeasons(): Promise<Season[]> {
  return api.get<Season[]>('/admin/seasons')
}

export async function importRoster(seasonId: number, rows: MappedRow[]): Promise<ImportResult> {
  const res = await fetch(`${BASE_URL}/admin/import`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(DISTRICT_SUBDOMAIN ? { 'X-District-Subdomain': DISTRICT_SUBDOMAIN } : {}),
    },
    body: JSON.stringify({ season_id: seasonId, rows }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Request failed')
  }
  return res.json()
}

export async function fetchInvitation(token: string): Promise<InvitationDetails> {
  const res = await fetch(`${BASE_URL}/invitations/${token}`, {
    headers: {
      ...(DISTRICT_SUBDOMAIN ? { 'X-District-Subdomain': DISTRICT_SUBDOMAIN } : {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Request failed')
  }
  return res.json()
}

export async function acceptInvitation(
  token: string,
  params: { first_name: string; last_name: string; password: string }
): Promise<{ token: string; user: { id: number; first_name: string; last_name: string; email: string } }> {
  const res = await fetch(`${BASE_URL}/invitations/${token}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(DISTRICT_SUBDOMAIN ? { 'X-District-Subdomain': DISTRICT_SUBDOMAIN } : {}),
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Request failed')
  }
  return res.json()
}
