import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, isSameMonth, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { fetchSportDetail, sportDisplayName } from '@/api/sports'
import { fetchCalendarEvents, type CalendarEvent } from '@/api/calendar'
import { useAuth } from '@/hooks/useAuth'
import { MonthNav } from '@/components/calendar/MonthNav'
import { EventCard } from '@/components/calendar/EventCard'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import { EventFormDialog, DeleteConfirm } from '@/components/calendar/EventFormDialog'
import { ViewToggle } from '@/components/ui/ViewToggle'

type ViewMode = 'list' | 'grid'

export default function TeamCalendar() {
  const { sportId } = useParams<{ sportId: string }>()
  const { effectiveRole } = useAuth()
  const numericSportId = Number(sportId)

  const isHeadCoach    = effectiveRole === 'head_coach'
  const isCommissioner = effectiveRole === 'sports_commissioner'
  const canEdit        = isCommissioner

  const [viewMode,  setViewMode]  = useState<ViewMode>('list')
  const [viewMonth, setViewMonth] = useState(new Date())
  const [addOpen,   setAddOpen]   = useState(false)
  const [addDate,   setAddDate]   = useState<string | undefined>()
  const [editing,   setEditing]   = useState<CalendarEvent | null>(null)
  const [deleting,  setDeleting]  = useState<CalendarEvent | null>(null)

  const { data: sport } = useQuery({
    queryKey: ['sport', numericSportId],
    queryFn:  () => fetchSportDetail(numericSportId),
    enabled:  !!sportId,
  })

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', numericSportId],
    queryFn:  () => fetchCalendarEvents(numericSportId),
    enabled:  !!sportId,
  })

  const monthEvents = events
    .filter(e => isSameMonth(parseISO(e.starts_at), viewMonth))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  // Group list view events by date
  const byDate = new Map<string, CalendarEvent[]>()
  for (const e of monthEvents) {
    const k = format(parseISO(e.starts_at), 'yyyy-MM-dd')
    if (!byDate.has(k)) byDate.set(k, [])
    byDate.get(k)!.push(e)
  }
  const dateKeys = [...byDate.keys()].sort()

  const futureMonths = [...new Set(events.map(e => e.starts_at.slice(0, 7)))]
    .sort()
    .filter(k => k > format(viewMonth, 'yyyy-MM'))

  function openAdd(dateStr?: string) {
    setAddDate(dateStr)
    setAddOpen(true)
  }

  return (
    <div className="px-10 py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sport ? `${sportDisplayName(sport)} schedule and events.` : 'Team schedule and events.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => openAdd()}
              className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add event
            </button>
          )}
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <MonthNav month={viewMonth} onChange={setViewMonth} />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <MonthGrid
          events={monthEvents}
          viewMonth={viewMonth}
          sportId={numericSportId}
          canEdit={canEdit}
          isHeadCoach={isHeadCoach}
          
          onEdit={setEditing}
          onDelete={setDeleting}
          onAddForDate={openAdd}
        />
      ) : monthEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">No events in {format(viewMonth, 'MMMM yyyy')}.</p>
          {canEdit && (
            <button onClick={() => openAdd()} className="mt-2 text-sm text-primary hover:underline">
              Add the first event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {dateKeys.map(dateKey => (
            <div key={dateKey}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {format(parseISO(dateKey), 'EEEE, MMMM d')}
              </p>
              {byDate.get(dateKey)!.map(event => (
                <div key={event.id} className="mb-2 last:mb-0">
                  <EventCard
                    event={event}
                    sportId={numericSportId}
                    canEdit={canEdit}
                    isHeadCoach={isHeadCoach}
                    
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && futureMonths.length > 0 && (
        <div className="border-t pt-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
          {futureMonths.slice(0, 3).map(key => {
            const count = events.filter(e => e.starts_at.startsWith(key)).length
            return (
              <button
                key={key}
                onClick={() => setViewMonth(new Date(`${key}-01`))}
                className="flex items-center justify-between w-full text-sm px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <span>{format(new Date(`${key}-01`), 'MMMM yyyy')}</span>
                <span className="text-xs">{count} event{count !== 1 ? 's' : ''}</span>
              </button>
            )
          })}
        </div>
      )}

      {addOpen && (
        <EventFormDialog
          open
          onClose={() => { setAddOpen(false); setAddDate(undefined) }}
          sportId={numericSportId}
          editing={null}
          
          initialDate={addDate}
        />
      )}
      {editing && (
        <EventFormDialog
          open
          onClose={() => setEditing(null)}
          sportId={numericSportId}
          editing={editing}
          
        />
      )}
      {deleting && (
        <DeleteConfirm
          event={deleting}
          sportId={numericSportId}
          
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
