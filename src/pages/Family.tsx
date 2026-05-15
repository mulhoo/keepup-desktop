import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Trophy, Loader2, Smartphone, Users, Plus, MessageSquare, ChevronRight, X } from 'lucide-react'
import { fetchFamily, type Child, type ChildSport } from '@/api/family'
import {
  fetchFamilyGroups, createFamilyGroup,
  type FamilyGroup, type EligibleMember, type ParentSeason,
} from '@/api/familyGroups'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const SEASON_LABEL: Record<string, string> = { fall: 'Fall', winter: 'Winter', spring: 'Spring' }
const SEASON_COLOR: Record<string, string> = {
  fall:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  winter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  spring: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
const COACH_LABEL: Record<string, string> = {
  head_coach:      'Head Coach',
  assistant_coach: 'Asst. Coach',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function SportCard({ sport }: { sport: ChildSport }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-none mt-0.5">
          <Trophy className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{sport.sport_name}</p>
            <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">{sport.level}</span>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', SEASON_COLOR[sport.athletic_season])}>
              {SEASON_LABEL[sport.athletic_season]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{sport.school_name}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Coaching Staff</p>
        <div className="space-y-1">
          {sport.coaches.map(coach => (
            <div key={coach.name} className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary flex-none">
                {coach.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="font-medium">{coach.name}</span>
              <span className="text-xs text-muted-foreground">{COACH_LABEL[coach.role]}</span>
            </div>
          ))}
        </div>
      </div>

      {sport.recent_announcements.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Recent Announcements
          </p>
          <div className="space-y-2">
            {sport.recent_announcements.map(a => (
              <div key={a.id} className="rounded-md bg-muted/50 px-3 py-2 space-y-0.5">
                <p className="text-xs text-foreground leading-snug">{a.content}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.sender_name} · {timeAgo(a.sent_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChildSection({ child }: { child: Child }) {
  const initials = `${child.first_name[0]}${child.last_name[0]}`
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-none">
          {initials}
        </div>
        <div>
          <p className="font-semibold">{child.first_name} {child.last_name}</p>
          <p className="text-xs text-muted-foreground">
            {child.sports.length === 1 ? '1 active sport' : `${child.sports.length} active sports`}
          </p>
        </div>
      </div>
      <div className="space-y-3 pl-[52px]">
        {child.sports.map(sport => (
          <SportCard key={sport.season_id} sport={sport} />
        ))}
      </div>
    </div>
  )
}

function GroupCard({ group, onClick }: { group: FamilyGroup; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card px-4 py-3.5 hover:bg-muted/30 transition-colors flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-none">
        <Users className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{group.name}</p>
          <span className="text-xs text-muted-foreground flex-none">· {group.season.name}</span>
        </div>
        {group.last_message ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            <span className="font-medium">{group.last_message.sender}:</span> {group.last_message.content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">{group.member_count} members · No messages yet</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-none" />
    </button>
  )
}

function CreateGroupModal({
  parentSeasons,
  onClose,
  onCreate,
}: {
  parentSeasons: ParentSeason[]
  onClose:       () => void
  onCreate:      (data: { name: string; season_id: number; member_ids: number[] }) => void
}) {
  const [name,       setName]      = useState('')
  const [seasonId,   setSeasonId]  = useState<number | null>(parentSeasons[0]?.id ?? null)
  const [selected,   setSelected]  = useState<Set<number>>(new Set())

  const season = parentSeasons.find(s => s.id === seasonId)
  const eligible = season?.eligible_members ?? []
  const parents  = eligible.filter(m => m.role === 'parent')
  const students = eligible.filter(m => m.role === 'student')

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const validationError = useMemo((): string | null => {
    if (!name.trim()) return 'Group name is required'
    const selectedStudentIds = students.filter(m => selected.has(m.id)).map(m => m.id)
    for (const s of selectedStudentIds) {
      const student = eligible.find(m => m.id === s)
      if (!student) continue
      const hasParent = student.child_ids.length === 0
        ? true
        : parents.some(p => selected.has(p.id) && p.child_ids.includes(s))
      if (!hasParent) {
        const sName = student.name.split(' ')[0]
        return `${sName} is selected but their parent isn't — add their parent too`
      }
    }
    return null
  }, [name, selected, students, parents, eligible])

  const error = (selected.size > 0 || name) ? validationError : null

  const handleCreate = () => {
    if (validationError) { toast.error(validationError); return }
    onCreate({ name: name.trim(), season_id: seasonId!, member_ids: Array.from(selected) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">New Family Group</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Carpool Crew"
              className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Season */}
          {parentSeasons.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Season</label>
              <select
                value={seasonId ?? ''}
                onChange={e => { setSeasonId(Number(e.target.value)); setSelected(new Set()) }}
                className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
              >
                {parentSeasons.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Members */}
          {season && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add members</label>
              <p className="text-xs text-muted-foreground">
                Every student you add must have at least one of their parents in the group.
              </p>

              {parents.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground mt-2">Parents</p>
                  {parents.map(m => (
                    <MemberRow key={m.id} member={m} checked={selected.has(m.id)} onToggle={() => toggle(m.id)} />
                  ))}
                </div>
              )}

              {students.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground mt-2">Students</p>
                  {students.map(m => (
                    <MemberRow key={m.id} member={m} checked={selected.has(m.id)} onToggle={() => toggle(m.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!!validationError}
            className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Create group
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberRow({ member, checked, onToggle }: { member: EligibleMember; checked: boolean; onToggle: () => void }) {
  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
      <input type="checkbox" checked={checked} onChange={onToggle} className="rounded" />
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary flex-none">
        {initials}
      </div>
      <span className="text-sm flex-1">{member.name}</span>
      <span className={cn(
        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
        member.role === 'parent'
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-primary/10 text-primary'
      )}>
        {member.role === 'parent' ? 'Parent' : 'Student'}
      </span>
    </label>
  )
}

export default function Family() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: children, isLoading: childrenLoading, isError } = useQuery({
    queryKey: ['family'],
    queryFn:  fetchFamily,
  })

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['family-groups'],
    queryFn:  fetchFamilyGroups,
  })

  const createMutation = useMutation({
    mutationFn: createFamilyGroup,
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['family-groups'] })
      setShowCreate(false)
      navigate(`/dashboard/family-group/${group.id}`)
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to create group.'),
  })

  const groups        = groupsData?.groups ?? []
  const parentSeasons = groupsData?.parent_seasons ?? []

  return (
    <div className="px-10 py-8 max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Family</h1>
        <p className="text-sm text-muted-foreground mt-1">Your children and their sports.</p>
      </div>

      {/* Children section */}
      {childrenLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border p-6 text-sm text-destructive">
          Failed to load family data.
        </div>
      )}

      {children && children.length > 0 && (
        <div className="space-y-10">
          {children.map(child => (
            <ChildSection key={child.id} child={child} />
          ))}
        </div>
      )}

      {/* Family groups section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Family Groups</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Group chats with other parents and students — scoped to a season.
            </p>
          </div>
          {parentSeasons.length > 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New group
            </button>
          )}
        </div>

        {groupsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}

        {!groupsLoading && groups.length === 0 && (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center space-y-2">
            <Users className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No family groups yet.</p>
            {parentSeasons.length > 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs text-primary hover:underline"
              >
                Create one to coordinate carpools and logistics with other families.
              </button>
            )}
          </div>
        )}

        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={() => navigate(`/dashboard/family-group/${group.id}`)}
          />
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-4 flex items-start gap-3 text-sm text-muted-foreground">
        <Smartphone className="w-4 h-4 flex-none mt-0.5" />
        <p>To message coaches or receive real-time updates, use the KeepUp mobile app.</p>
      </div>

      {showCreate && (
        <CreateGroupModal
          parentSeasons={parentSeasons}
          onClose={() => setShowCreate(false)}
          onCreate={data => createMutation.mutate(data)}
        />
      )}
    </div>
  )
}
