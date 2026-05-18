import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Send, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchSports, sportDisplayName } from '@/api/sports'
import {
  fetchAnnouncements,
  sendAnnouncement,
  type Announcement,
  type AnnouncementSport,
  type SendAnnouncementParams,
} from '@/api/announcements'
import { cn } from '@/lib/utils'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const ATHLETIC_SEASONS = [
  { value: 'fall',   label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
] as const

type AthlSeasonValue = typeof ATHLETIC_SEASONS[number]['value']

function Checkmark() {
  return (
    <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1,4 4,7 9,1" />
    </svg>
  )
}

function SportCheckbox({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 text-left text-xs px-2 py-1 rounded-lg border transition-colors w-full',
        checked
          ? 'bg-primary/15 border-primary/50 text-foreground'
          : 'bg-card hover:bg-secondary border-border text-muted-foreground hover:text-foreground',
      )}
    >
      <div className={cn(
        'w-4 h-4 rounded border flex items-center justify-center flex-none transition-colors',
        checked ? 'bg-primary border-primary' : 'border-border',
      )}>
        {checked && <Checkmark />}
      </div>
      <span className="truncate">{label}</span>
    </button>
  )
}

function SportPill({ sport }: { sport: AnnouncementSport }) {
  return (
    <span className={cn(
      'text-xs font-medium px-1.5 py-0.5 rounded',
      sport.gender === 'girls' ? 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/50' :
      sport.gender === 'boys'  ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50' :
                                 'text-muted-foreground bg-muted',
    )}>
      {sport.name}
    </span>
  )
}

const MAX_PILLS = 5

function seasonLabel(sports: Announcement['sports']): string | null {
  if (sports.length < 2) return null
  const seasons = [...new Set(sports.map(s => s.athletic_season))]
  if (seasons.length !== 1 || !seasons[0]) return null
  return `${seasons[0].charAt(0).toUpperCase() + seasons[0].slice(1)} Sports`
}

function AnnouncementRow({ item, showSchool }: { item: Announcement; showSchool: boolean }) {
  const grouped = seasonLabel(item.sports)
  const visible  = item.sports.slice(0, MAX_PILLS)
  const overflow = item.sports.length - MAX_PILLS
  return (
    <div className="px-5 py-4 flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-none mt-0.5">
        <Megaphone className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {grouped ? (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {grouped}
            </span>
          ) : (
            <>
              {visible.map(s => <SportPill key={s.id} sport={s} />)}
              {overflow > 0 && (
                <span className="text-xs text-muted-foreground">+{overflow} more</span>
              )}
            </>
          )}
          {showSchool && item.school_name && (
            <span className="text-xs text-muted-foreground">· {item.school_name}</span>
          )}
        </div>
        <p className="text-sm leading-snug">{item.content}</p>
        <p className="text-xs text-muted-foreground">
          {item.sender.name} · {timeAgo(item.created_at)}
        </p>
      </div>
    </div>
  )
}

