import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Lock, ChevronDown, ChevronUp, Loader2, MessageSquare,
  ShieldCheck, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import {
  fetchFamilyChats, createViewRequest, alertCoachConversationAD,
  type ChildChats, type ParentConversation, type AccessRequest,
} from '@/api/family'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function timeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  const hours = Math.ceil(diff / (1000 * 60 * 60))
  if (hours <= 1)  return 'less than 1h'
  if (hours < 24)  return `${hours}h`
  return `${Math.ceil(hours / 24)}d`
}


function CoachLockedConversation({
  convId,
  childFirstName,
  coachName,
  staffRole,
}: {
  convId:         number
  childFirstName: string
  coachName:      string
  staffRole:      string | null
}) {
  const [notified,    setNotified]    = useState(false)
  const [dialogOpen,  setDialogOpen]  = useState(false)
  const [note,        setNote]        = useState('')

  const mutation = useMutation({
    mutationFn: (note: string) => alertCoachConversationAD(convId, note),
    onSuccess: () => {
      setNotified(true)
      setDialogOpen(false)
      setNote('')
    },
  })

  return (
    <div className="rounded-lg border bg-card px-4 py-3 space-y-3">
      <div className="flex items-center gap-3">
        <Lock className="w-4 h-4 text-muted-foreground flex-none" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium">{childFirstName} &amp; {coachName}</p>
            {staffRole && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full flex-none">
                <ShieldCheck className="w-2.5 h-2.5" />
                {staffRole}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coach conversations are confidential in order to maintain the coach-athlete relationship. If you have any concerns, please contact your child's AD.
          </p>
        </div>
      </div>

      <div className="border-t pt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Your Athletic Director can review this conversation privately.
        </p>
        {notified ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex-none">
            <CheckCircle2 className="w-3.5 h-3.5" />
            AD notified
          </span>
        ) : (
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex-none"
          >
            <AlertTriangle className="w-3 h-3" /> Alert AD
          </button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md gap-0 p-0">
          <DialogHeader className="px-5 py-4 border-b">
            <DialogTitle>Alert Athletic Director</DialogTitle>
            <DialogDescription>
              Leave a note for your AD explaining your concern. They will review the conversation privately.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4 space-y-3">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Describe your concern…"
              rows={4}
              className="w-full text-sm rounded-md border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDialogOpen(false); setNote('') }}
                className="px-3 py-1.5 rounded-md text-sm border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate(note)}
                disabled={!note.trim() || mutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {mutation.isPending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                  : <><AlertTriangle className="w-3.5 h-3.5" /> Send to AD</>
                }
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PeerLockedConversation({
  childId,
  childFirstName,
  accessRequest,
}: {
  childId:        number
  childFirstName: string
  accessRequest:  AccessRequest | null
}) {
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason]     = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ child_id, reason }: { child_id: number; reason: string }) =>
      createViewRequest(child_id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyChats'] })
      setShowForm(false)
      setReason('')
    },
  })

  const reqStatus = accessRequest?.status

  return (
    <div className="rounded-lg border bg-card px-4 py-3 space-y-3">
      <div className="flex items-center gap-3">
        <Lock className="w-4 h-4 text-muted-foreground flex-none" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{childFirstName} &amp; Student</p>
          <p className="text-xs text-muted-foreground mt-0.5">This conversation is private</p>
        </div>
        {reqStatus === 'pending' && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex-none">
            Pending AD approval
          </span>
        )}
        {reqStatus === 'denied' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-destructive hover:underline flex-none"
          >
            Request denied · try again
          </button>
        )}
        {!reqStatus && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-primary hover:underline flex-none"
          >
            Request access
          </button>
        )}
      </div>

      {showForm && (
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Your Athletic Director will review this request. Approval grants 48 hours of read-only access.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Briefly explain your concern…"
            rows={3}
            className="w-full text-sm rounded-md border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={() => mutation.mutate({ child_id: childId, reason })}
              disabled={!reason.trim() || mutation.isPending}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              onClick={() => { setShowForm(false); setReason('') }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


function ConversationThread({
  conv,
  childFirstName,
}: {
  conv:           ParentConversation
  childFirstName: string
}) {
  const [open, setOpen] = useState(false)
  const { other_participant: other, access } = conv

  const preview       = conv.last_message?.content ?? 'No messages'
  const previewSender = conv.last_message
    ? conv.last_message.is_child ? childFirstName : other.name
    : null

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Flagged banner */}
      {access.type === 'flagged' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-none" />
          Flagged by AI monitoring
        </div>
      )}

      {/* Approved banner */}
      {access.type === 'approved' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 flex-none" />
          Access approved{access.approved_by ? ` by ${access.approved_by}` : ''} · expires in {timeLeft(access.expires_at)}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-muted-foreground flex-none mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">
              {childFirstName} &amp; {other.name}
            </p>
            {other.staff_role && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full flex-none">
                <ShieldCheck className="w-2.5 h-2.5" />
                {other.staff_role}
              </span>
            )}
          </div>
          {conv.last_message && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              <span className="font-medium">{previewSender}:</span> {preview}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-none">
          {conv.last_message && (
            <span className="text-xs text-muted-foreground">
              {timeAgo(conv.last_message.sent_at)}
            </span>
          )}
          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t px-4 py-3 space-y-2 bg-muted/20">
          {conv.messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No messages</p>
          )}
          {conv.messages.map(msg => (
            <div
              key={msg.id}
              className={cn('flex flex-col max-w-[75%]', msg.is_child ? 'ml-auto items-end' : 'mr-auto items-start')}
            >
              <span className="text-xs text-muted-foreground mb-0.5 px-1">
                {msg.is_child ? childFirstName : other.name} · {timeAgo(msg.sent_at)}
              </span>
              <div
                className={cn(
                  'px-3 py-2 text-sm leading-snug',
                  msg.is_child
                    ? 'bg-primary text-primary-foreground rounded-t-lg rounded-bl-lg rounded-br-sm'
                    : 'bg-background border rounded-t-lg rounded-br-lg rounded-bl-sm',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


function ChildMessages({ child }: { child: ChildChats }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-none">
          {child.child_first_name[0]}
        </div>
        <div>
          <p className="font-semibold">{child.child_name}</p>
          <p className="text-xs text-muted-foreground">
            {child.conversations.length === 1
              ? '1 conversation'
              : `${child.conversations.length} conversations`}
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-[52px]">
        {child.conversations.length === 0 && (
          <p className="text-sm text-muted-foreground">No conversations yet.</p>
        )}
        {child.conversations.map(conv => {
          if (conv.access.type === 'coach') {
            return (
              <CoachLockedConversation
                key={conv.id}
                convId={conv.id}
                childFirstName={child.child_first_name}
                coachName={conv.other_participant.name}
                staffRole={conv.other_participant.staff_role}
              />
            )
          }
          if (conv.access.type === 'locked') {
            return (
              <PeerLockedConversation
                key={conv.id}
                childId={child.child_id}
                childFirstName={child.child_first_name}
                accessRequest={child.access_request}
              />
            )
          }
          return (
            <ConversationThread
              key={conv.id}
              conv={conv}
              childFirstName={child.child_first_name}
            />
          )
        })}
      </div>
    </div>
  )
}


function ParentGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1 max-w-sm">
          <p className="font-semibold">Safety &amp; Messaging</p>
          <p className="text-sm text-muted-foreground">
            Peer messages are private by default — you can request AD access if you have a concern. Coach conversations are always confidential.
          </p>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-md px-3 py-2 max-w-sm text-center">
          <span className="font-semibold">Demo:</span> click below to view. In production, this gate requires two-factor authentication via email code.
        </p>
        <button
          onClick={() => setUnlocked(true)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View messages
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          Viewing messages — read only
        </span>
        <button
          onClick={() => setUnlocked(false)}
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          Lock
        </button>
      </div>
      {children}
    </div>
  )
}


export default function FamilyMessages() {
  const { data: chats, isLoading, isError } = useQuery({
    queryKey: ['familyChats'],
    queryFn:  fetchFamilyChats,
  })

  return (
    <ParentGate>
      <div className="px-4 py-6 md:px-10 md:py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Safety</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Peer messages are private unless flagged by AI or approved by your Athletic Director. Coach conversations are confidential — contact your AD if you have a concern.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}

        {isError && (
          <div className="rounded-lg border p-6 text-sm text-destructive">
            Failed to load messages.
          </div>
        )}

        {chats && chats.length === 0 && (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            No conversations found.
          </div>
        )}

        {chats && chats.length > 0 && (
          <div className="space-y-10">
            {chats.map(child => (
              <ChildMessages key={child.child_id} child={child} />
            ))}
          </div>
        )}
      </div>
    </ParentGate>
  )
}
