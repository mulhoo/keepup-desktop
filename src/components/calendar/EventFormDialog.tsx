import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  type CalendarEvent, type EventFormData, type EventType, type HomeAway, type EventStatus,
} from '@/api/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'


const EVENT_TYPE_LABELS: Record<EventType, string> = {
  game: 'Game', meet: 'Meet', practice: 'Practice', tournament: 'Tournament', other: 'Other',
}

const HOME_AWAY_LABELS: Record<HomeAway, string> = {
  home: 'Home', away: 'Away', neutral: 'Neutral',
}

const STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: 'Scheduled', cancelled: 'Cancelled', postponed: 'Postponed',
}


export function blankForm(initialDate?: string): EventFormData {
  const base = initialDate ? new Date(`${initialDate}T12:00:00`) : new Date()
  base.setMinutes(0, 0, 0)
  return {
    title:      '',
    event_type: 'meet',
    home_away:  'home',
    location:   '',
    opponent:   '',
    starts_at:  format(base, "yyyy-MM-dd'T'HH:mm"),
    ends_at:    '',
    notes:      '',
    status:     'scheduled',
  }
}

export function eventToForm(e: CalendarEvent): EventFormData {
  return {
    title:      e.title,
    event_type: e.event_type,
    home_away:  e.home_away,
    location:   e.location ?? '',
    opponent:   e.opponent ?? '',
    starts_at:  format(parseISO(e.starts_at), "yyyy-MM-dd'T'HH:mm"),
    ends_at:    e.ends_at ? format(parseISO(e.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
    notes:      e.notes ?? '',
    status:     e.status,
  }
}


interface EventFormDialogProps {
  open:         boolean
  onClose:      () => void
  sportId:      number
  editing:      CalendarEvent | null
  initialDate?: string
}

export function EventFormDialog({ open, onClose, sportId, editing, initialDate }: EventFormDialogProps) {
  const [form, setForm] = useState<EventFormData>(() =>
    editing ? eventToForm(editing) : blankForm(initialDate)
  )
  const qc = useQueryClient()

  function set(field: keyof EventFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateCalendarEvent(sportId, editing.id, form)
        : createCalendarEvent(sportId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', sportId] })
      onClose()
    },
  })

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle>{editing ? 'Edit event' : 'Add event'}</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Title</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. vs Bellevue High School"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Type</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.event_type}
                onChange={e => set('event_type', e.target.value)}
              >
                {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Home / Away</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.home_away}
                onChange={e => set('home_away', e.target.value)}
              >
                {(Object.entries(HOME_AWAY_LABELS) as [HomeAway, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start</label>
              <input
                type="datetime-local"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.starts_at}
                onChange={e => set('starts_at', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End (optional)</label>
              <input
                type="datetime-local"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.ends_at}
                onChange={e => set('ends_at', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Location</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. AHS Aquatic Center"
              value={form.location}
              onChange={e => set('location', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Opponent (optional)</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Bellevue High School"
              value={form.opponent}
              onChange={e => set('opponent', e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              {(Object.entries(STATUS_LABELS) as [EventStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes (optional)</label>
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Any additional info for participants…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !form.title || !form.starts_at}
            className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add event'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


interface DeleteConfirmProps {
  event:   CalendarEvent
  sportId: number
  onClose: () => void
}

export function DeleteConfirm({ event, sportId, onClose }: DeleteConfirmProps) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteCalendarEvent(sportId, event.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['calendar', sportId] }); onClose() },
  })

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Delete event?</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          "{event.title}" on {format(parseISO(event.starts_at), 'MMMM d')} will be permanently removed.
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="px-4 py-2 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