export default function Announcements() {
  const { user, effectiveRole } = useAuth()
  const qc = useQueryClient()

  const isDistrictLevel = effectiveRole === 'district_admin' || effectiveRole === 'super_admin'
  const isCoach         = effectiveRole === 'head_coach' || effectiveRole === 'assistant_coach'

  const { data: sports = [] } = useQuery({
    queryKey:  ['sports'],
    queryFn:   fetchSports,
    staleTime: 5 * 60_000,
  })

  const { data: announcementsData, isLoading: loadingFeed } = useQuery({
    queryKey:        ['announcements', 'all'],
    queryFn:         fetchAnnouncements,
    refetchInterval: 60_000,
  })
  const announcements = announcementsData?.sent ?? []

  const pickerSports = useMemo(() => {
    if (!isCoach || !user?.id) return sports
    return sports.filter(s => s.coaches.some(c => c.id === user.id))
  }, [sports, isCoach, user?.id])

  const schools = useMemo(() => {
    if (!isDistrictLevel) return []
    const map = new Map<number, { id: number; name: string }>()
    sports.forEach(s => map.set(s.school_id, { id: s.school_id, name: s.school_name }))
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [sports, isDistrictLevel])

  const [showAllSports,   setShowAllSports]   = useState(false)
  const [showAllSchools,  setShowAllSchools]  = useState(false)

  // Empty Set = "All Sports" mode (no sport_ids filter sent to backend)
  const [selectedSportIds,     setSelectedSportIds]     = useState<Set<number>>(new Set())
  const [selectedSchoolIds,    setSelectedSchoolIds]    = useState<Set<number>>(new Set())
  const [athleticSeasonFilter, setAthleticSeasonFilter] = useState<AthlSeasonValue | null>(null)

  const visibleSports = useMemo(() => {
    let s = pickerSports
    if (selectedSchoolIds.size > 0) s = s.filter(sp => selectedSchoolIds.has(sp.school_id))
    if (athleticSeasonFilter)        s = s.filter(sp => sp.season === athleticSeasonFilter)
    return s
  }, [pickerSports, selectedSchoolIds, athleticSeasonFilter])

  const allMode = selectedSportIds.size === 0

  function toggleSport(id: number) {
    const next = new Set(selectedSportIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedSportIds(next)
  }

  function selectAll() {
    setSelectedSportIds(new Set())  // empty = "all"
  }

  function toggleSchool(id: number) {
    const next = new Set(selectedSchoolIds)
    if (next.has(id)) {
      next.delete(id)
      const removed = new Set(pickerSports.filter(s => s.school_id === id).map(s => s.id))
      const nextSports = new Set(selectedSportIds)
      removed.forEach(sid => nextSports.delete(sid))
      setSelectedSportIds(nextSports)
    } else {
      next.add(id)
    }
    setSelectedSchoolIds(next)
  }

  const [content,    setContent]    = useState('')
  const [sentResult, setSentResult] = useState<{ label: string } | null>(null)

  const { mutate: doSend, isPending: sending } = useMutation({
    mutationFn: sendAnnouncement,
    onSuccess: (result) => {
      setSentResult({ label: result.label })
      setContent('')
      setSelectedSportIds(new Set())
      setSelectedSchoolIds(new Set())
      setAthleticSeasonFilter(null)
      qc.invalidateQueries({ queryKey: ['announcements'] })  // invalidates both team + all queries
      setTimeout(() => setSentResult(null), 6000)
    },
  })

  function handleSend() {
    if (!content.trim() || sending) return
    setSentResult(null)

    const params: SendAnnouncementParams = { content: content.trim() }

    if (selectedSportIds.size > 0) {
      params.sport_ids = [...selectedSportIds]
    } else {
      if (selectedSchoolIds.size > 0) params.school_ids      = [...selectedSchoolIds]
      if (athleticSeasonFilter)        params.athletic_season = athleticSeasonFilter
    }

    doSend(params)
  }

  const showSchool = isDistrictLevel || schools.length > 1

  const sendLabel = allMode
    ? athleticSeasonFilter
      ? `All ${athleticSeasonFilter} sports`
      : isCoach
        ? 'Your team'
        : 'All sports'
    : `${selectedSportIds.size} sport${selectedSportIds.size > 1 ? 's' : ''}`

  return (
    <div className="px-10 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Post to one or more teams' announcement channels.
        </p>
      </div>

      <div className="grid grid-cols-[3fr_2fr] gap-6 items-start">

      {/* Composer */}
      <div className="rounded-xl border bg-card divide-y">

        {/* Targeting */}
        <div className="px-3 py-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Send to</p>

          {isDistrictLevel && schools.length > 1 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Schools</p>
              <div className="space-y-0.5">
                <div className="grid grid-cols-3 gap-0.5">
                  {/* All schools — first cell */}
                  <button
                    onClick={() => { setSelectedSchoolIds(new Set()); setSelectedSportIds(new Set()) }}
                    className={cn(
                      'flex items-center gap-2 text-left text-xs px-2 py-1 rounded-lg border transition-colors w-full',
                      selectedSchoolIds.size === 0
                        ? 'bg-primary/15 border-primary/50 text-foreground'
                        : 'bg-card hover:bg-secondary border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center flex-none transition-colors',
                      selectedSchoolIds.size === 0 ? 'bg-primary border-primary' : 'border-muted-foreground/40',
                    )}>
                      {selectedSchoolIds.size === 0 && <Checkmark />}
                    </div>
                    <span className="truncate">All schools</span>
                  </button>

                  {/* Individual schools */}
                  {(showAllSchools ? schools : schools.slice(0, 5)).map(sch => {
                    const active = selectedSchoolIds.has(sch.id)
                    return (
                      <button
                        key={sch.id}
                        onClick={() => toggleSchool(sch.id)}
                        className={cn(
                          'flex items-center gap-2 text-left text-xs px-2 py-1 rounded-lg border transition-colors w-full',
                          active
                            ? 'bg-primary/15 border-primary/50 text-foreground'
                            : 'bg-card hover:bg-secondary border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center flex-none transition-colors',
                          active ? 'bg-primary border-primary' : 'border-muted-foreground/40',
                        )}>
                          {active && <Checkmark />}
                        </div>
                        <span className="truncate">{sch.name}</span>
                      </button>
                    )
                  })}
                </div>

                {schools.length > 5 && (
                  <button
                    onClick={() => setShowAllSchools(v => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAllSchools
                      ? <><ChevronUp className="w-3 h-3" />Show less</>
                      : <><ChevronDown className="w-3 h-3" />{schools.length - 5} more schools</>
                    }
                  </button>
                )}
              </div>
            </div>
          )}

          {!isCoach && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Filter by season</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAthleticSeasonFilter(null)}
                  className={cn('text-xs px-3 py-1 rounded-full border transition-colors', !athleticSeasonFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-secondary border-border text-muted-foreground hover:text-foreground')}
                >
                  All seasons
                </button>
                {ATHLETIC_SEASONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setAthleticSeasonFilter(v => v === value ? null : value)}
                    className={cn('text-xs px-3 py-1 rounded-full border transition-colors', athleticSeasonFilter === value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-secondary border-border text-muted-foreground hover:text-foreground')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Sports</p>
            {visibleSports.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No sports available.</p>
            ) : (
              <div className="space-y-0.5">
                <div className="grid grid-cols-3 gap-0.5">
                  {!isCoach && visibleSports.length > 1 && (
                    <SportCheckbox
                      checked={allMode}
                      label={athleticSeasonFilter ? `All ${athleticSeasonFilter}` : 'All sports'}
                      onClick={selectAll}
                    />
                  )}
                  {(showAllSports ? visibleSports : visibleSports.slice(0, isCoach ? 6 : 5)).map(sp => (
                    <SportCheckbox
                      key={sp.id}
                      checked={!allMode && selectedSportIds.has(sp.id)}
                      label={sportDisplayName(sp)}
                      onClick={() => toggleSport(sp.id)}
                    />
                  ))}
                </div>
                {visibleSports.length > (isCoach ? 6 : 5) && (
                  <button
                    onClick={() => setShowAllSports(v => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAllSports
                      ? <><ChevronUp className="w-3 h-3" />Show less</>
                      : <><ChevronDown className="w-3 h-3" />{visibleSports.length - (isCoach ? 6 : 5)} more sports</>
                    }
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message textarea */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your announcement…"
            rows={4}
            className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-violet-500 flex-none" />
            <span>Content moderated by Gemma 4</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Sending to: <span className="font-medium text-foreground">{sendLabel}</span>
            </p>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                content.trim() && !sending
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>

        {/* Success banner */}
        {sentResult && (
          <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/40 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-none mt-0.5" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Sent to <span className="font-semibold">{sentResult.label}</span>
            </p>
          </div>
        )}
      </div>

      {/* Recent announcements — sidebar */}
      <div className="sticky top-6">
        <div className="rounded-xl bg-card border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent</h2>
            {announcements.length > 0 && (
              <Link to="all" className="text-xs text-primary hover:underline">View all →</Link>
            )}
          </div>

          {loadingFeed ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>
          ) : announcements.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Nothing sent yet.</p>
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 5).map(a => {
                const grouped  = seasonLabel(a.sports)
                const visible  = a.sports.slice(0, 2)
                const overflow = a.sports.length - 2
                return (
                  <div key={a.id} className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-1.5">
                    <div className="flex gap-1 flex-wrap">
                      {grouped ? (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{grouped}</span>
                      ) : (
                        <>
                          {visible.map(s => <SportPill key={s.id} sport={s} />)}
                          {overflow > 0 && <span className="text-xs text-muted-foreground">+{overflow}</span>}
                        </>
                      )}
                    </div>
                    <p className="text-xs leading-snug line-clamp-2">{a.content}</p>
                    <p className="text-xs text-muted-foreground">{a.sender.name} · {timeAgo(a.created_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  )
}
