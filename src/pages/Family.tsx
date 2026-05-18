import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Trophy, Loader2, Smartphone, Users, Plus, MessageSquare, ChevronRight, X, ArrowLeft } from 'lucide-react'
import { fetchFamily, type Child, type ChildSport } from '@/api/family'
import {
  fetchFamilyGroups, createFamilyGroup,
  type FamilyGroup, type EligibleMember, type EligibleChild, type ParentSeason,
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
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
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
                <p className="text-xs text-muted-foreground">
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

function ParentRow({ member, checked, onToggle }: { member: EligibleMember; checked: boolean; onToggle: () => void }) {
  const initials    = member.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const displayName = member.child_name ? `${member.name} (${member.child_name})` : member.name
  return (
    <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
      <input type="checkbox" checked={checked} onChange={onToggle} className="rounded" />
      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex-none">
        {initials}
      </div>
      <span className="text-sm flex-1">{displayName}</span>
    </label>
  )
}

function ChildRow({ child, checked, onToggle }: { child: EligibleChild; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
      <input type="checkbox" checked={checked} onChange={onToggle} className="rounded" />
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
        {child.first_name.slice(0, 1)}
      </div>
      <span className="text-sm flex-1">{child.first_name}</span>
    </label>
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
  const [step,             setStep]            = useState<1 | 2>(1)
  const [name,             setName]            = useState('')
  const [seasonId,         setSeasonId]        = useState<number | null>(parentSeasons[0]?.id ?? null)
  const [selectedParents,  setSelectedParents] = useState<Set<number>>(new Set())
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())

  const season     = parentSeasons.find(s => s.id === seasonId)
  const eligible   = season?.eligible_members ?? []
  const myChildren = season?.my_children ?? []

  function advanceOrCreate() {
    if (myChildren.length === 0) {
      onCreate({ name: name.trim(), season_id: seasonId!, member_ids: [ ...selectedParents ] })
      return
    }
    setSelectedStudents(new Set(myChildren.map(c => c.id)))
    setStep(2)
  }

  function handleCreate() {
    onCreate({ name: name.trim(), season_id: seasonId!, member_ids: [ ...selectedParents, ...selectedStudents ] })
  }

  const canAdvance = name.trim().length > 0 && selectedParents.size > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="p-1 rounded-md hover:bg-muted transition-colors mr-1">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">
              {step === 1 ? 'New Group — Step 1 of 2' : 'New Group — Step 2 of 2'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Carpool Crew"
                  className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              {parentSeasons.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Season</label>
                  <select
                    value={seasonId ?? ''}
                    onChange={e => { setSeasonId(Number(e.target.value)); setSelectedParents(new Set()) }}
                    className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {parentSeasons.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invite parents</label>
                <p className="text-xs text-muted-foreground">
                  Select the parents you'd like to include. Their children will be available to add in the next step.
                </p>
                {eligible.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2">No other parents in this season.</p>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {eligible.map(m => (
                      <ParentRow
                        key={m.id}
                        member={m}
                        checked={selectedParents.has(m.id)}
                        onToggle={() => setSelectedParents(prev => {
                          const next = new Set(prev)
                          if (next.has(m.id)) next.delete(m.id); else next.add(m.id)
                          return next
                        })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add your kids</label>
              <p className="text-xs text-muted-foreground">
                Select which of your children to include. The other parents will add their own kids on their end.
              </p>
              <div className="space-y-0.5 mt-1">
                {myChildren.map(c => (
                  <ChildRow
                    key={c.id}
                    child={c}
                    checked={selectedStudents.has(c.id)}
                    onToggle={() => setSelectedStudents(prev => {
                      const next = new Set(prev)
                      if (next.has(c.id)) next.delete(c.id); else next.add(c.id)
                      return next
                    })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors">
            Cancel
          </button>
          {step === 1 ? (
            <button
              onClick={advanceOrCreate}
              disabled={!canAdvance}
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {myChildren.length > 0 ? 'Next — Add your kids' : 'Create group'}
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Create group
            </button>
          )}
        </div>
      </div>
    </div>
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
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-4xl space-y-10">
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
