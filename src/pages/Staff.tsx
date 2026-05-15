import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Archive, ArchiveRestore, Check, Mail, Phone, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/useAuth'
import { fetchSchools } from '@/api/schools'
import { fetchSports, sportDisplayName, type Sport } from '@/api/sports'
import {
  fetchStaff, inviteStaff, updateUser, archiveCoach, restoreStaff, assignSport, fetchDistrictSettings,
  ROLE_LABELS, CREATABLE_BY,
  type StaffRole, type StaffMember,
} from '@/api/staff'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type StaffEntry = {
  id:            number  // institution role ID — used for update/archive
  key:           string
  user_id:       number
  first_name:    string
  last_name:     string
  email?:        string
  role:          StaffRole
  school_id:     number
  school_name:   string
  sport_id?:     number
  sport_name?:   string
  sport_season?: 'fall' | 'winter' | 'spring'
  active:        boolean
  start_date:    string
  end_date:      string | null
}


type SortCol = 'first_name' | 'last_name' | 'role' | 'sport_name' | 'sport_season'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1 inline-block" />
  return dir === 'asc'
    ? <ArrowUp className="w-3 h-3 ml-1 inline-block" />
    : <ArrowDown className="w-3 h-3 ml-1 inline-block" />
}


function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label:    string
  options:  { value: string; label: string }[]
  value:    Set<string>
  onChange: (v: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const count = value.size

  function toggle(v: string) {
    const next = new Set(value)
    if (next.has(v)) next.delete(v); else next.add(v)
    onChange(next)
  }

  if (options.length < 2) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border transition-colors',
          count > 0
            ? 'border-primary/60 bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        {label}
        {count > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {count}
          </span>
        )}
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-44 bg-background border rounded-lg shadow-lg py-1">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.has(opt.value)}
                onChange={() => toggle(opt.value)}
                className="rounded accent-primary w-3.5 h-3.5 flex-none"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
          {count > 0 && (
            <div className="border-t mt-1 px-3 pt-1.5 pb-1">
              <button
                onClick={() => { onChange(new Set()); setOpen(false) }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


const SEASON_BADGE: Record<string, string> = {
  fall:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  winter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  spring: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
const SEASON_DISPLAY: Record<string, string> = { fall: 'Fall', winter: 'Winter', spring: 'Spring' }


function StaffRow({
  entry,
  canEdit,
  onEdit,
  onRemove,
  onRestore,
}: {
  entry:      StaffEntry
  canEdit:    boolean
  onEdit:     () => void
  onRemove:   () => void
  onRestore?: () => void
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-2.5 font-medium text-sm">{entry.last_name}</td>
      <td className="px-4 py-2.5 font-medium text-sm">{entry.first_name}</td>
      <td className="px-4 py-2.5">
        <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
          {ROLE_LABELS[entry.role]}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        {entry.sport_name ?? '—'}
      </td>
      <td className="px-4 py-2.5">
        {entry.sport_season ? (
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', SEASON_BADGE[entry.sport_season])}>
            {SEASON_DISPLAY[entry.sport_season]}
          </span>
        ) : '—'}
      </td>
      <td className="px-4 py-2.5 text-sm text-muted-foreground">
        {entry.active === false
          ? <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Inactive</span>
          : (entry.email ?? '—')}
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1 justify-end">
          {onRestore && (
            <button
              onClick={onRestore}
              title="Restore"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-green-600 transition-colors"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
            </button>
          )}
          {canEdit && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRemove}
                title="Archive"
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-amber-600 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}


type StaffCache = { staff: StaffMember[] }

function patchStaffCache(
  qc: ReturnType<typeof useQueryClient>,
  updater: (prev: StaffMember[]) => StaffMember[]
) {
  qc.setQueryData<StaffCache>(['staff'], old =>
    old ? { staff: updater(old.staff) } : old
  )
}

function InviteModal({
  open, onClose, creatableRoles, schoolSports, effectiveRole,
}: {
  open:           boolean
  onClose:        () => void
  creatableRoles: StaffRole[]
  schoolSports:   Sport[]
  effectiveRole:  string | null
}) {
  const queryClient = useQueryClient()
  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn:  fetchSchools,
    enabled:  effectiveRole === 'district_admin',
  })

  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [startDate,  setStartDate]  = useState('')
  const [role,       setRole]       = useState<StaffRole>(creatableRoles[0])
  const [sportId,    setSportId]    = useState('')
  const [schoolId,   setSchoolId]   = useState('')
  const [sent,       setSent]       = useState(false)
  const [busy,       setBusy]       = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const isCoachRole = role === 'head_coach' || role === 'assistant_coach'

  const sportOptions = useMemo(() => {
    // Backend already scopes sports to the user's school/district
    let base = schoolSports
    if (effectiveRole === 'district_admin') {
      base = schoolId ? base.filter(s => s.school_id === Number(schoolId)) : []
    }
    const seen = new Set<string>()
    return base.filter(s => {
      const name = sportDisplayName(s)
      if (seen.has(name)) return false
      seen.add(name)
      return true
    })
  }, [schoolSports, schoolId, effectiveRole])

  async function handleInvite() {
    setError(null)
    setBusy(true)
    try {
      const created = await inviteStaff({
        first_name:  firstName,
        last_name:   lastName,
        email,
        phone:       phone || undefined,
        start_date:  startDate,
        role,
        sport_id:    isCoachRole && sportId ? Number(sportId) : undefined,
        school_id:   schoolId ? Number(schoolId) : undefined,
      })
      patchStaffCache(queryClient, prev => [...prev, created])
      setSent(true)
      toast.success(`Invitation sent to ${email}.`)
    } catch (e: Error) {
      const msg = e.message ?? 'Something went wrong.'
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitation sent</DialogTitle>
            <DialogDescription>
              {firstName} will receive an email at <strong>{email}</strong> with a link to set up their account and join.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-none" />
            <p className="text-sm text-green-700 dark:text-green-300">
              {firstName} {lastName} · {ROLE_LABELS[role]}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const canSubmit = firstName && lastName && email && startDate && (!isCoachRole || sportId)

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite staff member</DialogTitle>
          <DialogDescription>
            They'll receive an email with a link to set up their account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Chris" />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nguyen" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="coach@school.edu"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(206) 555-0100"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={v => { setRole(v as StaffRole); setSportId('') }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {creatableRoles.map(r => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {effectiveRole === 'district_admin' && (
            <div className="space-y-1.5">
              <Label>School</Label>
              <Select value={schoolId} onValueChange={v => { setSchoolId(v); setSportId('') }}>
                <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isCoachRole && (
            <div className="space-y-1.5">
              <Label>Sport</Label>
              <Select value={sportId} onValueChange={setSportId} disabled={sportOptions.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={sportOptions.length === 0 ? 'Select a school first' : 'Select sport'} />
                </SelectTrigger>
                <SelectContent>
                  {sportOptions.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{sportDisplayName(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInvite} disabled={busy || !canSubmit}>
            {busy ? 'Sending…' : 'Send invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


function EditModal({
  open, onClose, entry, schoolSports, onArchive,
}: {
  open:        boolean
  onClose:     () => void
  entry:       StaffEntry
  schoolSports: Sport[]
  onArchive:   () => void
}) {
  const queryClient = useQueryClient()
  const [firstName,      setFirstName]      = useState(entry.first_name)
  const [lastName,       setLastName]       = useState(entry.last_name)
  const [email,          setEmail]          = useState(entry.email ?? '')
  const [startDate,      setStartDate]      = useState(entry.start_date ?? '')
  const [endDate,        setEndDate]        = useState(entry.end_date ?? '')
  const [showEndDate,    setShowEndDate]    = useState(!!entry.end_date)
  const [selectedSport,  setSelectedSport]  = useState(entry.sport_id?.toString() ?? '')
  const [busy,           setBusy]           = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  const isCoach = entry.role === 'head_coach' || entry.role === 'assistant_coach'

  const sportOptions = schoolSports.filter(s => s.school_id === entry.school_id)

  const today = new Date().toISOString().split('T')[0]
  const endDateLocked = !!entry.end_date && entry.end_date <= today

  const isDirty = (
    firstName !== entry.first_name ||
    lastName  !== entry.last_name  ||
    email     !== (entry.email ?? '') ||
    startDate !== (entry.start_date ?? '') ||
    endDate   !== (entry.end_date ?? '') ||
    (isCoach && selectedSport !== (entry.sport_id?.toString() ?? ''))
  )

  async function handleSave() {
    setBusy(true)
    try {
      const endDatePayload = showEndDate ? (endDate || null) : null
      if (firstName !== entry.first_name || lastName !== entry.last_name || email !== (entry.email ?? '') || startDate !== (entry.start_date ?? '') || endDatePayload !== entry.end_date) {
        const updated = await updateUser(entry.id, { first_name: firstName, last_name: lastName, email, start_date: startDate, end_date: endDatePayload })
        patchStaffCache(queryClient, prev => prev.map(s => s.id === entry.id ? updated : s))
      }
      if (isCoach && selectedSport && selectedSport !== (entry.sport_id?.toString() ?? '')) {
        await assignSport(entry.id, Number(selectedSport))
        queryClient.invalidateQueries({ queryKey: ['sports'] })
        queryClient.invalidateQueries({ queryKey: ['staff'] })
      }
      toast.success('Changes saved.')
      onClose()
    } catch (e: Error) {
      toast.error(e.message ?? 'Failed to save changes.')
    } finally {
      setBusy(false)
    }
  }

  if (confirmArchive) {
    return (
      <Dialog open={open} onOpenChange={v => { if (!v) { setConfirmArchive(false); onClose() } }}>
        <DialogContent className="max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Archive {entry.first_name} {entry.last_name}?</DialogTitle>
            <DialogDescription>
              They'll be removed from active coaching duties and their account will be deactivated.
              All historical data — rosters, results, announcements — stays intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setConfirmArchive(false)}>Go back</Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => { onArchive(); onClose() }}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-xl px-8 pb-8 pt-4">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Edit staff member
            <span className="text-lg font-normal text-muted-foreground ml-2">— {entry.first_name} {entry.last_name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Context — non-editable */}
        <div className="flex items-center gap-4 px-4 py-3.5 rounded-lg bg-muted/50 border mt-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-none select-none ring-1 ring-border">
            {entry.first_name[0]}{entry.last_name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                {ROLE_LABELS[entry.role]}
              </span>
              {entry.sport_name && !isCoach && (
                <span className="text-xs text-muted-foreground">{entry.sport_name}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{entry.school_name}</p>
          </div>
        </div>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First" />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Start date</Label>
            {startDate < today ? (
              <p className="text-sm px-3 py-2 rounded-md border bg-muted/40 text-muted-foreground">
                {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            ) : (
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            )}
          </div>

          {/* End date */}
          {showEndDate ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>End date</Label>
                {!endDateLocked && (
                  <button
                    onClick={() => { setShowEndDate(false); setEndDate('') }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              {endDateLocked ? (
                <p className="text-sm px-3 py-2 rounded-md border bg-muted/40 text-muted-foreground">
                  {new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              ) : (
                <Input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={e => setEndDate(e.target.value)}
                />
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowEndDate(true)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-base leading-none">+</span> Add end date
            </button>
          )}

          {isCoach && sportOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Sport</Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sportOptions.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{sportDisplayName(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="mt-6 pt-5 border-t flex items-center justify-between">
          <button
            onClick={() => setConfirmArchive(true)}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <Archive className="w-4 h-4" />
            Archive coach
          </button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={busy || !firstName || !lastName || !isDirty}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


export default function Staff() {
  const queryClient = useQueryClient()
  const { effectiveRole, isAuthenticated } = useAuth()

  const isDistrictAdmin      = effectiveRole === 'district_admin'
  const isSportsCommissioner = effectiveRole === 'sports_commissioner'
  const isAthleticDirector   = effectiveRole === 'athletic_director'
  const isSchoolAdmin        = effectiveRole === 'school_admin'

  const creatableRoles = CREATABLE_BY[effectiveRole ?? ''] ?? []

  useQuery({
    queryKey: ['district-settings'],
    queryFn:  fetchDistrictSettings,
    enabled:  isAuthenticated && isDistrictAdmin,
  })

  const { isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn:  fetchSchools,
    enabled:  isDistrictAdmin,
  })

  const { data: sports = [], isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn:  fetchSports,
    enabled:  isAuthenticated,
  })

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn:  fetchStaff,
    enabled:  isAuthenticated,
  })

  // Join staff API records with sports data to get sport name/season per person
  const { activeStaff, pastStaff } = useMemo(() => {
    if (!staffData) return { activeStaff: [], pastStaff: [] }

    const entries: StaffEntry[] = staffData.staff.map(member => {
      const sport = sports.find(s => s.coaches.some(c => c.id === member.user_id))
      return {
        id:           member.id,
        key:          `staff-${member.id}`,
        user_id:      member.user_id,
        first_name:   member.first_name,
        last_name:    member.last_name,
        email:        member.email,
        role:         member.role,
        school_id:    member.school_id,
        school_name:  member.school_name ?? '',
        sport_id:     sport?.id,
        sport_name:   sport ? sportDisplayName(sport) : undefined,
        sport_season: sport?.season,
        active:       member.active,
        start_date:   member.start_date,
        end_date:     member.end_date,
      }
    })

    return {
      activeStaff: entries.filter(m => m.active),
      pastStaff:   entries.filter(m => !m.active),
    }
  }, [staffData, sports])

  // Commissioner: scope to their sports only
  const commissionerSportNames = useMemo(
    () => sports.filter(s => s.commissioner !== null).map(s => sportDisplayName(s)),
    [sports]
  )

  // Roles visible to this user
  const visibleRoles: StaffRole[] = isDistrictAdmin
    ? ['school_admin', 'athletic_director', 'head_coach', 'assistant_coach']
    : isSchoolAdmin
      ? ['athletic_director', 'head_coach', 'assistant_coach']
      : isAthleticDirector
        ? ['head_coach', 'assistant_coach']
        : isSportsCommissioner
          ? ['head_coach', 'assistant_coach']
          : []

  function scopeStaff(list: StaffEntry[]) {
    return list.filter(m => {
      if (!visibleRoles.includes(m.role)) return false
      if (isSportsCommissioner) return m.sport_name != null && commissionerSportNames.includes(m.sport_name)
      return true
    })
  }

  const scopedActive = scopeStaff(activeStaff)
  const scopedPast   = scopeStaff(pastStaff)

  const SEASON_LABELS: Record<string, string> = { fall: 'Fall', winter: 'Winter', spring: 'Spring' }

  // Filter options derived from active staff
  const sportOptions   = [...new Set(scopedActive.map(m => m.sport_name).filter(Boolean) as string[])].sort().map(s => ({ value: s, label: s }))
  const roleOptions    = [...new Set(scopedActive.map(m => m.role))].sort().map(r => ({ value: r as StaffRole, label: ROLE_LABELS[r as StaffRole] }))
  const seasonOptions  = ['fall', 'winter', 'spring']
    .filter(s => scopedActive.some(m => m.sport_season === s))
    .map(s => ({ value: s, label: SEASON_LABELS[s] }))
  const schoolOptions  = isDistrictAdmin
    ? [...new Set(scopedActive.map(m => m.school_name))].sort().map(s => ({ value: s, label: s }))
    : []

  const [sportFilter,  setSportFilter]  = useState<Set<string>>(new Set())
  const [roleFilter,   setRoleFilter]   = useState<Set<string>>(new Set())
  const [seasonFilter, setSeasonFilter] = useState<Set<string>>(new Set())
  const [schoolFilter, setSchoolFilter] = useState<Set<string>>(new Set())
  const [showPast,     setShowPast]     = useState(false)
  const [sortCol,      setSortCol]      = useState<SortCol>('last_name')
  const [sortDir,      setSortDir]      = useState<SortDir>('asc')
  const [inviteOpen,   setInviteOpen]   = useState(false)
  const [editing,      setEditing]      = useState<StaffEntry | undefined>()
  const [removing,     setRemoving]     = useState<StaffEntry | null>(null)

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveCoach(id),
    onSuccess: (_, id) => {
      patchStaffCache(queryClient, prev => prev.map(s => s.id === id ? { ...s, active: false } : s))
      toast.success('Staff member archived.')
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to archive staff member.'),
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreStaff(id),
    onSuccess: (updated) => {
      patchStaffCache(queryClient, prev => prev.map(s => s.id === updated.id ? updated : s))
      toast.success('Staff member restored.')
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to restore staff member.'),
  })

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const displayList = showPast ? scopedPast : scopedActive

  const filtered = displayList
    .filter(m => {
      if (sportFilter.size  > 0 && !sportFilter.has(m.sport_name ?? ''))     return false
      if (roleFilter.size   > 0 && !roleFilter.has(m.role))                  return false
      if (seasonFilter.size > 0 && !seasonFilter.has(m.sport_season ?? ''))  return false
      if (schoolFilter.size > 0 && !schoolFilter.has(m.school_name ?? ''))   return false
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if      (sortCol === 'first_name')   cmp = a.first_name.localeCompare(b.first_name)
      else if (sortCol === 'last_name')    cmp = a.last_name.localeCompare(b.last_name)
      else if (sortCol === 'role')         cmp = a.role.localeCompare(b.role)
      else if (sortCol === 'sport_name')   cmp = (a.sport_name ?? '').localeCompare(b.sport_name ?? '')
      else if (sortCol === 'sport_season') {
        const order = { fall: 0, winter: 1, spring: 2 }
        cmp = (order[a.sport_season ?? 'fall'] ?? 0) - (order[b.sport_season ?? 'fall'] ?? 0)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const groups: { label: string; entries: StaffEntry[] }[] = isDistrictAdmin
    ? Object.entries(
        filtered.reduce<Record<string, StaffEntry[]>>((acc, m) => {
          acc[m.school_name] = [...(acc[m.school_name] ?? []), m]
          return acc
        }, {})
      ).sort(([a], [b]) => a.localeCompare(b)).map(([label, entries]) => ({ label, entries }))
    : [{ label: '', entries: filtered }]

  const isLoading = staffLoading || sportsLoading || schoolsLoading

  const subtitle = isSportsCommissioner
    ? 'Coaches for your sport across the conference.'
    : isAthleticDirector
      ? 'Coaching staff at your school.'
      : isSchoolAdmin
        ? 'Athletic director and coaches at your school.'
        : 'All staff across the district.'

  return (
    <div className="px-10 py-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isSportsCommissioner ? 'Coaches' : 'Staff'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs text-muted-foreground">Past staff</span>
            <button
              role="switch"
              aria-checked={showPast}
              onClick={() => { setShowPast(v => !v); setSportFilter(new Set()); setRoleFilter(new Set()); setSeasonFilter(new Set()) }}
              className={cn(
                'relative w-10 h-6 rounded-full transition-all duration-200 border-2 flex-none',
                'border-blue-900 dark:border-cyan-400',
                showPast ? 'bg-blue-900 dark:bg-cyan-400' : 'bg-transparent'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200',
                showPast ? 'bg-white translate-x-[18px]' : 'bg-blue-900 dark:bg-cyan-400 translate-x-0'
              )} />
            </button>
          </label>
          {creatableRoles.length > 0 && !showPast && (
            <Button onClick={() => setInviteOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Invite
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {!isLoading && displayList.length > 0 && (
        <div className="flex items-center gap-2">
          <MultiSelectDropdown label="Sport"  options={showPast ? [...new Set(scopedPast.map(m => m.sport_name).filter(Boolean) as string[])].sort().map(s => ({ value: s, label: s })) : sportOptions}  value={sportFilter}  onChange={setSportFilter}  />
          <MultiSelectDropdown label="Season" options={showPast ? ['fall','winter','spring'].filter(s => scopedPast.some(m => m.sport_season === s)).map(s => ({ value: s, label: SEASON_LABELS[s] })) : seasonOptions} value={seasonFilter} onChange={setSeasonFilter} />
          <MultiSelectDropdown label="Role"   options={showPast ? [...new Set(scopedPast.map(m => m.role))].sort().map(r => ({ value: r as StaffRole, label: ROLE_LABELS[r as StaffRole] })) : roleOptions}   value={roleFilter}   onChange={setRoleFilter}   />
          <MultiSelectDropdown label="School" options={schoolOptions} value={schoolFilter} onChange={setSchoolFilter} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {showPast ? 'No past staff found.' : 'No staff match the selected filters.'}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, entries }) => (
            <div key={label || 'all'} className="space-y-2">
              {label && <h2 className="text-sm font-semibold text-muted-foreground">{label}</h2>}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2 select-none cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort('last_name')}>
                        Last Name <SortIcon active={sortCol === 'last_name'} dir={sortDir} />
                      </th>
                      <th className="px-4 py-2 select-none cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort('first_name')}>
                        First Name <SortIcon active={sortCol === 'first_name'} dir={sortDir} />
                      </th>
                      <th className="px-4 py-2 select-none cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort('role')}>
                        Role <SortIcon active={sortCol === 'role'} dir={sortDir} />
                      </th>
                      <th className="px-4 py-2 select-none cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort('sport_name')}>
                        Sport <SortIcon active={sortCol === 'sport_name'} dir={sortDir} />
                      </th>
                      <th className="px-4 py-2 select-none cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort('sport_season')}>
                        Season <SortIcon active={sortCol === 'sport_season'} dir={sortDir} />
                      </th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-2 py-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => (
                      <StaffRow
                        key={entry.key}
                        entry={entry}
                        canEdit={!showPast && creatableRoles.includes(entry.role)}
                        onEdit={() => setEditing(entry)}
                        onRemove={() => setRemoving(entry)}
                        onRestore={showPast && creatableRoles.includes(entry.role)
                          ? () => restoreMutation.mutate(entry.id)
                          : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {inviteOpen && (
        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          creatableRoles={creatableRoles}
          schoolSports={sports}
          effectiveRole={effectiveRole}
        />
      )}

      {editing && (
        <EditModal
          open={!!editing}
          onClose={() => setEditing(undefined)}
          entry={editing}
          schoolSports={sports}
          onArchive={() => {
            archiveMutation.mutate(editing.id)
            setEditing(undefined)
          }}
        />
      )}

      <AlertDialog open={!!removing} onOpenChange={v => { if (!v) setRemoving(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {removing?.first_name} {removing?.last_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll be removed from active coaching duties and their account will be deactivated.
              All historical data — rosters, results, announcements — stays intact.
              The sport will remain active until a new coach is assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                if (removing) archiveMutation.mutate(removing.id)
                setRemoving(null)
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
