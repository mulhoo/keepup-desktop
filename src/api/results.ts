import { api } from './client'

export interface AthleteEventResult {
  place: number
  athlete: string
  school: string
  time: string
  personal_best?: boolean
}

export interface EventResult {
  event: string
  results: AthleteEventResult[]
}

// pending_opponent  — uploaded; opposing team must confirm score
// pending_commissioner — both teams confirmed; commissioner must approve to publish
// published          — commissioner approved; qualification flags generated
export type ResultStatus = 'pending_opponent' | 'pending_commissioner' | 'published'

export type QualLevel = 'kingco' | 'districts_wildcard' | 'districts' | 'state'

export interface TimeStandard {
  event: string
  kingco?: string
  districts_wildcard?: string
  districts?: string
  state?: string
}

export interface QualificationFlag {
  id: number
  result_id: number
  athlete: string
  school: string
  event: string
  time: string
  level: QualLevel
  standard_time: string
  status: 'pending' | 'accepted'
}

export interface MeetResult {
  id: number
  date: string
  sport_name: string
  home_school: string
  home_school_id: number
  home_score: number
  away_school: string
  away_school_id: number
  away_score: number
  venue: string
  cross_division?: boolean
  events: EventResult[]
  ai_summary: string
  ai_standouts: string[]
  ai_focus?: string
  uploaded_by: string
  uploaded_at: string
  status: ResultStatus
}

export interface HighlightRow {
  athlete: string
  event: string
  time: string
  pr: boolean
}

export interface NewResultInput {
  date: string
  sport_id: number
  home_school: string
  home_school_id: number
  home_score: number
  away_school: string
  away_school_id: number
  away_score: number
  venue: string
  highlights: HighlightRow[]
  ai_summary: string
}

export interface ParsedMeet {
  meet_name: string
  date: string
  venue: string
  home_school: string
  home_score: number
  away_school: string
  away_score: number
}

export const SEASON_AI_INSIGHTS =
  "AHS Girls Swimming leads the division at 3–0, with all three wins showing measurable improvement across relay splits. Taylor Brooks is tracking toward a top-3 district finish in the 100 Butterfly; Alex Rivera is approaching her best-ever 100 Free. Baldwin is competitive in freestyle and backstroke — the rematch at AHS should be close. Crest's Maya Chen is the standout to watch in the IM ahead of qualifying; her times are competitive despite the 3A division. Recommend ensuring all three schools' athletes have qualifying times submitted to the district office by March 1."

export async function fetchAllResults(): Promise<MeetResult[]> {
  return api.get<MeetResult[]>('/demo/results')
}

export async function fetchTeamResults(schoolId: number): Promise<MeetResult[]> {
  return api.get<MeetResult[]>(`/demo/results/team?school_id=${schoolId}`)
}

export async function generateResultAiSummary(
  homeSchool: string,
  awaySchool: string,
  homeScore: number,
  awayScore: number,
  highlights: HighlightRow[]
): Promise<string> {
  const { summary } = await api.post<{ summary: string }>('/demo/results/generate_summary', {
    home_school: homeSchool,
    away_school: awaySchool,
    home_score:  homeScore,
    away_score:  awayScore,
    highlights,
  })
  return summary
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function parseMeetManagerPdf(_file?: File): Promise<ParsedMeet> {
  return api.post<ParsedMeet>('/demo/results/parse_pdf', {})
}

export async function submitMeetResult(input: NewResultInput): Promise<MeetResult> {
  return api.post<MeetResult>('/demo/results', {
    sport_id:       input.sport_id,
    home_school_id: input.home_school_id,
    away_school_id: input.away_school_id,
    date:           input.date,
    venue:          input.venue,
    home_score:     input.home_score,
    away_score:     input.away_score,
    ai_summary:     input.ai_summary,
    highlights:     input.highlights,
  })
}

export async function confirmResult(resultId: number): Promise<void> {
  await api.patch(`/demo/results/${resultId}/confirm`, {})
}

export async function approveResult(resultId: number): Promise<void> {
  await api.patch(`/demo/results/${resultId}/approve`, {})
}

export async function fetchQualificationFlags(): Promise<QualificationFlag[]> {
  return api.get<QualificationFlag[]>('/demo/qualification_flags')
}

export async function acceptQualificationFlag(flagId: number): Promise<void> {
  await api.patch(`/demo/qualification_flags/${flagId}/accept`, {})
}

export async function fetchTimeStandards(sportName: string): Promise<TimeStandard[]> {
  return api.get<TimeStandard[]>(`/demo/time_standards?sport_name=${encodeURIComponent(sportName)}`)
}

export async function saveTimeStandards(
  sportName: string,
  standards: TimeStandard[]
): Promise<void> {
  await api.post('/demo/time_standards/bulk_update', { sport_name: sportName, standards })
}
