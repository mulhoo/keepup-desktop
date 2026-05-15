import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, isFuture, isToday } from 'date-fns'
import {
  CalendarDays, MapPin, Trophy, ChevronDown, ChevronUp,
  Pencil, X, Loader2, Check, Bell, FileText, Clock,
} from 'lucide-react'
import {
  fetchCommissionerEvents, updateCommissionerEvent, sendEventNotifications,
  coachesForEvent,
  type CommissionerEvent, type CommissionerEventStatus, type EditEventInput,
} from '@/api/commissionerEvents'
import { cn } from '@/lib/utils'


const STATUS_CONFIG: Record<CommissionerEventStatus, { label: string; cls: string }> = {
  scheduled:  { label: 'Scheduled',  cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'   },
  completed:  { label: 'Completed',  cls: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  postponed:  { label: 'Postponed',  cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-500/10 text-red-500'                         },
}

function splitDateTime(iso: string) {
  const d = parseISO(iso)
  return {
    date: format(d, 'yyyy-MM-dd'),
    time: format(d, 'HH:mm'),
  }
}

function joinDateTime(date: string, time: string) {
  return `${date}T${time}:00`
}


type NotifyState = 'idle' | 'saving' | 'notifying' | 'done'

function EditDialog({
  event,
  onClose,
  onSaved,
}: {
  event: CommissionerEvent
  onClose: () => void
  onSaved: (updated: CommissionerEvent) => void
}) {
  const startDT = splitDateTime(event.starts_at)
  const endDT   = splitDateTime(event.ends_at)

  const [title,     setTitle]     = useState(event.title)
  const [startDate, setStartDate] = useState(startDT.date)
  const [startTime, setStartTime] = useState(startDT.time)
  const [endDate,   setEndDate]   = useState(endDT.date)
  const [endTime,   setEndTime]   = useState(endDT.time)
  const [venue,     setVenue]     = useState(event.venue)
  const [status,    setStatus]    = useState<CommissionerEventStatus>(event.status)
  const [notes,     setNotes]     = useState(event.notes)
  const [notifyState, setNotifyState] = useState<NotifyState>('idle')

  const coaches = coachesForEvent(event)

  const isDirty = (
    title     !== event.title  ||
    startDate !== startDT.date ||
    startTime !== startDT.time ||
    endDate   !== endDT.date   ||
    endTime   !== endDT.time   ||
    venue     !== event.venue  ||
    status    !== event.status ||
    notes     !== event.notes
  )

  // Only schedule-impacting fields warrant notifying coaches
  const notifyWorthy = (
    startDate !== startDT.date ||
    startTime !== startDT.time ||
    endDate   !== endDT.date   ||
    endTime   !== endDT.time   ||
    venue     !== event.venue  ||
    status    !== event.status
  )

  async function handleSave() {
    setNotifyState('saving')
    const input: EditEventInput = {
      title,
      starts_at: joinDateTime(startDate, startTime),
      ends_at:   joinDateTime(endDate,   endTime),
      venue, status, notes,
    }
    const updated = await updateCommissionerEvent(event.id, input)
    if (notifyWorthy) {
      setNotifyState('notifying')
      await sendEventNotifications(event.id)
    }
    setNotifyState('done')
    onSaved(updated)
    setTimeout(onClose, 1600)
  }

  const busy = notifyState !== 'idle'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-none">
          <h2 className="font-semibold text-sm">Edit Event</h2>
          <button onClick={onClose} disabled={busy} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={busy}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
          </div>

          {/* Double dual pairings (read-only) */}
          {event.matchup_pairs.length === 2 && (
            <div className="border rounded-lg p-3 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-primary">Double Dual — Matchups</p>
                <span className="text-[10px] text-muted-foreground">Shared pool · scored separately</span>
              </div>
              {event.matchup_pairs.map((pair, i) => {
                const home = event.teams.find(t => t.school_id === pair.home_school_id)
                const away = event.teams.find(t => t.school_id === pair.away_school_id)
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                    <span className="font-medium">{home?.team_name}</span>
                    <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-primary/10 text-primary">Host</span>
                    <span className="text-muted-foreground/50">vs</span>
                    <span className="font-medium">{away?.team_name}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Date / time grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={busy}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={busy}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End date</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} disabled={busy}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={busy}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Venue</label>
            <input value={venue} onChange={e => setVenue(e.target.value)} disabled={busy}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as CommissionerEventStatus)} disabled={busy}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="postponed">Postponed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} disabled={busy}
              placeholder="Any notes for the teams…"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-60 placeholder:text-muted-foreground/50" />
          </div>

          {/* Coaches to notify */}
          <div className={cn(
            'border rounded-lg p-3 space-y-2',
            notifyWorthy ? 'bg-muted/30' : 'bg-muted/10 opacity-60',
          )}>
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Bell className={cn('w-3.5 h-3.5', notifyWorthy ? 'text-muted-foreground' : 'text-muted-foreground/50')} />
              {notifyWorthy
                ? `Coaches who will be notified (${coaches.length})`
                : 'No notification — only title or notes changed'
              }
            </p>
            {notifyWorthy && (
              <div className="space-y-1.5">
                {coaches.map(c => (
                  <div key={c.email} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">
                      {c.role === 'head_coach' ? 'Head Coach' : 'Asst. Coach'} · {c.school_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t flex-none">
          {notifyState === 'done' && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium mr-auto">
              <Check className="w-3.5 h-3.5" />
              {notifyWorthy ? `Notified ${coaches.length} coaches` : 'Saved'}
            </span>
          )}
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || busy}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm rounded-md font-medium transition-colors',
              isDirty && !busy
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {notifyState === 'saving'    && <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>}
            {notifyState === 'notifying' && <><Bell    className="w-3.5 h-3.5 animate-pulse" />Notifying…</>}
            {notifyState === 'done'      && <><Check   className="w-3.5 h-3.5" />Done</>}
            {notifyState === 'idle'      && (notifyWorthy ? 'Save & Notify Teams' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}


function EventCard({
  event,
  onEdit,
}: {
  event: CommissionerEvent
  onEdit: () => void
}) {
  const start  = parseISO(event.starts_at)
  const end    = parseISO(event.ends_at)
  const status = STATUS_CONFIG[event.status]
  const isTournament = event.event_type === 'tournament'

  return (
    <div className="border rounded-lg bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-stretch">
        {/* Date column */}
        <div className="flex flex-col items-center justify-center px-4 py-3 border-r min-w-[72px] text-center flex-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {format(start, 'MMM')}
          </span>
          <span className="text-2xl font-bold leading-none mt-0.5">{format(start, 'd')}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{format(start, 'EEE')}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-4 py-3 space-y-1.5">
          <div className="flex items-start gap-2 flex-wrap">
            {isTournament && (
              <Trophy className="w-3.5 h-3.5 text-amber-500 flex-none mt-0.5" />
            )}
            <p className="text-sm font-semibold leading-snug flex-1 min-w-0">{event.title}</p>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex-none', status.cls)}>
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.venue}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {event.sport_name}
            </span>
          </div>

          {/* Teams / pairings */}
          {event.matchup_pairs.length === 2 ? (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Double Dual</span>
                <span className="text-[10px] text-muted-foreground">· shared pool, scored separately</span>
              </div>
              {event.matchup_pairs.map((pair, i) => {
                const home = event.teams.find(t => t.school_id === pair.home_school_id)
                const away = event.teams.find(t => t.school_id === pair.away_school_id)
                return (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium">{home?.team_name}</span>
                    <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-primary/10 text-primary">Host</span>
                    <span className="text-muted-foreground/50 text-[10px]">vs</span>
                    <span className="font-medium">{away?.team_name}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {event.teams.map(t => (
                <span key={t.sport_id}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {t.team_name}
                </span>
              ))}
            </div>
          )}

          {/* Results / notes */}
          {event.has_results && event.result_summary && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium pt-0.5">
              <FileText className="w-3 h-3" />
              {event.result_summary}
            </div>
          )}
          {!event.has_results && event.status === 'completed' && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 pt-0.5">
              Results pending confirmation
            </p>
          )}
          {event.notes && (
            <p className="text-[10px] text-muted-foreground border-t pt-1.5 mt-1">
              {event.notes}
            </p>
          )}
        </div>

        {/* Edit button */}
        <div className="flex items-center px-3 flex-none">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}


function Section({
  title,
  events,
  defaultCollapsed = false,
  onEdit,
}: {
  title:             string
  events:            CommissionerEvent[]
  defaultCollapsed?: boolean
  onEdit:            (event: CommissionerEvent) => void
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (events.length === 0) return null

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full text-left"
      >
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground font-normal">({events.length})</span>
        <div className="flex-1" />
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronUp   className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {events.map(e => (
            <EventCard key={e.id} event={e} onEdit={() => onEdit(e)} />
          ))}
        </div>
      )}
    </div>
  )
}


export default function CommissionerEvents() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<CommissionerEvent | null>(null)
  const [localUpdates, setLocalUpdates] = useState<Record<number, Partial<CommissionerEvent>>>({})

  const { data: rawEvents = [], isLoading } = useQuery({
    queryKey: ['commissioner-events'],
    queryFn:  fetchCommissionerEvents,
  })

  const events = rawEvents.map(e =>
    localUpdates[e.id] ? { ...e, ...localUpdates[e.id] } : e
  )

  const now      = new Date()
  const upcoming = events
    .filter(e => isFuture(parseISO(e.starts_at)) || isToday(parseISO(e.starts_at)))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const past = events
    .filter(e => !isFuture(parseISO(e.starts_at)) && !isToday(parseISO(e.starts_at)))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))

  void now

  function handleSaved(updated: CommissionerEvent) {
    setLocalUpdates(prev => ({ ...prev, [updated.id]: updated }))
    qc.invalidateQueries({ queryKey: ['commissioner-events'] })
    setEditing(null)
  }

  return (
    <div className="px-10 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All meets and tournaments across the conference. Edit an event to reschedule or update details — impacted coaches will be notified automatically.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            title="Upcoming"
            events={upcoming}
            onEdit={setEditing}
          />
          <Section
            title="Past"
            events={past}
            defaultCollapsed={false}
            onEdit={setEditing}
          />
        </div>
      )}

      {editing && (
        <EditDialog
          event={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
