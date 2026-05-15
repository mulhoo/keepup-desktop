import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Clock, MapPin, Pencil, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { annotateEvent, type CalendarEvent } from '@/api/calendar'
import { EventTypeBadge, HomeAwayBadge, CancelledBadge, PostponedBadge } from './EventBadges'
import { cn } from '@/lib/utils'


function AnnotationSection({ event, sportId }: { event: CalendarEvent; sportId: number }) {
  const [open, setOpen]     = useState(false)
  const [warmup, setWarmup] = useState(
    event.annotation?.warmup_time ? format(parseISO(event.annotation.warmup_time), "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [notes,  setNotes]  = useState(event.annotation?.team_notes ?? '')
  const [saved,  setSaved]  = useState(false)
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => annotateEvent(event.id, { warmup_time: warmup || null, team_notes: notes || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', sportId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const hasAnnotation = event.annotation && (event.annotation.warmup_time || event.annotation.team_notes)

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Team details
        {hasAnnotation && (
          <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Saved</span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Warmup time
            </label>
            <input
              type="datetime-local"
              value={warmup}
              onChange={e => setWarmup(e.target.value)}
              className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Team notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Bus leaves from east lot at 1:30 PM"
              className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save details'}
          </button>
        </div>
      )}
    </div>
  )
}


export interface EventCardProps {
  event:       CalendarEvent
  sportId:     number
  canEdit:     boolean
  isHeadCoach: boolean
  onEdit:      (e: CalendarEvent) => void
  onDelete:    (e: CalendarEvent) => void
}

export function EventCard({ event, sportId, canEdit, isHeadCoach, onEdit, onDelete }: EventCardProps) {
  const isCancelled = event.status === 'cancelled'
  const isPostponed = event.status === 'postponed'

  return (
    <div className={cn('border rounded-lg p-4 bg-card', isCancelled && 'opacity-60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <EventTypeBadge type={event.event_type} />
            <HomeAwayBadge ha={event.home_away} />
            {isCancelled && <CancelledBadge />}
            {isPostponed  && <PostponedBadge />}
          </div>
          <p className={cn('font-medium text-sm', isCancelled && 'line-through text-muted-foreground')}>
            {event.title}
          </p>
          <div className="mt-1.5 space-y-0.5">
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
            <p className="mt-2 text-xs text-muted-foreground border-l-2 pl-2">{event.notes}</p>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-1 flex-none">
            <button
              onClick={() => onEdit(event)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(event)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isHeadCoach && <AnnotationSection event={event} sportId={sportId} />}
    </div>
  )
}
