import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Loader2, Users, UserPlus, X, Check } from 'lucide-react'
import {
  fetchFamilyGroups, fetchGroupMessages, sendGroupMessage, addFamilyGroupMembers,
  type FamilyGroup, type GroupMember, type EligibleMember, type EligibleChild,
} from '@/api/familyGroups'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

function MemberPill({ member }: { member: GroupMember }) {
  const isParent    = member.role === 'parent'
  const displayName = isParent && member.child_name
    ? `${member.name} (${member.child_name})`
    : isParent ? member.name : member.first_name
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-none',
        isParent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                 : 'bg-primary/10 text-primary'
      )}>
        {initials}
      </div>
      <span className="text-xs text-muted-foreground">{displayName}</span>
    </div>
  )
}

export default function FamilyGroupChat() {
  const { id } = useParams<{ id: string }>()
  const channelId = Number(id)
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: groupsData } = useQuery({
    queryKey: ['family-groups'],
    queryFn:  fetchFamilyGroups,
  })

  const group: FamilyGroup | undefined = groupsData?.groups.find(g => g.id === channelId)

  const existingIds = new Set(group?.members.map(m => m.id) ?? [])
  const season      = groupsData?.parent_seasons.find(s => s.id === group?.season.id)
  const addableParents: EligibleMember[] = season?.eligible_members.filter(m => !existingIds.has(m.id)) ?? []
  const addableKids:    EligibleChild[]  = season?.my_children.filter(c => !existingIds.has(c.id)) ?? []
  const hasAddable = addableParents.length > 0 || addableKids.length > 0

  const addMutation = useMutation({
    mutationFn: (ids: number[]) => addFamilyGroupMembers(channelId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-groups'] })
      setShowAddPanel(false)
      setSelectedToAdd(new Set())
      toast.success('Members added.')
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to add members.'),
  })

  function toggleAdd(id: number) {
    setSelectedToAdd(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['group-messages', channelId],
    queryFn:  () => fetchGroupMessages(channelId),
    refetchInterval: 10_000,
    enabled: !!channelId,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendGroupMessage(channelId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-messages', channelId] })
      queryClient.invalidateQueries({ queryKey: ['family-groups'] })
      setDraft('')
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to send.'),
  })

  const handleSend = () => {
    const content = draft.trim()
    if (!content || sendMutation.isPending) return
    sendMutation.mutate(content)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-card flex-none">
        <div className="px-6 py-4 flex items-start gap-3">
          <button
            onClick={() => navigate('/dashboard/family')}
            className="mt-0.5 p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground flex-none" />
              <h1 className="text-base font-semibold truncate">{group?.name ?? 'Group'}</h1>
            </div>
            {group && (
              <p className="text-xs text-muted-foreground mt-0.5">{group.season.name}</p>
            )}
            {group && (
              <div className="flex flex-wrap gap-3 mt-2">
                {group.members.map(m => (
                  <MemberPill key={m.id} member={m} />
                ))}
              </div>
            )}
          </div>
          {hasAddable && (
            <button
              onClick={() => { setShowAddPanel(v => !v); setSelectedToAdd(new Set()) }}
              className={cn(
                'mt-0.5 p-1.5 rounded-md transition-colors flex-none',
                showAddPanel ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
              )}
              title="Add members"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Add members panel */}
        {showAddPanel && (
          <div className="px-6 pb-4 space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add members</p>
              <button onClick={() => setShowAddPanel(false)} className="p-0.5 rounded hover:bg-muted transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {addableParents.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground px-1 mb-1">Parents</p>
                {addableParents.map(m => {
                  const displayName = m.child_name ? `${m.name} (${m.child_name})` : m.name
                  const checked     = selectedToAdd.has(m.id)
                  return (
                    <label key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={checked} onChange={() => toggleAdd(m.id)} className="rounded" />
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex-none">
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm">{displayName}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {addableKids.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground px-1 mb-1">Your kids</p>
                {addableKids.map(c => {
                  const checked = selectedToAdd.has(c.id)
                  return (
                    <label key={c.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={checked} onChange={() => toggleAdd(c.id)} className="rounded" />
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
                        {c.first_name[0]}
                      </div>
                      <span className="text-sm">{c.first_name}</span>
                    </label>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => addMutation.mutate([...selectedToAdd])}
              disabled={selectedToAdd.size === 0 || addMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {addMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />
              }
              Add {selectedToAdd.size > 0 ? `${selectedToAdd.size} member${selectedToAdd.size > 1 ? 's' : ''}` : 'members'}
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No messages yet. Say hello!
          </div>
        )}

        {messages.map(msg => {
          const isMe = user && msg.sender_id === user.id
          return (
            <div key={msg.id} className={cn('flex flex-col gap-0.5', isMe ? 'items-end' : 'items-start')}>
              {!isMe && (
                <span className="text-xs text-muted-foreground px-1">{msg.sender}</span>
              )}
              <div className={cn(
                'max-w-[72%] rounded-2xl px-3.5 py-2 text-sm',
                isMe
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border rounded-bl-sm'
              )}>
                {msg.indicator
                  ? <span className="opacity-60 italic">{msg.indicator} Message blocked</span>
                  : msg.content
                }
              </div>
              <span className="text-xs text-muted-foreground px-1">
                {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-none border-t bg-card px-6 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message the group…"
            className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity flex-none"
          >
            {sendMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
