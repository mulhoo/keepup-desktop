import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parseISO, isFuture, format } from 'date-fns'
import {
  Plus, Pencil, Trash2, X, Check, Loader2, MapPin, Clock,
  AlertTriangle, RefreshCw, RotateCcw, ArrowRight,
} from 'lucide-react'
import {
  fetchVenues, createVenue, updateVenue, deleteVenue,
  setVenueClosedStatus, findAlternativeVenue,
  DAY_ORDER, DAY_LABELS, FACILITY_LABELS, fmt12h, formatWindowDays,
  type Venue, type VenueFormData, type FacilityType, type DayOfWeek, type AvailabilityWindow,
} from '@/api/venues'
import {
  fetchCommissionerEvents, updateCommissionerEvent,
  coachesForEvent, sendEventNotifications,
  type CommissionerEvent, type EventCoach,
} from '@/api/commissionerEvents'
import { fetchSchools, type School } from '@/api/schools'
import { cn } from '@/lib/utils'


interface Reassignment {
  event:    CommissionerEvent
  newVenue: Venue | null
}


function WindowRow({
  window: w, onChange, onRemove,
}: {
  window: AvailabilityWindow
  onChange: (u: AvailabilityWindow) => void
  onRemove: () => void
}) {
  function toggleDay(day: DayOfWeek) {
    const next = w.days.includes(day) ? w.days.filter(d => d !== day) : [...w.days, day]
    onChange({ ...w, days: next })
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-1">
        {DAY_ORDER.map(day => (
          <button key={day} type="button" onClick={() => toggleDay(day)}
            className={cn(
              'w-8 h-7 text-[10px] font-semibold rounded transition-colors',
              w.days.includes(day)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}>
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>
      <input type="time" value={w.start_time} onChange={e => onChange({ ...w, start_time: e.target.value })}
        className="border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
      <span className="text-xs text-muted-foreground">–</span>
      <input type="time" value={w.end_time} onChange={e => onChange({ ...w, end_time: e.target.value })}
        className="border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors ml-auto">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}


function VenueDialog({ venue, schools, onClose, onSaved }: {
  venue?: Venue; schools: School[]; onClose: () => void; onSaved: (v: Venue) => void
}) {
  const [name,         setName]         = useState(venue?.name ?? '')
  const [schoolId,     setSchoolId]     = useState(venue?.school_id ?? schools[0]?.id ?? 1)
  const [facilityType, setFacilityType] = useState<FacilityType>(venue?.facility_type ?? 'pool')
  const [address,      setAddress]      = useState(venue?.address ?? '')
  const [windows,      setWindows]      = useState<AvailabilityWindow[]>(
    venue?.availability ?? [{ id: `w-${Date.now()}`, days: [], start_time: '15:00', end_time: '18:00' }]
  )
  const [saving, setSaving] = useState(false)

  const school = schools.find(s => s.id === schoolId) ?? schools[0]

  function addWindow() {
    setWindows(prev => [...prev, { id: `w-${Date.now()}`, days: [], start_time: '15:00', end_time: '18:00' }])
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const data: VenueFormData = {
      name: name.trim(), school_id: schoolId, school_name: school.name,
      facility_type: facilityType, address: address.trim(),
      availability: windows.filter(w => w.days.length > 0),
    }
    const saved = venue ? await updateVenue(venue.id, data) : await createVenue(data)
    onSaved(saved)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-none">
          <h2 className="font-semibold text-sm">{venue ? 'Edit Venue' : 'Add Venue'}</h2>
          <button onClick={onClose} disabled={saving} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Venue name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AHS Aquatic Center"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">School</label>
              <select value={schoolId} onChange={e => setSchoolId(Number(e.target.value))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Facility type</label>
              <select value={facilityType} onChange={e => setFacilityType(e.target.value as FacilityType)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                {(Object.entries(FACILITY_LABELS) as [FacilityType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Address (optional)</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Availability</label>
              <p className="text-[10px] text-muted-foreground">Used by the schedule generator</p>
            </div>
            <div className="space-y-2">
              {windows.map(w => (
                <WindowRow key={w.id} window={w}
                  onChange={u => setWindows(prev => prev.map(x => x.id === w.id ? u : x))}
                  onRemove={() => setWindows(prev => prev.filter(x => x.id !== w.id))} />
              ))}
            </div>
            <button type="button" onClick={addWindow}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-3.5 h-3.5" />Add availability window
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t flex-none">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-40">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            className={cn('flex items-center gap-2 px-4 py-2 text-sm rounded-md font-medium transition-colors',
              name.trim() && !saving ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : <><Check className="w-3.5 h-3.5" />Save</>}
          </button>
        </div>
      </div>
    </div>
  )
}


function CloseVenueDialog({ venue, onClose, onClosed }: {
  venue: Venue; onClose: () => void; onClosed: (v: Venue) => void
}) {
  const [reason,  setReason]  = useState('')
  const [closing, setClosing] = useState(false)

  async function handleClose() {
    setClosing(true)
    const updated = await setVenueClosedStatus(venue.id, true, reason.trim())
    onClosed(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Temporarily Close Venue
          </h2>
          <button onClick={onClose} disabled={closing} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm">
            Mark <span className="font-semibold">{venue.name}</span> as temporarily closed.
            Any upcoming meets scheduled here will need to be reassigned.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Reason (optional)</label>
            <input value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Pool repairs, scheduled maintenance…"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          <button onClick={onClose} disabled={closing} className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-40">
            Cancel
          </button>
          <button onClick={handleClose} disabled={closing}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">
            {closing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Closing…</> : 'Close Venue'}
          </button>
        </div>
      </div>
    </div>
  )
}


type RegenPhase = 'loading' | 'preview' | 'applying' | 'notifying' | 'done'

function RegenerateDialog({ venue, venues, onClose, onDone }: {
  venue: Venue; venues: Venue[]; onClose: () => void; onDone: () => void
}) {
  const qc = useQueryClient()
  const [phase,         setPhase]         = useState<RegenPhase>('loading')
  const [plan,          setPlan]          = useState<Reassignment[]>([])
  const [progress,      setProgress]      = useState(0)
  const [notifiedCount, setNotifiedCount] = useState(0)

  useEffect(() => {
    fetchCommissionerEvents().then(events => {
      const affected = events.filter(e =>
        e.venue === venue.name && isFuture(parseISO(e.starts_at))
      )
      const assignments: Reassignment[] = affected.map(event => ({
        event,
        newVenue: findAlternativeVenue(
          parseISO(event.starts_at),
          venue.facility_type,
          venues,
          venue.id,
        ),
      }))
      setPlan(assignments)
      setPhase('preview')
    })
  }, [venue, venues])

  const reassignable = plan.filter(r => r.newVenue !== null)
  const unresolvable = plan.filter(r => r.newVenue === null)

  async function handleApply() {
    setPhase('applying')
    const coachMap = new Map<string, EventCoach>()
    let count = 0

    for (const { event, newVenue } of plan) {
      if (!newVenue) continue
      await updateCommissionerEvent(event.id, { venue: newVenue.name })
      coachesForEvent(event).forEach(c => coachMap.set(c.email, c))
      count++
      setProgress(count)
    }

    const coaches = [...coachMap.values()]
    setNotifiedCount(coaches.length)
    setPhase('notifying')
    if (coaches.length > 0) await sendEventNotifications(0)

    qc.invalidateQueries({ queryKey: ['commissioner-events'] })
    setPhase('done')
    setTimeout(onDone, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-none">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Reassign Upcoming Meets
          </h2>
          <button onClick={onClose} disabled={phase === 'applying' || phase === 'notifying'}
            className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex-1 space-y-4">
          {phase === 'loading' && (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />Finding affected meets…
            </div>
          )}

          {(phase === 'preview' || phase === 'applying' || phase === 'notifying' || phase === 'done') && plan.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No upcoming meets are scheduled at {venue.name}.
            </div>
          )}

          {phase === 'preview' && plan.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                {reassignable.length} meet{reassignable.length !== 1 ? 's' : ''} will be moved to an available alternative pool.
                {unresolvable.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                    {unresolvable.length} could not be auto-resolved and will need manual attention.
                  </span>
                )}
              </p>
              <div className="space-y-2">
                {plan.map(({ event, newVenue }) => (
                  <div key={event.id} className={cn(
                    'border rounded-lg p-3 space-y-1.5',
                    newVenue ? 'bg-card' : 'border-amber-400/40 bg-amber-500/5',
                  )}>
                    <p className="text-xs font-medium">
                      {format(parseISO(event.starts_at), 'EEE, MMM d')} · {event.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground line-through">{venue.name}</span>
                      {newVenue ? (
                        <>
                          <ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400 flex-none" />
                          <span className="text-green-600 dark:text-green-400 font-medium">{newVenue.name}</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3 h-3 text-amber-500 flex-none" />
                          <span className="text-amber-600 dark:text-amber-400">No alternative found — manual update needed</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {phase === 'applying' && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">Updating events…</p>
              <p className="text-xs text-muted-foreground">{progress} of {reassignable.length} updated</p>
            </div>
          )}

          {phase === 'notifying' && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">Notifying coaches…</p>
              <p className="text-xs text-muted-foreground">Sending to {notifiedCount} coaches</p>
            </div>
          )}

          {phase === 'done' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium">Schedule updated</p>
              <p className="text-xs text-muted-foreground">
                {reassignable.length} meet{reassignable.length !== 1 ? 's' : ''} reassigned · {notifiedCount} coaches notified
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t flex-none">
          <button onClick={onClose} disabled={phase === 'applying' || phase === 'notifying'}
            className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-40">
            {phase === 'done' ? 'Close' : 'Cancel'}
          </button>
          {phase === 'preview' && reassignable.length > 0 && (
            <button onClick={handleApply}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Apply & Notify Coaches
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


function VenueCard({ venue, onEdit, onDelete, onClose, onReopen, onReassign }: {
  venue:      Venue
  onEdit:     () => void
  onDelete:   () => void
  onClose:    () => void
  onReopen:   () => void
  onReassign: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className={cn(
      'border rounded-lg bg-card p-4 space-y-3',
      venue.temporarily_closed && 'border-amber-400/40',
    )}>
      {/* Closed banner */}
      {venue.temporarily_closed && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-400/20 rounded-md -mt-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-none" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Temporarily Closed</span>
            {venue.closed_reason && (
              <span className="text-xs text-muted-foreground ml-1.5">— {venue.closed_reason}</span>
            )}
          </div>
          <button onClick={onReassign}
            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline flex-none">
            <RefreshCw className="w-3 h-3" />Reassign meets
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn('font-semibold text-sm', venue.temporarily_closed && 'text-muted-foreground')}>
            {venue.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{venue.school_name}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {FACILITY_LABELS[venue.facility_type]}
            </span>
          </div>
          {venue.address && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 flex-none" />{venue.address}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-none flex-wrap justify-end">
          <button onClick={onEdit}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-3.5 h-3.5" />Edit
          </button>
          {venue.temporarily_closed ? (
            <button onClick={onReopen}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded hover:bg-muted text-green-600 dark:text-green-400 hover:text-foreground transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />Reopen
            </button>
          ) : (
            <button onClick={onClose}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              <AlertTriangle className="w-3.5 h-3.5" />Close
            </button>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={onDelete}
                className="text-xs px-2 py-1.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                Confirm
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {venue.availability.length > 0 ? (
        <div className={cn('space-y-1 border-t pt-3', venue.temporarily_closed && 'opacity-50')}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Available times
          </p>
          {venue.availability.map(w => (
            <div key={w.id} className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3 text-muted-foreground flex-none" />
              <span className="text-muted-foreground">{formatWindowDays(w.days)}</span>
              <span className="text-muted-foreground/40">·</span>
              <span>{fmt12h(w.start_time)} – {fmt12h(w.end_time)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/60 border-t pt-3 italic">
          No availability windows set — venue won't be used in schedule generation.
        </p>
      )}
    </div>
  )
}


type Dialog =
  | { type: 'add'  }
  | { type: 'edit';       venue: Venue }
  | { type: 'close';      venue: Venue }
  | { type: 'regenerate'; venue: Venue }

export default function Venues() {
  const qc = useQueryClient()
  const [dialog, setDialog] = useState<Dialog | null>(null)

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn:  fetchVenues,
  })

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn:  fetchSchools,
  })

  async function handleDelete(id: number) {
    await deleteVenue(id)
    qc.invalidateQueries({ queryKey: ['venues'] })
  }

  async function handleReopen(id: number) {
    await setVenueClosedStatus(id, false)
    qc.invalidateQueries({ queryKey: ['venues'] })
  }

  function handleSaved() {
    qc.invalidateQueries({ queryKey: ['venues'] })
    setDialog(null)
  }

  function handleClosed(updated: Venue) {
    qc.invalidateQueries({ queryKey: ['venues'] })
    setDialog({ type: 'regenerate', venue: updated })
  }

  const schoolsWithVenues = schools.filter(s => venues.some(v => v.school_id === s.id))
  const bySchool = schoolsWithVenues.map(school => ({
    school,
    venues: venues.filter(v => v.school_id === school.id),
  }))

  return (
    <div className="px-10 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Venues</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Facility availability is used by the schedule generator to pick valid dates, times, and locations automatically.
          </p>
        </div>
        <button onClick={() => setDialog({ type: 'add' })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex-none">
          <Plus className="w-4 h-4" />Add Venue
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 rounded-lg bg-muted/50 animate-pulse" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border rounded-lg border-dashed">
          <p className="text-sm font-medium">No venues yet</p>
          <p className="text-xs text-muted-foreground">Add a venue to enable automatic scheduling with location and time awareness.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {bySchool.filter(g => g.venues.length > 0).map(({ school, venues: schoolVenues }) => (
            <div key={school.id} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {school.name}
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {schoolVenues.map(v => (
                  <VenueCard
                    key={v.id}
                    venue={v}
                    onEdit={()     => setDialog({ type: 'edit',       venue: v })}
                    onDelete={()   => handleDelete(v.id)}
                    onClose={()    => setDialog({ type: 'close',      venue: v })}
                    onReopen={()   => handleReopen(v.id)}
                    onReassign={() => setDialog({ type: 'regenerate', venue: v })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog?.type === 'add' && (
        <VenueDialog schools={schools} onClose={() => setDialog(null)} onSaved={handleSaved} />
      )}
      {dialog?.type === 'edit' && (
        <VenueDialog venue={dialog.venue} schools={schools} onClose={() => setDialog(null)} onSaved={handleSaved} />
      )}
      {dialog?.type === 'close' && (
        <CloseVenueDialog
          venue={dialog.venue}
          onClose={() => setDialog(null)}
          onClosed={handleClosed}
        />
      )}
      {dialog?.type === 'regenerate' && (
        <RegenerateDialog
          venue={dialog.venue}
          venues={venues}
          onClose={() => setDialog(null)}
          onDone={() => setDialog(null)}
        />
      )}
    </div>
  )
}
