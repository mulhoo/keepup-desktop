import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Loader2, Plus, Check, X, Trophy, Trash2 } from 'lucide-react'
import { fetchSports, sportDisplayName, type Sport, type SportGender } from '@/api/sports'
import { createCalendarEvent, deleteCalendarEvent } from '@/api/calendar'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'


const SWIM_EVENTS = [
  '200 Medley Relay', '200 Free', '200 IM', '50 Free', 'Diving',
  '100 Butterfly', '100 Free', '500 Free', '200 Free Relay',
  '100 Backstroke', '100 Breaststroke', '400 Free Relay',
]


interface MajorMeet {
  id:                       string
  name:                     string
  date:                     string
  venue:                    string
  added:                    boolean
  calendarEventIds:         Array<{ sportId: number; eventId: number }>
  hasTimeStandards:         boolean
  requiresTimeVerification: boolean
  hasWildcard:              boolean
  standards:                Record<string, string>
  wildcardStandards:        Record<string, string>
}

const EMPTY_MEET_STANDARDS = {
  hasTimeStandards: false,
  requiresTimeVerification: false,
  hasWildcard: false,
  standards: {},
  wildcardStandards: {},
  calendarEventIds: [] as Array<{ sportId: number; eventId: number }>,
}

function defaultMajorMeets(sportName: string): MajorMeet[] {
  const lc = sportName.toLowerCase()

  if (lc.includes('swim')) return [
    { id: 'kingco',    name: 'KingCo Championships',   date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'districts', name: 'District Championships', date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'state',     name: 'State Championships',    date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
  ]

  if (lc.includes('polo')) return [
    { id: 'kingco',    name: 'KingCo Water Polo Championships', date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'districts', name: 'District Playoffs',               date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'state',     name: 'State Tournament',                date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
  ]

  if (lc.includes('basketball')) return [
    { id: 'kingco',    name: 'KingCo Tournament',   date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'districts', name: 'District Playoffs',   date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'state',     name: 'State Tournament',    date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
  ]

  if (lc.includes('soccer') || lc.includes('lacrosse') || lc.includes('football')) return [
    { id: 'league',    name: 'League Championship',    date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'districts', name: 'District Playoffs',      date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'state',     name: 'State Championships',    date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
  ]

  if (lc.includes('track') || lc.includes('cross country') || lc.includes('cross-country')) return [
    { id: 'league',    name: 'KingCo Championship Meet',  date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'districts', name: 'District Championships',    date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'state',     name: 'State Championships',       date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
  ]

  if (lc.includes('volleyball')) return [
    { id: 'kingco',    name: 'KingCo Tournament',   date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'districts', name: 'District Tournament', date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'state',     name: 'State Tournament',    date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
  ]

  return [
    { id: 'league',    name: 'League Championship', date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'districts', name: 'District Championship', date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
    { id: 'state',     name: 'State Championship',  date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS },
  ]
}


function MeetToggle({ on, onToggle, label, disabled, color = 'primary' }: {
  on:       boolean
  onToggle: () => void
  label:    string
  disabled?: boolean
  color?:   'primary' | 'amber'
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 text-xs transition-colors flex-none',
        on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <div className={cn(
        'relative w-7 h-4 rounded-full transition-colors flex-none',
        on
          ? color === 'amber' ? 'bg-amber-500' : 'bg-primary'
          : 'bg-muted-foreground/25',
      )}>
        <div className={cn(
          'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-150',
          on ? 'left-[14px]' : 'left-0.5',
        )} />
      </div>
      {label}
    </button>
  )
}


function StandardsPanel({
  meet, sportName, onUpdate, onUpdateWildcard, onToggleWildcard,
}: {
  meet: MajorMeet
  sportName: string
  onUpdate: (event: string, value: string) => void
  onUpdateWildcard: (event: string, value: string) => void
  onToggleWildcard: () => void
}) {
  const isSwim = sportName.toLowerCase().includes('swim') || sportName.toLowerCase().includes('polo')
  const events = isSwim ? SWIM_EVENTS : []

  if (events.length === 0) {
    return (
      <div className="border-t pt-3 text-xs text-muted-foreground italic">
        Time standards can be configured once events are defined for this sport.
      </div>
    )
  }

  return (
    <div className="border-t pt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-36 flex-none" />
        <span className="w-24 text-center text-[10px] font-medium text-muted-foreground">
          {meet.hasWildcard ? 'Automatic' : 'Qualifying time'}
        </span>
        {meet.hasWildcard ? (
          <>
            <span className="w-5 flex-none" />
            <span className="w-24 text-center text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Wild Card
            </span>
          </>
        ) : (
          <button
            onClick={onToggleWildcard}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            <Plus className="w-3 h-3" />
            Wild card times
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {events.map(event => (
          <div key={event} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-36 flex-none truncate">{event}</span>
            <input
              type="text"
              value={meet.standards[event] ?? ''}
              onChange={e => onUpdate(event, e.target.value)}
              placeholder="e.g. 1:55.00"
              className="w-24 text-xs border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
            />
            {meet.hasWildcard && (
              <>
                <span className="w-5 flex-none text-center text-xs text-muted-foreground/40">/</span>
                <input
                  type="text"
                  value={meet.wildcardStandards[event] ?? ''}
                  onChange={e => onUpdateWildcard(event, e.target.value)}
                  placeholder="e.g. 1:58.00"
                  className="w-24 text-xs border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40 border-amber-300 dark:border-amber-700/60"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground pt-1">
        Swimmers must meet or beat these times to qualify. Format: M:SS.ff
      </p>
    </div>
  )
}


export default function MajorCompetitions() {
  const qc = useQueryClient()

  const { data: allSports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn:  () => fetchSports(),
  })

  const currentYear = [...new Set(allSports.map(s => s.school_year))].sort().reverse()[0] ?? ''
  const commissionerSports = allSports.filter(s =>
    s.commissioner !== null && s.school_year === currentYear
  )

  const sportFamilies = commissionerSports.reduce<
    Record<string, { name: string; gender: SportGender; teams: Sport[] }[]>
  >((acc, s) => {
    if (!acc[s.name]) acc[s.name] = []
    let group = acc[s.name].find(g => g.gender === s.gender)
    if (!group) { group = { name: s.name, gender: s.gender, teams: [] }; acc[s.name].push(group) }
    group.teams.push(s)
    return acc
  }, {})

  const allSportGroups = Object.values(sportFamilies).flat()
  const firstKey = allSportGroups[0] ? sportDisplayName(allSportGroups[0]) : ''

  const [selectedSport, setSelectedSport] = useState('')
  const [majorMeets,    setMajorMeets]    = useState<MajorMeet[]>([])
  const [addingMeetId,   setAddingMeetId]   = useState<string | null>(null)
  const [removingMeetId, setRemovingMeetId] = useState<string | null>(null)
  const [confirmRemove,  setConfirmRemove]  = useState<MajorMeet | null>(null)
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null)

  // Initialize once the async sports query resolves
  useEffect(() => {
    if (firstKey && !selectedSport) {
      setSelectedSport(firstKey)
      setMajorMeets(defaultMajorMeets(allSportGroups[0]?.name ?? ''))
    }
  }, [firstKey])

  const effectiveSport = selectedSport || firstKey
  const selectedGroup  = allSportGroups.find(g => sportDisplayName(g) === effectiveSport)

  function onSportChange(name: string) {
    setSelectedSport(name)
    setMajorMeets(defaultMajorMeets(name))
  }

  function updateMeet(id: string, field: 'date' | 'venue', value: string) {
    setMajorMeets(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  function toggleStandards(id: string) {
    setMajorMeets(prev => prev.map(m => m.id === id ? { ...m, hasTimeStandards: !m.hasTimeStandards } : m))
  }

  function toggleVerification(id: string) {
    setMajorMeets(prev => prev.map(m => m.id === id ? { ...m, requiresTimeVerification: !m.requiresTimeVerification } : m))
  }

  function toggleWildcard(id: string) {
    setMajorMeets(prev => prev.map(m => m.id === id ? { ...m, hasWildcard: !m.hasWildcard } : m))
  }

  function updateStandard(id: string, event: string, value: string) {
    setMajorMeets(prev => prev.map(m =>
      m.id === id ? { ...m, standards: { ...m.standards, [event]: value } } : m
    ))
  }

  function updateWildcard(id: string, event: string, value: string) {
    setMajorMeets(prev => prev.map(m =>
      m.id === id ? { ...m, wildcardStandards: { ...m.wildcardStandards, [event]: value } } : m
    ))
  }

  function addCustomMeet() {
    const id = `custom-${Date.now()}`
    setMajorMeets(prev => [...prev, { id, name: '', date: '', venue: '', added: false, ...EMPTY_MEET_STANDARDS }])
  }

  function removeMeet(id: string) {
    setMajorMeets(prev => prev.filter(m => m.id !== id))
  }

  async function handleAddMeet(meet: MajorMeet) {
    if (!meet.date || !selectedGroup) return
    setAddingMeetId(meet.id)
    const created: Array<{ sportId: number; eventId: number }> = []
    for (const team of selectedGroup.teams) {
      const event = await createCalendarEvent(team.id, {
        title:      meet.name,
        event_type: 'tournament',
        home_away:  'neutral',
        location:   meet.venue,
        starts_at:  `${meet.date}T08:00:00`,
        ends_at:    `${meet.date}T18:00:00`,
        notes: '', opponent: '', status: 'scheduled',
      }, false)
      created.push({ sportId: team.id, eventId: event.id })
    }
    qc.invalidateQueries({ queryKey: ['schedule'] })
    qc.invalidateQueries({ queryKey: ['calendar'] })
    setMajorMeets(prev => prev.map(m => m.id === meet.id ? { ...m, added: true, calendarEventIds: created } : m))
    setAddingMeetId(null)
  }

  async function handleRemoveMeet(meet: MajorMeet) {
    setRemovingMeetId(meet.id)
    for (const { sportId, eventId } of meet.calendarEventIds) {
      await deleteCalendarEvent(sportId, eventId)
    }
    qc.invalidateQueries({ queryKey: ['schedule'] })
    qc.invalidateQueries({ queryKey: ['calendar'] })
    setMajorMeets(prev => prev.map(m => m.id === meet.id ? { ...m, added: false, calendarEventIds: [] } : m))
    setRemovingMeetId(null)
  }

  return (
    <div className="px-10 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Major Competitions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Championship meets added to all teams' calendars. Not part of the regular season schedule.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Sport</label>
        <select
          value={effectiveSport}
          onChange={e => onSportChange(e.target.value)}
          className="w-64 border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {Object.entries(sportFamilies).map(([family, variants]) =>
          variants.length > 1 ? (
            <optgroup key={family} label={family}>
              {variants.map(v => (
                <option key={sportDisplayName(v)} value={sportDisplayName(v)}>
                  {sportDisplayName(v)}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={sportDisplayName(variants[0])} value={sportDisplayName(variants[0])}>
              {sportDisplayName(variants[0])}
            </option>
          )
        )}
        </select>
      </div>

      <div className="space-y-3">
        {majorMeets.map(meet => (
          <div key={meet.id} className="border rounded-lg p-4 space-y-3 bg-card">
            {/* Row 1: name · date · venue · remove */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={meet.name}
                onChange={e => setMajorMeets(prev => prev.map(m => m.id === meet.id ? { ...m, name: e.target.value, added: false } : m))}
                placeholder="Competition name…"
                disabled={meet.added}
                className="flex-1 min-w-0 text-sm font-medium bg-transparent focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-60"
              />
              <input
                type="date"
                value={meet.date}
                onChange={e => updateMeet(meet.id, 'date', e.target.value)}
                disabled={meet.added}
                className="border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 flex-none"
              />
              <input
                type="text"
                value={meet.venue}
                onChange={e => updateMeet(meet.id, 'venue', e.target.value)}
                placeholder="Venue…"
                disabled={meet.added}
                className="w-44 border rounded px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 disabled:opacity-60"
              />
              {!meet.added && (
                <button
                  onClick={() => setConfirmDelete(meet.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: toggles · add button */}
            <div className="flex items-center gap-5 flex-wrap">
              <MeetToggle
                on={meet.hasTimeStandards}
                onToggle={() => toggleStandards(meet.id)}
                label="Time standards"
                disabled={meet.added}
              />
              <MeetToggle
                on={meet.requiresTimeVerification}
                onToggle={() => toggleVerification(meet.id)}
                label="Requires time verification"
                disabled={meet.added}
                color="amber"
              />
              <div className="flex-1" />
              {meet.added ? (
                <div className="flex items-center gap-2 flex-none">
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                    <Check className="w-3.5 h-3.5" /> Added to calendars
                  </span>
                  <button
                    onClick={() => setConfirmRemove(meet)}
                    disabled={removingMeetId === meet.id}
                    className="flex items-center gap-1 text-xs px-2 py-1 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-40"
                  >
                    {removingMeetId === meet.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />
                    }
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleAddMeet(meet)}
                  disabled={!meet.name || !meet.date || addingMeetId === meet.id || !selectedGroup}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 flex-none"
                >
                  {addingMeetId === meet.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CalendarPlus className="w-3 h-3" />
                  }
                  Add to calendars
                </button>
              )}
            </div>

            {/* Time standards panel */}
            {meet.hasTimeStandards && (
              <StandardsPanel
                meet={meet}
                sportName={effectiveSport}
                onUpdate={(event, value) => updateStandard(meet.id, event, value)}
                onUpdateWildcard={(event, value) => updateWildcard(meet.id, event, value)}
                onToggleWildcard={() => toggleWildcard(meet.id)}
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addCustomMeet}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add competition
      </button>

      {/* Confirm remove row (not yet added) */}
      <AlertDialog open={!!confirmDelete} onOpenChange={v => { if (!v) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this competition?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the row. It hasn't been added to any calendars yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDelete) { removeMeet(confirmDelete); setConfirmDelete(null) } }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm remove from calendars */}
      <AlertDialog open={!!confirmRemove} onOpenChange={v => { if (!v) setConfirmRemove(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from all calendars?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmRemove?.name}" will be deleted from every team's calendar. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmRemove) { handleRemoveMeet(confirmRemove); setConfirmRemove(null) } }}
            >
              Remove from calendars
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
