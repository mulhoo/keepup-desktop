import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { Clock, MapPin } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { type ScheduleEvent } from '@/api/calendar'
import {
  EventTypeBadge, HomeAwayLabel,
  CancelledBadge, PostponedBadge, sportChipColor,
} from './EventBadges'
import { cn } from '@/lib/utils'

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']


interface ScheduleEventPillProps {
  event:      ScheduleEvent
  sportIdx:   number
  sportNames: string[]
}

function ScheduleEventPill({ event, sportIdx, sportNames }: ScheduleEventPillProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={ev => ev.stopPropagation()}
          className={cn(
            'w-full text-left text-[10px] px-1 py-0.5 rounded truncate leading-tight border transition-opacity hover:opacity-80',
            sportChipColor(sportIdx),
            event.status === 'cancelled' && 'opacity-50 line-through',
          )}
        >
          {event.title}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-2.5" onClick={ev => ev.stopPropagation()}>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', sportChipColor(sportNames.indexOf(event.sport_name)))}>
            {event.sport_name}
          </span>
          <EventTypeBadge type={event.event_type} />
          <HomeAwayLabel ha={event.home_away} />
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
      </PopoverContent>
    </Popover>
  )
}


export interface ScheduleGridProps {
  events:       ScheduleEvent[]
  viewMonth:    Date
  sportNames:   string[]
  activeFilter: string | null
}

export function ScheduleGrid({ events, viewMonth, sportNames, activeFilter }: ScheduleGridProps) {
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

  const filtered = activeFilter ? events.filter(e => e.sport_name === activeFilter) : events
  const byDay: Record<string, ScheduleEvent[]> = {}
  for (const e of filtered) {
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
            <div key={i} className="border-r border-b min-h-[90px] p-1.5">
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
                  <ScheduleEventPill
                    key={e.id}
                    event={e}
                    sportIdx={sportNames.indexOf(e.sport_name)}
                    sportNames={sportNames}
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
