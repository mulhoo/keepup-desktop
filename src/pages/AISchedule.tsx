import { useState } from 'react'
import { format, addDays, addMonths, nextMonday } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Loader2, CalendarPlus, AlertTriangle, Clock, History } from 'lucide-react'
import { fetchSports, sportDisplayName, type Sport, type SportGender } from '@/api/sports'
import { createCalendarEvent } from '@/api/calendar'
import { fetchVenues, fmt12h, facilityTypeForSport, type Venue, type DayOfWeek } from '@/api/venues'
import { cn } from '@/lib/utils'


interface MatchRecord {
  schoolAId: number
  schoolBId: number
  sportName: string
  season:    string
  scoreA:    number
  scoreB:    number
}

const MATCH_HISTORY: MatchRecord[] = [
  { schoolAId: 1, schoolBId: 2, sportName: 'Swimming', season: '2024-25', scoreA: 156, scoreB: 112 },
  { schoolAId: 2, schoolBId: 3, sportName: 'Swimming', season: '2023-24', scoreA: 134, scoreB: 128 },
]

function getHistory(a: Sport, b: Sport): MatchRecord | null {
  return MATCH_HISTORY.find(h =>
    h.sportName === a.name && (
      (h.schoolAId === a.school_id && h.schoolBId === b.school_id) ||
      (h.schoolAId === b.school_id && h.schoolBId === a.school_id)
    )
  ) ?? null
}

function pairScore(a: Sport, b: Sport, h: MatchRecord | null): number {
  const crossDiv = a.division !== b.division ? 10 : 0
  if (!h) return 0 + crossDiv
  const diff = Math.abs(h.scoreA - h.scoreB)
  if (diff > 40) return 3 + crossDiv
  return (h.season === '2024-25' ? 2 : 1) + crossDiv
}


interface GeneratedMatchup {
  key:         string
  homeTeam:    Sport
  awayTeam:    Sport
  date:        Date
  venue:       string
  venueSource: 'registered' | 'manual'
  startTime:   string
  endTime:     string
  isCrossDiv:  boolean
  history:     MatchRecord | null
}

function generateMatchups(
  teams: Sport[],
  startDate: string,
  endDate: string,
  venues: Venue[],
): GeneratedMatchup[] {
  if (teams.length < 2) return []

  const start = nextMonday(new Date(`${startDate}T12:00:00`))
  const end   = new Date(`${endDate}T12:00:00`)

  const weekStarts: Date[] = []
  let cur = start
  while (cur < end) { weekStarts.push(cur); cur = addDays(cur, 7) }
  if (weekStarts.length === 0) return []

  const pairs: [Sport, Sport][] = []
  for (let i = 0; i < teams.length; i++)
    for (let j = i + 1; j < teams.length; j++)
      pairs.push([teams[i], teams[j]])

  pairs.sort((p, q) =>
    pairScore(p[0], p[1], getHistory(p[0], p[1])) -
    pairScore(q[0], q[1], getHistory(q[0], q[1]))
  )

  const homeTracker: Record<string, number> = {}
  return weekStarts.map((weekStart, week) => {
    const pair    = pairs[week % pairs.length]
    const pairKey = [pair[0].school_id, pair[1].school_id].sort().join('-')
    const [home, away] = homeTracker[pairKey] === pair[0].school_id
      ? [pair[1], pair[0]]
      : [pair[0], pair[1]]
    homeTracker[pairKey] = home.school_id

    // Look up home team's venue for this sport and find a valid day in this week
    const requiredFacility = facilityTypeForSport(teams[0]?.name ?? '')
    const homeVenue = venues.find(v => v.school_id === home.school_id && v.facility_type === requiredFacility)
    let matchDate:   Date   = weekStart
    let startTime:   string = '15:00'
    let endTime:     string = '18:00'
    let venueSource: 'registered' | 'manual' = 'manual'
    let venueName:   string = ''

    if (homeVenue) {
      venueName = homeVenue.name
      for (let d = 0; d < 7; d++) {
        const candidate = addDays(weekStart, d)
        if (candidate >= end) break
        const dow = candidate.getDay() as DayOfWeek
        const window = homeVenue.availability.find(a => a.days.includes(dow))
        if (window) {
          matchDate   = candidate
          startTime   = window.start_time
          endTime     = window.end_time
          venueSource = 'registered'
          break
        }
      }
    }

    return {
      key: `${pairKey}-${week}`,
      homeTeam: home, awayTeam: away,
      date: matchDate, venue: venueName, venueSource,
      startTime, endTime,
      isCrossDiv: home.division !== away.division,
      history: getHistory(home, away),
    }
  })
}


