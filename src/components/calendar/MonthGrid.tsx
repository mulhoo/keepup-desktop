import { useState } from 'react'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { Clock, MapPin, Pencil, Trash2, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { annotateEvent, type CalendarEvent } from '@/api/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  eventTypeClass, EventTypeBadge, HomeAwayBadge,
  CancelledBadge, PostponedBadge,
} from './EventBadges'
import { cn } from '@/lib/utils'

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']


interface EventPillProps {
  event:       CalendarEvent
  sportId:     number
  canEdit:     boolean
  isHeadCoach: boolean
  onEdit:      (e: CalendarEvent) => void
  onDelete:    (e: CalendarEvent) => void
}

function EventPill({ event, sportId, canEdit, isHeadCoach, onEdit, onDelete }: EventPillProps) {
  const [warmup, setWarmup] = useState(
    event.annotation?.warmup_time ? format(parseISO(event.annotation.warmup_time), "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [notes,  setNotes]  = useState(event.annotation?.team_notes ?? '')
  const [saved,  setSaved]  = useState(false)
  const qc = useQueryClient()

  const { mutate: saveAnnotation, isPending: annotating } = useMutation({
    mutationFn: () => annotateEvent(event.id, { warmup_time: warmup || null, team_notes: notes || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', sportId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={ev => ev.stopPropagation()}
          className={cn(
            'w-full text-left text-[10px] px-1 py-0.5 rounded truncate leading-tight transition-opacity hover:opacity-80',
            eventTypeClass(event.event_type),
            event.status === 'cancelled' && 'opacity-50 line-through',
          )}
        >
          {event.title}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 overflow-hidden" onClick={ev => ev.stopPropagation()}>
        {/* Event summary */}
        <div className="p-3 space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            <EventTypeBadge type={event.event_type} />
            <HomeAwayBadge ha={event.home_away} />
            {event.status === 'cancelled' && <CancelledBadge />}
            {event.status === 'postponed'  && <PostponedBadge />}
          </div>
          <p className={cn('font-semibold text-sm leading-snug', event.status === 'cancelled' && 'line-through text-muted-foreground')}>
            {event.title}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 flex-none" />
              {format(parseISO(event.starts_at), 'h:mm a')}
              {event.ends_at && ` – ${format(parseISO(event.ends_at), 'h:mm a')}`}
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-none" />
                {event.location}
              </div>
            )}
          </div>
          {event.notes && (
            <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">{event.notes}</p>
          )}
          {canEdit && (
            <div className="flex gap-3 pt-1 border-t">
              <button
                onClick={ev => { ev.stopPropagation(); onEdit(event) }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={ev => { ev.stopPropagation(); onDelete(event) }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Head coach annotation */}
        {isHeadCoach && (
          <div className="border-t bg-muted/30 p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Team details</p>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Warmup time</label>
              <input
                type="datetime-local"
                value={warmup}
                onChange={e => setWarmup(e.target.value)}
                onClick={ev => ev.stopPropagation()}
                className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Team notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onClick={ev => ev.stopPropagation()}
                rows={2}
                placeholder="e.g. Bus leaves east lot at 1:30 PM"
                className="w-full border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <button
              onClick={ev => { ev.stopPropagation(); saveAnnotation() }}
              disabled={annotating}
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? 'Saved!' : annotating ? 'Saving…' : 'Save details'}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}


export interface MonthGridProps {
  events:       CalendarEvent[]
  viewMonth:    Date
  sportId:      number
  canEdit:      boolean
  isHeadCoach:  boolean
  onEdit:       (e: CalendarEvent) => void
  onDelete:     (e: CalendarEvent) => void
  onAddForDate: (dateStr: string) => void
}

export function MonthGrid({
  events, viewMonth, sportId, canEdit, isHeadCoach, onEdit, onDelete, onAddForDate,
}: MonthGridProps) {
  const firstDay    = startOfMonth(viewMonth)
  const daysInMonth = endOfMonth(viewMonth).getDate()
  const startDow    = firstDay.getDay()
  const today       = format(new Date(), 'yyyy-MM-dd')

  const cells: Array<Date | null> = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const byDay: Record<string, CalendarEvent[]> = {}
  for (const e of events) {
    const k = e.starts_at.slice(0, 10)
    if (!byDay[k]) byDay[k] = []
    byDay[k].push(e)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground pb-1.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-t rounded-lg overflow-hidden">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={i} className="border-r border-b bg-muted/20 min-h-[90px]" />
          }

          const dateStr   = format(date, 'yyyy-MM-dd')
          const isToday   = dateStr === today
          const dayEvents = byDay[dateStr] ?? []

          return (
            <div
              key={i}
              onClick={() => canEdit && onAddForDate(dateStr)}
              className={cn(
                'border-r border-b min-h-[90px] p-1.5 transition-colors',
                canEdit ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default',
              )}
            >
              <div className="flex justify-end mb-1">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground/70',
                )}>
                  {date.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <EventPill
                    key={e.id}
                    event={e}
                    sportId={sportId}
                    canEdit={canEdit}
                    isHeadCoach={isHeadCoach}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1 font-medium">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
