import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { Clock, MapPin } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { type ScheduleEvent } from '@/api/calendar'
import { EventTypeBadge, HomeAwayLabel, CancelledBadge, PostponedBadge, sportChipColor } from './EventBadges'
import { cn } from '@/lib/utils'

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  events:     ScheduleEvent[]
  viewDate:   Date
  sportNames: string[]
}

export function ScheduleWeek({ events, viewDate, sportNames }: Props) {
  const weekStart = startOfWeek(viewDate)
  const today     = format(new Date(), 'yyyy-MM-dd')

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const byDay: Record<string, ScheduleEvent[]> = {}
  for (const e of events) {
    const k = e.starts_at.slice(0, 10)
    if (!byDay[k]) byDay[k] = []
    byDay[k].push(e)
  }

  return (
    <div className="grid grid-cols-7 border-l border-t rounded-lg overflow-hidden">
      {days.map((day, i) => {
        const dateStr   = format(day, 'yyyy-MM-dd')
        const isToday   = dateStr === today
        const dayEvents = byDay[dateStr] ?? []

        return (
          <div key={i} className="border-r border-b min-h-[220px]">
            {/* Day header */}
            <div className={cn(
              'flex flex-col items-center py-2 border-b gap-0.5',
              isToday ? 'bg-primary/5' : 'bg-muted/20'
            )}>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {DAY_HEADERS[i]}
              </span>
              <span className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium',
                isToday ? 'bg-primary text-primary-foreground' : 'text-foreground/70'
              )}>
                {day.getDate()}
              </span>
            </div>

            {/* Events */}
            <div className="p-1 space-y-0.5">
              {dayEvents.map(event => {
                const sportIdx = sportNames.indexOf(event.sport_name)
                return (
                  <Popover key={event.id}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          'w-full text-left text-[10px] px-1.5 py-1 rounded truncate leading-tight border transition-opacity hover:opacity-80',
                          sportChipColor(sportIdx),
                          event.status === 'cancelled' && 'opacity-50 line-through',
                        )}
                      >
                        <span className="block truncate font-medium">{event.title}</span>
                        <span className="block truncate text-[9px] opacity-75">
                          {format(parseISO(event.starts_at), 'h:mm a')}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 space-y-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', sportChipColor(sportIdx))}>
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
              })}
              {dayEvents.length === 0 && (
                <div className="h-4" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
