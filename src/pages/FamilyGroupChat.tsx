import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Loader2, Users } from 'lucide-react'
import { fetchFamilyGroups, fetchGroupMessages, sendGroupMessage, type FamilyGroup } from '@/api/familyGroups'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

function MemberPill({ name, role }: { name: string; role: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const isParent = role === 'parent'
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-none',
        isParent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                 : 'bg-primary/10 text-primary'
      )}>
        {initials}
      </div>
      <span className="text-xs text-muted-foreground">{name}</span>
      {isParent && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
          Parent
        </span>
      )}
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
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: groupsData } = useQuery({
    queryKey: ['family-groups'],
    queryFn:  fetchFamilyGroups,
  })

  const group: FamilyGroup | undefined = groupsData?.groups.find(g => g.id === channelId)

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
      <div className="px-6 py-4 border-b bg-card flex items-start gap-3 flex-none">
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
                <MemberPill key={m.id} name={m.name} role={m.role} />
              ))}
            </div>
          )}
        </div>
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
                <span className="text-[11px] text-muted-foreground px-1">{msg.sender}</span>
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
              <span className="text-[10px] text-muted-foreground px-1">
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
