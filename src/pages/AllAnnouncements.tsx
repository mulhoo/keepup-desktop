import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ArrowLeft, Megaphone, X } from 'lucide-react'
import { fetchAnnouncements, type Announcement, type AnnouncementSport } from '@/api/announcements'
import { useAuth } from '@/hooks/useAuth'
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

function SportPill({ sport }: { sport: AnnouncementSport }) {
  return (
    <span className={cn(
      'text-xs font-medium px-1.5 py-0.5 rounded',
      sport.gender === 'girls' ? 'text-pink-600 bg-pink-100 dark:bg-pink-950/40' :
      sport.gender === 'boys'  ? 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' :
                                 'text-muted-foreground bg-muted',
    )}>
      {sport.name}
    </span>
  )
}

function seasonLabel(sports: AnnouncementSport[]): string | null {
  if (sports.length < 2) return null
  const seasons = [...new Set(sports.map(s => s.athletic_season))]
  if (seasons.length !== 1 || !seasons[0]) return null
  return `${seasons[0].charAt(0).toUpperCase() + seasons[0].slice(1)} Sports`
}

function AnnouncementRow({ item, showSchool }: { item: Announcement; showSchool: boolean }) {
  const grouped  = seasonLabel(item.sports)
  const visible  = item.sports.slice(0, 5)
  const overflow = item.sports.length - 5
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

type Group = { label: string; items: Announcement[] }

function groupByTime(items: Announcement[]): Group[] {
  const now     = Date.now()
  const weekMs  = 7  * 24 * 60 * 60 * 1000
  const monthMs = 30 * 24 * 60 * 60 * 1000

  const buckets: Record<string, Announcement[]> = {}

  for (const a of items) {
    const age = now - new Date(a.created_at).getTime()
    let key: string
    if (age <= weekMs) {
      key = 'Last week'
    } else if (age <= monthMs) {
      key = 'Last month'
    } else {
      key = format(parseISO(a.created_at), 'MMMM yyyy')
    }
    ;(buckets[key] ??= []).push(a)
  }

  const result: Group[] = []
  if (buckets['Last week'])  result.push({ label: 'Last week',  items: buckets['Last week'] })
  if (buckets['Last month']) result.push({ label: 'Last month', items: buckets['Last month'] })

  Object.keys(buckets)
    .filter(k => k !== 'Last week' && k !== 'Last month')
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(k => result.push({ label: k, items: buckets[k] }))

  return result
}

export default function AllAnnouncements() {
  const { effectiveRole } = useAuth()
  const isDistrictLevel   = effectiveRole === 'district_admin' || effectiveRole === 'super_admin'
  const showSchool        = isDistrictLevel

  const { data, isLoading } = useQuery({
    queryKey:        ['announcements', 'all'],
    queryFn:         fetchAnnouncements,
    refetchInterval: 60_000,
  })
  const allAnnouncements = data?.sent ?? []

  const sportOptions = useMemo(() => {
    const map = new Map<number, AnnouncementSport>()
    allAnnouncements.forEach(a => a.sports.forEach(s => { if (!map.has(s.id)) map.set(s.id, s) }))
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [allAnnouncements])

  const [selectedSportIds, setSelectedSportIds] = useState<Set<number>>(new Set())
  const [startDate,        setStartDate]        = useState('')
  const [endDate,          setEndDate]          = useState('')

  function toggleSport(id: number) {
    const next = new Set(selectedSportIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedSportIds(next)
  }

  const filtered = useMemo(() => {
    let result = allAnnouncements
    if (selectedSportIds.size > 0)
      result = result.filter(a => a.sports.some(s => selectedSportIds.has(s.id)))
    if (startDate) {
      const start = startOfDay(parseISO(startDate))
      result = result.filter(a => new Date(a.created_at) >= start)
    }
    if (endDate) {
      const end = endOfDay(parseISO(endDate))
      result = result.filter(a => new Date(a.created_at) <= end)
    }
    return result
  }, [allAnnouncements, selectedSportIds, startDate, endDate])

  const grouped  = useMemo(() => groupByTime(filtered), [filtered])
  const hasFilter = selectedSportIds.size > 0 || !!startDate || !!endDate

  function clearFilters() {
    setSelectedSportIds(new Set())
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-3xl space-y-6">
      <Link
        to="/dashboard/announcements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Announcements
      </Link>

      <div>
        <h1 className="text-2xl font-bold">All Announcements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Full history across all your teams.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filter</p>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Date range</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-xs border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => setEndDate(e.target.value)}
              className="text-xs border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {!endDate && startDate && (
              <span className="text-xs text-muted-foreground italic">no end date = all time from start</span>
            )}
          </div>
        </div>

        {/* Sport pills */}
        {sportOptions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Sport</p>
            <div className="flex flex-wrap gap-1.5">
              {sportOptions.map(s => {
                const active = selectedSportIds.has(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSport(s.id)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      active
                        ? s.gender === 'girls'
                          ? 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-950/40 dark:border-pink-800 dark:text-pink-400'
                          : s.gender === 'boys'
                            ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400'
                            : 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border text-muted-foreground',
                    )}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {hasFilter && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} announcement{filtered.length !== 1 ? 's' : ''} match{filtered.length === 1 ? 'es' : ''} your filters
          </p>
        )}
      </div>

      {/* Grouped feed */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-12">
          {hasFilter ? 'No announcements match your filters.' : 'No announcements yet.'}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                {group.label}
              </h2>
              <div className="rounded-xl border bg-card divide-y">
                {group.items.map(a => (
                  <AnnouncementRow key={a.id} item={a} showSchool={showSchool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
