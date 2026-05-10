import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronRight, ChevronDown, Loader2, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchSportDetail, DEMO_COACH_SPORTS, type SportMember } from '@/api/sports'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SEASON_LABEL: Record<string, string> = { fall: 'Fall', winter: 'Winter', spring: 'Spring' }
const COACH_LABEL: Record<string, string> = { head_coach: 'Head Coach', assistant_coach: 'Asst. Coach' }

// ── Athlete profile dialog ────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  )
}

function AthleteDialog({ member, canEdit, onClose, onSave }: {
  member: SportMember
  canEdit: boolean
  onClose: () => void
  onSave: (updates: Partial<SportMember>) => void
}) {
  const [grade,    setGrade]    = useState(member.grade         ?? '')
  const [jersey,   setJersey]   = useState(member.jersey_number ?? '')
  const [expanded, setExpanded] = useState(false)
  const isDirty = grade !== (member.grade ?? '') || jersey !== (member.jersey_number ?? '')

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
                {member.level === 'varsity' && (
                  <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">Varsity</span>
                )}
                {member.level === 'jv' && (
                  <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">JV</span>
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
          </div>

          {/* Read-only: position */}
          <InfoField label="Position" value={member.position} />

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
              onClick={() => { onSave({ grade, jersey_number: jersey }); onClose() }}
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

// ── Page ──────────────────────────────────────────────────────────────────────

type SortCol = 'first_name' | 'last_name' | 'grade'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { col?: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-30 ml-1 inline-block" />
  return dir === 'asc'
    ? <ArrowUp className="w-3 h-3 ml-1 inline-block" />
    : <ArrowDown className="w-3 h-3 ml-1 inline-block" />
}

export default function TeamRoster() {
  const { sportId }  = useParams<{ sportId: string }>()
  const { demoRole } = useAuth()
  const canEditRoster = DEMO_COACH_SPORTS[demoRole ?? '']?.[Number(sportId)] === 'head_coach'

  const [selectedMember, setSelectedMember] = useState<SportMember | null>(null)
  const [overrides, setOverrides] = useState<Record<number, Partial<SportMember>>>({})
  const [filterLevels, setFilterLevels] = useState<Set<string>>(new Set())
  const [filterGrades, setFilterGrades] = useState<Set<string>>(new Set())
  const [sortCol, setSortCol]         = useState<SortCol>('last_name')
  const [sortDir, setSortDir]         = useState<SortDir>('asc')

  const { data, isLoading } = useQuery({
    queryKey: ['sport', Number(sportId)],
    queryFn: () => fetchSportDetail(Number(sportId)),
    enabled: !!sportId,
  })

  const resolve = (m: SportMember): SportMember =>
    overrides[m.user_id] ? { ...m, ...overrides[m.user_id] } : m

  function handleSave(member: SportMember, updates: Partial<SportMember>) {
    setOverrides(prev => ({ ...prev, [member.user_id]: { ...prev[member.user_id], ...updates } }))
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const coaches = data?.members.filter(m => m.role === 'head_coach' || m.role === 'assistant_coach') ?? []

  const allAthletes = (data?.members
    .filter(m => m.role === 'student' || m.role === 'student_captain')
    .map(resolve) ?? [])

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
    <div className="px-6 py-8 max-w-7xl space-y-6">
      {/* Header */}
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

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['varsity', 'jv'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilterLevels(prev => {
                  const next = new Set(prev)
                  next.has(level) ? next.delete(level) : next.add(level)
                  return next
                })}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-colors',
                  filterLevels.has(level)
                    ? level === 'varsity'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent'
                    : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                )}
              >
                {level === 'jv' ? 'JV' : 'Varsity'}
              </button>
            ))}

            <div className="w-px h-4 bg-border self-center" />

            {grades.map(g => (
              <button
                key={g}
                onClick={() => setFilterGrades(prev => {
                  const next = new Set(prev)
                  next.has(g) ? next.delete(g) : next.add(g)
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
                        {m.level === 'varsity' && (
                          <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">Varsity</span>
                        )}
                        {m.level === 'jv' && (
                          <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">JV</span>
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
          canEdit={canEditRoster}
          onClose={() => setSelectedMember(null)}
          onSave={updates => handleSave(selectedMember, updates)}
        />
      )}
    </div>
  )
}
