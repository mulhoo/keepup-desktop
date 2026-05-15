import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  format, parseISO,
  startOfMonth, endOfMonth, addMonths, subMonths,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
} from 'date-fns'
import { Clock, MapPin, RotateCcw } from 'lucide-react'
import { fetchSchedule, type ScheduleEvent } from '@/api/calendar'
import { useAuth } from '@/hooks/useAuth'
import { MonthNav } from '@/components/calendar/MonthNav'
import { ScheduleGrid } from '@/components/calendar/ScheduleGrid'
import { ScheduleWeek } from '@/components/calendar/ScheduleWeek'
import { EventTypeBadge, HomeAwayLabel, CancelledBadge, PostponedBadge, sportChipColor } from '@/components/calendar/EventBadges'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { cn } from '@/lib/utils'

export default function Calendar() {
  const { effectiveRole } = useAuth()
  const isCommissioner    = effectiveRole === 'sports_commissioner'
  const isAD              = effectiveRole === 'athletic_director'
  const isDistrictAdmin   = effectiveRole === 'district_admin'
  const isSchoolAdmin     = effectiveRole === 'school_admin'
  const canViewSchedule   = isDistrictAdmin || isSchoolAdmin || isAD || isCommissioner
  const canFilterBySchool = isDistrictAdmin || isCommissioner

  const [viewMode,     setViewMode]     = useState<ViewMode>('list')
  const [viewDate,     setViewDate]     = useState(new Date())
  const [sportFilter,  setSportFilter]  = useState<Set<string>>(new Set())
  const [schoolFilter, setSchoolFilter] = useState<Set<string>>(new Set())

  // Date range depends on view mode
  const weekStart = startOfWeek(viewDate)
  const weekEnd   = endOfWeek(viewDate)
  const from = viewMode === 'week'
    ? format(weekStart, 'yyyy-MM-dd')
    : format(startOfMonth(viewDate), 'yyyy-MM-dd')
  const to = viewMode === 'week'
    ? format(weekEnd, 'yyyy-MM-dd')
    : format(endOfMonth(viewDate), 'yyyy-MM-dd')

  const navLabel = viewMode === 'week'
    ? weekStart.getMonth() === weekEnd.getMonth()
      ? `${format(weekStart, 'MMM d')}–${format(weekEnd, 'd, yyyy')}`
      : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
    : format(viewDate, 'MMMM yyyy')
  const handlePrev = () => viewMode === 'week' ? setViewDate(subWeeks(viewDate, 1)) : setViewDate(subMonths(viewDate, 1))
  const handleNext = () => viewMode === 'week' ? setViewDate(addWeeks(viewDate, 1)) : setViewDate(addMonths(viewDate, 1))

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['schedule', from, to],
    queryFn:  () => fetchSchedule({ from, to }),
    enabled:  canViewSchedule,
  })

  const sportNames  = [...new Set(events.map(e => e.sport_name))].sort()
  const schoolNames = [...new Set(events.map(e => e.school_name))].sort()
  const hasFilters  = sportFilter.size > 0 || schoolFilter.size > 0

  const filtered = events.filter(e =>
    (sportFilter.size  === 0 || sportFilter.has(e.sport_name)) &&
    (schoolFilter.size === 0 || schoolFilter.has(e.school_name))
  )

  const byDate = new Map<string, ScheduleEvent[]>()
  for (const e of filtered) {
    const k = format(parseISO(e.starts_at), 'yyyy-MM-dd')
    if (!byDate.has(k)) byDate.set(k, [])
    byDate.get(k)!.push(e)
  }
  const dateKeys = [...byDate.keys()].sort()

  const showFilters = !isLoading && events.length > 0 && (sportNames.length > 1 || (canFilterBySchool && schoolNames.length > 1))

  return (
    <div className="px-10 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isCommissioner
              ? 'All events across sports you oversee.'
              : isDistrictAdmin
              ? 'All sports events across schools in your district.'
              : 'All sports events at your school.'}
          </p>
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Two-column body */}
      <div className="flex gap-8 items-start">

        {/* Main calendar area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Centered month/week nav */}
          <div className="flex justify-center">
            <MonthNav label={navLabel} onPrev={handlePrev} onNext={handleNext} />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg border bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <ScheduleGrid
              events={filtered}
              viewMonth={viewDate}
              sportNames={sportNames}
              activeFilter={null}
            />
          ) : viewMode === 'week' ? (
            <ScheduleWeek
              events={filtered}
              viewDate={viewDate}
              sportNames={sportNames}
            />
          ) : dateKeys.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No events in {format(viewDate, 'MMMM yyyy')}
                {sportFilter.size  > 0 ? ` for ${[...sportFilter].join(', ')}`  : ''}
                {schoolFilter.size > 0 ? ` at ${[...schoolFilter].join(', ')}` : ''}.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {dateKeys.map(dateKey => {
                const dayEvents = byDate.get(dateKey)!
                return (
                  <div key={dateKey}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {format(parseISO(dateKey), 'EEEE, MMMM d')}
                    </p>
                    <div className="space-y-2">
                      {dayEvents.map(event => {
                        const sportIdx = sportNames.indexOf(event.sport_name)
                        return (
                          <div
                            key={event.id}
                            className={cn('border rounded-lg p-4 bg-card', event.status === 'cancelled' && 'opacity-60')}
                          >
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', sportChipColor(sportIdx))}>
                                {event.sport_name}
                              </span>
                              {canFilterBySchool && (
                                <span className="text-[10px] text-muted-foreground">{event.school_name}</span>
                              )}
                              <EventTypeBadge type={event.event_type} />
                              <HomeAwayLabel ha={event.home_away} />
                              {event.status === 'cancelled' && <CancelledBadge />}
                              {event.status === 'postponed'  && <PostponedBadge />}
                            </div>
                            <p className={cn('font-medium text-sm', event.status === 'cancelled' && 'line-through text-muted-foreground')}>
                              {event.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {format(parseISO(event.starts_at), 'h:mm a')}
                                {event.ends_at && ` – ${format(parseISO(event.ends_at), 'h:mm a')}`}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            {event.notes && (
                              <p className="mt-1.5 text-xs text-muted-foreground border-l-2 pl-2">{event.notes}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Filter sidebar */}
        {showFilters && (
          <div className="w-48 shrink-0 space-y-3 pt-10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filters</p>

            {sportNames.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Sport</p>
                <MultiSelect
                  options={sportNames}
                  selected={sportFilter}
                  onChange={setSportFilter}
                  placeholder="All sports"
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {canFilterBySchool && schoolNames.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">School</p>
                <MultiSelect
                  options={schoolNames}
                  selected={schoolFilter}
                  onChange={setSchoolFilter}
                  placeholder="All schools"
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {hasFilters && (
              <button
                onClick={() => { setSportFilter(new Set()); setSchoolFilter(new Set()) }}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-[13px] h-[13px]" />
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
