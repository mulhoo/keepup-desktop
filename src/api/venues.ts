import { api } from './client'

export type DayOfWeek    = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type FacilityType = 'pool' | 'gym' | 'field' | 'track' | 'other'

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
}

export const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]

export const FACILITY_LABELS: Record<FacilityType, string> = {
  pool:  'Pool',
  gym:   'Gym',
  field: 'Field',
  track: 'Track',
  other: 'Other',
}

const SPORT_FACILITY_MAP: Array<{ keywords: string[]; facility: FacilityType }> = [
  { keywords: [ 'swim', 'polo' ],                           facility: 'pool'  },
  { keywords: [ 'basketball', 'volleyball' ],               facility: 'gym'   },
  { keywords: [ 'soccer', 'football', 'lacrosse' ],         facility: 'field' },
  { keywords: [ 'track', 'cross country', 'cross-country' ], facility: 'track' },
]

export function facilityTypeForSport(sportName: string): FacilityType {
  const lower = sportName.toLowerCase()
  for (const { keywords, facility } of SPORT_FACILITY_MAP) {
    if (keywords.some(k => lower.includes(k))) return facility
  }
  return 'other'
}

export interface AvailabilityWindow {
  id:         string
  days:       DayOfWeek[]
  start_time: string
  end_time:   string
}

export interface Venue {
  id:                 number
  name:               string
  school_id:          number
  school_name:        string
  facility_type:      FacilityType
  address:            string
  availability:       AvailabilityWindow[]
  temporarily_closed: boolean
  closed_reason:      string
}

export interface VenueFormData {
  name:          string
  school_id:     number
  school_name:   string
  facility_type: FacilityType
  address:       string
  availability:  AvailabilityWindow[]
}

export function fmt12h(t: string): string {
  const [ h, m ] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function formatWindowDays(days: DayOfWeek[]): string {
  return [ ...days ].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map(d => DAY_LABELS[d]).join(' · ')
}

export function findAlternativeVenue(
  date: Date,
  facilityType: FacilityType,
  venues: Venue[],
  excludeId: number,
): Venue | null {
  const dow = date.getDay() as DayOfWeek
  return venues.find(v =>
    v.id !== excludeId &&
    v.facility_type === facilityType &&
    !v.temporarily_closed &&
    v.availability.some(w => w.days.includes(dow))
  ) ?? null
}

export async function fetchVenues(): Promise<Venue[]> {
  return api.get<Venue[]>('/demo/venues')
}

export async function createVenue(data: VenueFormData): Promise<Venue> {
  return api.post<Venue>('/demo/venues', { ...data, availability: data.availability })
}

export async function updateVenue(id: number, data: Partial<VenueFormData>): Promise<Venue> {
  return api.patch<Venue>(`/demo/venues/${id}`, { ...data })
}

export async function deleteVenue(id: number): Promise<void> {
  await api.delete(`/demo/venues/${id}`)
}

export async function setVenueClosedStatus(
  id: number,
  closed: boolean,
  reason = '',
): Promise<Venue> {
  return api.patch<Venue>(`/demo/venues/${id}/set_closed`, { closed, reason })
}