function DivBadge({ division }: { division?: string }) {
  if (!division) return null
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
      {division}
    </span>
  )
}

function HistorySignal({ history, isCrossDiv }: { history: MatchRecord | null; isCrossDiv: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs mt-1.5">
      {isCrossDiv && (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />Cross-division matchup
        </span>
      )}
      {!history ? (
        <span className="flex items-center gap-1 text-primary">
          <Sparkles className="w-3 h-3" />First time meeting
        </span>
      ) : (
        <span className={cn(
          'flex items-center gap-1',
          Math.abs(history.scoreA - history.scoreB) > 40
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-muted-foreground'
        )}>
          <History className="w-3 h-3" />
          Last played {history.season} · {Math.abs(history.scoreA - history.scoreB)} pt margin
          {Math.abs(history.scoreA - history.scoreB) > 40 && ' — large gap'}
        </span>
      )}
    </div>
  )
}


export default function AISchedule() {
  const qc = useQueryClient()

  const { data: allSports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn:  () => fetchSports(),
  })

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn:  fetchVenues,
  })

  const commissionerSports = allSports.filter(s =>
    s.commissioner !== null && s.school_year === '2025-26'
  )

  // Group by sport name (family), with gender as the variant key within each family
  const sportFamilies = commissionerSports.reduce<
    Record<string, { name: string; gender: SportGender; teams: Sport[] }[]>
  >((acc, s) => {
    if (!acc[s.name]) acc[s.name] = []
    let group = acc[s.name].find(g => g.gender === s.gender)
    if (!group) { group = { name: s.name, gender: s.gender, teams: [] }; acc[s.name].push(group) }
    group.teams.push(s)
    return acc
  }, {})

  const allSportGroups = Object.values(sportFamilies).flat()
  const firstKey = allSportGroups[0] ? sportDisplayName(allSportGroups[0]) : ''

  const [selectedSport, setSelectedSport] = useState(firstKey)
  const [startDate,     setStartDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate,       setEndDate]       = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'))
  const [matchups,      setMatchups]      = useState<GeneratedMatchup[] | null>(null)
  const [generating,    setGenerating]    = useState(false)
  const [adding,        setAdding]        = useState(false)
  const [addedCount,    setAddedCount]    = useState(0)

  const selectedGroup = allSportGroups.find(g => sportDisplayName(g) === selectedSport)

  function onSportChange(name: string) {
    setSelectedSport(name)
    setMatchups(null)
    setAddedCount(0)
  }

  function updateVenue(key: string, venue: string) {
    setMatchups(prev => prev?.map(m => m.key === key ? { ...m, venue } : m) ?? null)
  }

  async function handleGenerate() {
    if (!selectedGroup) return
    setGenerating(true)
    setMatchups(null)
    setAddedCount(0)
    await new Promise(r => setTimeout(r, 800))
    setMatchups(generateMatchups(selectedGroup.teams, startDate, endDate, venues))
    setGenerating(false)
  }

  async function handleAddToCalendar() {
    if (!matchups) return
    setAdding(true)
    let count = 0
    for (const m of matchups) {
      await createCalendarEvent(m.homeTeam.id, {
        title: `vs ${m.awayTeam.school_name}`,
        event_type: 'meet', home_away: 'home',
        location: m.venue, opponent: m.awayTeam.school_name,
        starts_at: `${format(m.date, 'yyyy-MM-dd')}T${m.startTime}:00`,
        ends_at:   `${format(m.date, 'yyyy-MM-dd')}T${m.endTime}:00`,
        notes: '', status: 'scheduled',
      })
      await createCalendarEvent(m.awayTeam.id, {
        title: `vs ${m.homeTeam.school_name}`,
        event_type: 'meet', home_away: 'away',
        location: m.venue, opponent: m.homeTeam.school_name,
        starts_at: `${format(m.date, 'yyyy-MM-dd')}T${m.startTime}:00`,
        ends_at:   `${format(m.date, 'yyyy-MM-dd')}T${m.endTime}:00`,
        notes: '', status: 'scheduled',
      })
      count++
      setAddedCount(count)
    }
    qc.invalidateQueries({ queryKey: ['schedule'] })
    qc.invalidateQueries({ queryKey: ['calendar'] })
    setAdding(false)
  }

  const totalEvents = (matchups?.length ?? 0) * 2

  return (
    <div className="px-10 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Schedule Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI suggests matchups based on division, history, and fairness. You set the venue for each event.
        </p>
      </div>

      {/* Regular schedule */}
      <div className="rounded-lg border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold">Regular season</h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Sport</label>
          <select
            value={selectedSport}
            onChange={e => onSportChange(e.target.value)}
            className="w-64 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {Object.entries(sportFamilies).map(([family, variants]) =>
              variants.length > 1 ? (
                <optgroup key={family} label={family}>
                  {variants.map(v => (
                    <option key={sportDisplayName(v)} value={sportDisplayName(v)}>
                      {v.gender === 'girls' ? 'Girls' : v.gender === 'boys' ? 'Boys' : 'Co-ed'}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={sportDisplayName(variants[0])} value={sportDisplayName(variants[0])}>
                  {sportDisplayName(variants[0])}
                </option>
              )
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Season start</label>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setMatchups(null); setAddedCount(0) }}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Season end</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => { setEndDate(e.target.value); setMatchups(null); setAddedCount(0) }}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {selectedGroup && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Teams in conference</p>
            <div className="flex flex-wrap gap-2">
              {selectedGroup.teams.map(t => (
                <span key={t.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {t.school_name}
                  <DivBadge division={t.division} />
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || !selectedGroup || selectedGroup.teams.length < 2 || !startDate || !endDate || endDate <= startDate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
            : <><Sparkles className="w-4 h-4" />Generate Matchups</>
          }
        </button>
      </div>

      {/* Matchup preview */}
      {matchups && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Review matchups</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {matchups.length} matchups · {totalEvents} total calendar events. Set the venue for each.
              </p>
            </div>
            {addedCount === matchups.length && matchups.length > 0 ? (
              <span className="text-xs text-green-600 font-medium px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-900/20">
                ✓ Added {totalEvents} events to calendars
              </span>
            ) : (
              <button
                onClick={handleAddToCalendar}
                disabled={adding || matchups.length === 0}
                className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {adding
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Adding {addedCount}/{matchups.length}…</>
                  : <><CalendarPlus className="w-4 h-4" />Add {totalEvents} events to calendars</>
                }
              </button>
            )}
          </div>

          {matchups.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No meet slots fit in the selected date range. Try a longer season.
            </div>
          ) : (
            <div className="space-y-3">
              {matchups.map(m => (
                <div
                  key={m.key}
                  className={cn(
                    'border rounded-lg p-4 bg-card space-y-3',
                    m.isCrossDiv && 'border-amber-300 dark:border-amber-700',
                  )}
                >
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-2">
                      {format(m.date, 'EEE, MMM d')}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <DivBadge division={m.homeTeam.division} />
                        {m.homeTeam.school_name}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium px-1">vs</span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <DivBadge division={m.awayTeam.division} />
                        {m.awayTeam.school_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {m.homeTeam.school_name} hosts
                      </span>
                    </div>
                    <HistorySignal history={m.history} isCrossDiv={m.isCrossDiv} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground flex-none" />
                    <span className="text-xs text-muted-foreground">
                      {fmt12h(m.startTime)} – {fmt12h(m.endTime)}
                    </span>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <input
                      type="text"
                      value={m.venue}
                      onChange={e => updateVenue(m.key, e.target.value)}
                      placeholder="Enter venue / pool name…"
                      className="flex-1 text-xs border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                    />
                    {m.venueSource === 'registered' && (
                      <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-none">
                        from venues
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
