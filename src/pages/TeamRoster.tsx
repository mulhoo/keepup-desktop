import { useState, useRef, KeyboardEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronRight, ChevronDown, Loader2, Mail, Phone, Trash2, X, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchSportDetail, updateMember, updateSportLevels, purgeStudentData, type SportMember, type SportMemberUpdate, type SportCoach } from '@/api/sports'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const SEASON_LABEL: Record<string, string> = { fall: 'Fall', winter: 'Winter', spring: 'Spring' }
const COACH_LABEL: Record<string, string> = { head_coach: 'Head Coach', assistant_coach: 'Asst. Coach' }

const LEVEL_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
]

function levelColor(level: string, levels: string[]) {
  const idx = levels.indexOf(level)
  return LEVEL_COLORS[idx >= 0 ? idx % LEVEL_COLORS.length : 0]
}


function AthleteDialog({ member, levels, canEdit, canPurge, onClose, onSave, onPurge }: {
  member: SportMember
  levels: string[]
  canEdit: boolean
  canPurge: boolean
  onClose: () => void
  onSave: (updates: SportMemberUpdate) => void
  onPurge: () => void
}) {
  const [grade,    setGrade]    = useState(member.grade         ?? '')
  const [jersey,   setJersey]   = useState(member.jersey_number ?? '')
  const [position, setPosition] = useState(member.position      ?? '')
  const [dob,      setDob]      = useState(member.dob           ?? '')
  const [level,    setLevel]    = useState(member.level         ?? '')
  const [expanded, setExpanded] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const isDirty = grade     !== (member.grade         ?? '')
              || jersey    !== (member.jersey_number  ?? '')
              || position  !== (member.position       ?? '')
              || dob       !== (member.dob            ?? '')
              || level     !== (member.level          ?? '')

  const initials = `${member.first_name[0]}${member.last_name[0]}`

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="w-[480px] max-w-[95vw] gap-0 p-0 max-h-[90vh] overflow-y-auto">

        {/* Header — avatar + name + badges */}
        <DialogHeader className="px-6 pt-6 pb-5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-none">
              {initials}
            </div>
            <div className="min-w-0">
              <DialogTitle className={cn('text-lg leading-tight', member.graduated && 'italic')}>
                {member.first_name} {member.last_name}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-1.5 flex-wrap">
                {member.role === 'student_captain' && (
                  <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Captain</span>
                )}
                {member.level && (
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', levelColor(member.level, levels))}>
                    {member.level}
                  </span>
                )}
                {member.graduated && (
                  <span className="text-[11px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Graduated</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main info */}
        <div className="px-6 py-5 space-y-5">

          {/* Editable: grade + jersey */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grade</label>
              {canEdit ? (
                <input
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="e.g. 11"
                  className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-sm py-1.5">{member.grade ?? '—'}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jersey #</label>
              {canEdit ? (
                <input
                  value={jersey}
                  onChange={e => setJersey(e.target.value)}
                  placeholder="e.g. 23"
                  className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-sm py-1.5">{member.jersey_number ? `#${member.jersey_number}` : '—'}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Position</label>
              {canEdit ? (
                <input
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="e.g. Freestyle"
                  className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-sm py-1.5">{member.position ?? '—'}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date of Birth</label>
              {canEdit ? (
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-sm py-1.5">{member.dob ?? '—'}</p>
              )}
            </div>
            {levels.length > 0 && (
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Level</label>
                {canEdit ? (
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">— Not assigned —</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  <p className="text-sm py-1.5">{member.level ?? '—'}</p>
                )}
              </div>
            )}
          </div>

          {/* Student contact */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Student contact</p>
            {member.email ? (
              <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail className="w-3.5 h-3.5 flex-none" />
                {member.email}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            {member.phone && (
              <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone className="w-3.5 h-3.5 flex-none" />
                {member.phone}
              </a>
            )}
          </div>

          {member.graduated && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              This athlete has graduated and is no longer active.
            </p>
          )}

          {!canEdit && !member.graduated && (
            <p className="text-xs text-muted-foreground">
              Contact your head coach to update athlete information.
            </p>
          )}

          {/* Expandable: parent / guardian contacts */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Parent / Guardian contacts
                {member.parents && member.parents.length > 0 && (
                  <span className="ml-2 normal-case font-medium tracking-normal text-foreground">
                    ({member.parents.length})
                  </span>
                )}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform flex-none', expanded && 'rotate-180')} />
            </button>

            {expanded && (
              <div className="border-t divide-y">
                {!member.parents || member.parents.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No parent contacts on file.</p>
                ) : (
                  member.parents.map((p, i) => (
                    <div key={i} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.relationship && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{p.relationship}</span>
                        )}
                      </div>
                      <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Mail className="w-3.5 h-3.5 flex-none" />
                        {p.email}
                      </a>
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <Phone className="w-3.5 h-3.5 flex-none" />
                          {p.phone}
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Purge zone — district/school admin only */}
          {canPurge && (
            <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                Permanent data removal
              </p>
              {!confirmPurge ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Permanently deletes all records for this student — account, contact info, season history, and parent links. This cannot be undone.
                  </p>
                  <button
                    onClick={() => setConfirmPurge(true)}
                    className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge all data
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-destructive">
                    Are you sure? This permanently erases <span className="font-bold">{member.first_name} {member.last_name}</span>'s account and all associated records.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmPurge(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setConfirmPurge(false); onPurge() }}
                      className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:bg-destructive/90 transition-colors font-medium"
                    >
                      Yes, permanently delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {canEdit && (
          <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave({ grade: grade || undefined, jersey_number: jersey || undefined, position: position || undefined, dob: dob || undefined, level: level || undefined }); onClose() }}
              disabled={!isDirty}
              className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save changes
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


type SortCol = 'first_name' | 'last_name' | 'grade'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { col?: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1 inline-block" />
  return dir === 'asc'
    ? <ArrowUp className="w-3 h-3 ml-1 inline-block" />
    : <ArrowDown className="w-3 h-3 ml-1 inline-block" />
}

export default function TeamRoster() {
  const { sportId }   = useParams<{ sportId: string }>()
  const { user }      = useAuth()
  const queryClient   = useQueryClient()
  const numericSportId = Number(sportId)

  const [selectedMember, setSelectedMember] = useState<SportMember | null>(null)
  const [filterLevels, setFilterLevels] = useState<Set<string>>(new Set())
  const [filterGrades, setFilterGrades] = useState<Set<string>>(new Set())
  const [sortCol, setSortCol]         = useState<SortCol>('last_name')
  const [sortDir, setSortDir]         = useState<SortDir>('asc')

  const [editingLevels, setEditingLevels] = useState(false)
  const [draftLevels, setDraftLevels]     = useState<string[]>([])
  const [newLevelInput, setNewLevelInput] = useState('')
  const levelInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sport', numericSportId],
    queryFn: () => fetchSportDetail(numericSportId),
    enabled: !!sportId,
  })

  const sportLevels = data?.levels ?? []
  const isHeadCoach = data?.coaches?.find((c: SportCoach) => c.id === user?.id)?.role === 'head_coach'
  const isAdmin = user?.managing_role === 'district_admin' || user?.managing_role === 'school_admin' || user?.managing_role === 'athletic_director'
  const canEditRoster = isHeadCoach
  const canManageLevels = isHeadCoach || isAdmin
  const canPurge = user?.managing_role === 'district_admin' || user?.managing_role === 'school_admin'

  const saveMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: number; updates: SportMemberUpdate }) =>
      updateMember(numericSportId, userId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sport', numericSportId] }),
  })

  const purgeMutation = useMutation({
    mutationFn: (userId: number) => purgeStudentData(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport', numericSportId] })
      setSelectedMember(null)
      toast.success('Student data permanently deleted.')
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to delete student data.'),
  })

  const levelsMutation = useMutation({
    mutationFn: (levels: string[]) => updateSportLevels(numericSportId, levels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport', numericSportId] })
      setEditingLevels(false)
      toast.success('Levels updated.')
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to update levels.'),
  })

  function openLevelsEditor() {
    setDraftLevels([...(data?.levels ?? [])])
    setNewLevelInput('')
    setEditingLevels(true)
    setTimeout(() => levelInputRef.current?.focus(), 50)
  }

  function addDraftLevel() {
    const val = newLevelInput.trim()
    if (!val || draftLevels.includes(val)) { setNewLevelInput(''); return }
    setDraftLevels(prev => [...prev, val])
    setNewLevelInput('')
    levelInputRef.current?.focus()
  }

  function handleLevelInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addDraftLevel() }
    if (e.key === 'Escape') setEditingLevels(false)
  }

  function handleSave(member: SportMember, updates: SportMemberUpdate) {
    saveMutation.mutate({ userId: member.user_id, updates })
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const coaches = data?.members.filter(m => m.role === 'head_coach' || m.role === 'assistant_coach') ?? []

  const allAthletes = (data?.members
    .filter(m => m.role === 'student' || m.role === 'student_captain') ?? [])

  const grades = [...new Set(allAthletes.map(m => m.grade).filter(Boolean) as string[])]
    .sort((a, b) => Number(a) - Number(b))

  const athletes = allAthletes
    .filter(m => filterLevels.size === 0 || (m.level && filterLevels.has(m.level)))
    .filter(m => filterGrades.size === 0 || (m.grade && filterGrades.has(m.grade)))
    .sort((a, b) => {
      let cmp = 0
      if (sortCol === 'first_name') cmp = a.first_name.localeCompare(b.first_name)
      else if (sortCol === 'last_name') cmp = a.last_name.localeCompare(b.last_name)
      else if (sortCol === 'grade') cmp = (Number(a.grade) || 0) - (Number(b.grade) || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })

  const thClass = 'px-4 py-2 select-none cursor-pointer hover:text-foreground transition-colors whitespace-nowrap'

  return (
    <div className="px-10 py-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data?.name ?? 'Roster'}</h1>
        {data && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {SEASON_LABEL[data.season]} · {data.school_year} · {athletes.length} athlete{athletes.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading roster…</span>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Coaches — compact strip */}
          {coaches.length > 0 && (
            <div className="flex items-center gap-6 px-4 py-3 rounded-lg border bg-card">
              {coaches.map(c => (
                <div key={c.user_id} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-muted-foreground">{COACH_LABEL[c.role] ?? c.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Levels manager */}
          {canManageLevels && (
            <div className="rounded-lg border bg-card px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Levels</p>
                {!editingLevels && (
                  <button
                    onClick={openLevelsEditor}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {sportLevels.length === 0 ? 'Add levels' : 'Edit'}
                  </button>
                )}
              </div>

              {!editingLevels ? (
                sportLevels.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No levels defined. Add levels like "Varsity", "JV", or "C-Team" to organize your roster.
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sportLevels.map((l, i) => (
                      <span key={l} className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', LEVEL_COLORS[i % LEVEL_COLORS.length])}>
                        {l}
                      </span>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {draftLevels.map((l, i) => (
                      <span key={l} className={cn('flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', LEVEL_COLORS[i % LEVEL_COLORS.length])}>
                        {l}
                        <button
                          onClick={() => setDraftLevels(prev => prev.filter(x => x !== l))}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={levelInputRef}
                      value={newLevelInput}
                      onChange={e => setNewLevelInput(e.target.value)}
                      onKeyDown={handleLevelInputKey}
                      placeholder="New level (press Enter to add)"
                      className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={addDraftLevel}
                      className="text-xs px-3 py-1.5 border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setEditingLevels(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => levelsMutation.mutate(draftLevels)}
                      disabled={levelsMutation.isPending}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {levelsMutation.isPending ? 'Saving…' : 'Save levels'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {sportLevels.map((level, i) => (
              <button
                key={level}
                onClick={() => setFilterLevels(prev => {
                  const next = new Set(prev)
                  if (next.has(level)) next.delete(level); else next.add(level)
                  return next
                })}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-colors',
                  filterLevels.has(level)
                    ? cn(LEVEL_COLORS[i % LEVEL_COLORS.length], 'border-transparent')
                    : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                )}
              >
                {level}
              </button>
            ))}

            <div className="w-px h-4 bg-border self-center" />

            {grades.map(g => (
              <button
                key={g}
                onClick={() => setFilterGrades(prev => {
                  const next = new Set(prev)
                  if (next.has(g)) next.delete(g); else next.add(g)
                  return next
                })}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-colors',
                  filterGrades.has(g)
                    ? 'bg-primary/10 text-primary border-transparent'
                    : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                )}
              >
                Grade {g}
              </button>
            ))}

            {(filterLevels.size > 0 || filterGrades.size > 0) && (
              <button
                onClick={() => { setFilterLevels(new Set()); setFilterGrades(new Set()) }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Athletes — table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className={thClass} onClick={() => handleSort('first_name')}>
                    First Name <SortIcon col="first_name" active={sortCol === 'first_name'} dir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort('last_name')}>
                    Last Name <SortIcon col="last_name" active={sortCol === 'last_name'} dir={sortDir} />
                  </th>
                  <th className="px-4 py-2 w-48" />
                  <th className={cn(thClass, 'w-20')} onClick={() => handleSort('grade')}>
                    Grade <SortIcon col="grade" active={sortCol === 'grade'} dir={sortDir} />
                  </th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {athletes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No athletes match your filter.
                    </td>
                  </tr>
                )}
                {athletes.map((m, i) => (
                  <tr
                    key={m.user_id}
                    onClick={() => setSelectedMember(m)}
                    className={cn(
                      'cursor-pointer hover:bg-muted/30 transition-colors',
                      i < athletes.length - 1 && 'border-b',
                      m.graduated && 'opacity-60'
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className={cn('font-medium', m.graduated && 'italic')}>{m.first_name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('font-medium', m.graduated && 'italic')}>{m.last_name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {m.role === 'student_captain' && (
                          <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Captain</span>
                        )}
                        {m.level && (
                          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', levelColor(m.level, sportLevels))}>
                            {m.level}
                          </span>
                        )}
                        {m.graduated && (
                          <span className="text-[11px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Graduated</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.grade ?? '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.email ?? '—'}</td>
                    <td className="px-2 py-2.5 text-muted-foreground/40">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMember && (
        <AthleteDialog
          member={selectedMember}
          levels={sportLevels}
          canEdit={canEditRoster}
          canPurge={canPurge}
          onClose={() => setSelectedMember(null)}
          onSave={updates => handleSave(selectedMember, updates)}
          onPurge={() => purgeMutation.mutate(selectedMember.user_id)}
        />
      )}
    </div>
  )
}
