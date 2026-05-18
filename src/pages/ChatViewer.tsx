import { useState, type FormEvent } from 'react'
import { format, subDays } from 'date-fns'
import { Search, MessageSquare, Flag, Trash2, ChevronDown, ChevronRight, Loader2, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchChats, flagConversation, type ChatStudentResult, type ChatMessage } from '@/api/safety'
import { useSafety } from '@/contexts/SafetyContext'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { getDestroyedIds } from '@/lib/destroyedStudents'

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <>{text}</>
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  )
}

function MessageRow({ msg, keyword, destroyedName }: { msg: ChatMessage; keyword: string; destroyedName?: string }) {
  const isDestroyed = !!destroyedName && msg.sender_name === destroyedName
  const displayName = isDestroyed ? 'Former Student' : msg.sender_name
  return (
    <div className={cn(
      'px-4 py-2.5 border-b last:border-0 flex gap-3',
      msg.flagged && 'bg-red-50/50 dark:bg-red-950/10',
      msg.deleted && 'opacity-50',
    )}>
      <div className="flex-none pt-0.5 space-y-1">
        {msg.flagged && <Flag className="w-3 h-3 text-red-500" />}
        {msg.deleted && <Trash2 className="w-3 h-3 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={cn('text-xs font-semibold', isDestroyed && 'italic text-muted-foreground')}>{displayName}</span>
          <span className="text-xs text-muted-foreground border rounded px-1">{isDestroyed ? 'student' : msg.sender_role}</span>
          <span className="text-xs text-muted-foreground ml-auto">{formatMsgTime(msg.sent_at)}</span>
        </div>
        <p className={cn('text-sm leading-snug', msg.deleted && 'italic text-muted-foreground')}>
          {msg.deleted ? '[Message deleted]' : <HighlightedText text={msg.content} keyword={keyword} />}
        </p>
        {msg.flag_action && (
          <span className="mt-0.5 inline-block text-xs text-red-600 dark:text-red-400 font-medium">
            Action: {msg.flag_action}
          </span>
        )}
      </div>
    </div>
  )
}

interface FlagTarget { studentName: string; channelId: number; channelName: string }

function FlagModal({ target, onClose }: { target: FlagTarget; onClose: () => void }) {
  const [note,    setNote]    = useState('')
  const [notifyAd,    setNotifyAd]    = useState(true)
  const [notifyAdmin, setNotifyAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    const notify: ('ad' | 'school_admin')[] = []
    if (notifyAd)    notify.push('ad')
    if (notifyAdmin) notify.push('school_admin')
    if (!notify.length) { toast.error('Select at least one recipient.'); return }

    setLoading(true)
    try {
      const res = await flagConversation({
        student_name: target.studentName,
        channel_id:   target.channelId,
        channel_name: target.channelName,
        note:         note.trim(),
        notify,
      })
      toast.success(
        res.notified.length
          ? `Flag sent to ${res.notified.join(', ')}.`
          : 'Flag logged. No recipients found for this school.'
      )
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send flag.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold">Flag conversation</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <p className="text-sm font-medium text-muted-foreground">{target.studentName} · #{target.channelName}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="flag-note">What did you see?</Label>
            <textarea
              id="flag-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Describe what you observed and why you're flagging this conversation…"
              rows={4}
              required
              className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Notify</Label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={notifyAd} onChange={e => setNotifyAd(e.target.checked)} className="rounded" />
              Athletic Director
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={notifyAdmin} onChange={e => setNotifyAdmin(e.target.checked)} className="rounded" />
              School Admin
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors">
              Cancel
            </button>
            <Button type="submit" disabled={loading || !note.trim()} className="gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send flag
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChannelAccordion({
  channel, keyword, studentName, destroyedName,
}: {
  channel:      ChatStudentResult['channels'][0]
  keyword:      string
  studentName:  string
  destroyedName?: string
}) {
  const [open,      setOpen]      = useState(true)
  const [flagging,  setFlagging]  = useState(false)
  const flaggedCount = channel.messages.filter(m => m.flagged).length

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <div className="flex items-center bg-muted/30">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex-1 flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
          >
            {open ? <ChevronDown className="w-3.5 h-3.5 flex-none text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 flex-none text-muted-foreground" />}
            <MessageSquare className="w-3.5 h-3.5 flex-none text-muted-foreground" />
            <span className="text-sm font-medium flex-1">#{channel.channel_name}</span>
            {channel.sport && <span className="text-xs text-muted-foreground">{channel.sport}</span>}
            <span className="text-xs text-muted-foreground">{channel.messages.length} msg{channel.messages.length !== 1 ? 's' : ''}</span>
            {flaggedCount > 0 && (
              <span className="text-xs text-red-600 font-medium ml-1">{flaggedCount} flagged</span>
            )}
          </button>
          <button
            onClick={() => setFlagging(true)}
            title="Flag this conversation to admin"
            className="px-3 py-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
        {open && (
          <div className="bg-card">
            {channel.messages.map(msg => (
              <MessageRow key={msg.id} msg={msg} keyword={keyword} destroyedName={destroyedName} />
            ))}
          </div>
        )}
      </div>

      {flagging && (
        <FlagModal
          target={{ studentName, channelId: channel.channel_id, channelName: channel.channel_name }}
          onClose={() => setFlagging(false)}
        />
      )}
    </>
  )
}

export default function ChatViewer() {
  const { logChatSearch } = useSafety()
  const destroyedIds = getDestroyedIds()

  const today    = format(new Date(), 'yyyy-MM-dd')
  const thirtyAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const [studentInput, setStudentInput] = useState('')
  const [from,         setFrom]         = useState(thirtyAgo)
  const [to,           setTo]           = useState(today)
  const [keyword,      setKeyword]       = useState('')
  const [results,      setResults]       = useState<ChatStudentResult[] | null>(null)
  const [notFound,     setNotFound]      = useState<string[]>([]) // members not found
  const [totalMessages, setTotalMessages] = useState(0)
  const [loading,      setLoading]       = useState(false)
  const [error,        setError]         = useState<string | null>(null)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const names = studentInput.split(',').map(s => s.trim()).filter(Boolean)
    if (!names.length) return

    setError(null)
    setResults(null)
    setNotFound([])
    setLoading(true)
    try {
      const res = await searchChats({ student_names: names, from, to, keyword: keyword || undefined })
      setResults(res.results)
      setNotFound(res.members_not_found ?? [])
      setTotalMessages(res.total_messages)

      const notes = `Students: ${names.join(', ')} | ${from}–${to}${keyword ? ` | keyword: "${keyword}"` : ''} | ${res.total_messages} messages found`
      logChatSearch(notes)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chat Viewer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search message history by student or staff member and date range. Every search is recorded in the audit log.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="rounded-lg border bg-card p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="student-names">
            Name(s) <span className="text-muted-foreground font-normal">(student or staff — separate multiple with commas)</span>
          </Label>
          <Input
            id="student-names"
            value={studentInput}
            onChange={e => setStudentInput(e.target.value)}
            placeholder="e.g. Jordan Lee, Chris Nguyen"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="from-date">From</Label>
            <Input id="from-date" type="date" value={from} onChange={e => setFrom(e.target.value)} max={to} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to-date">To</Label>
            <Input id="to-date" type="date" value={to} onChange={e => setTo(e.target.value)} min={from} max={today} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="keyword">
            Keyword filter <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search within messages…"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="gap-2" disabled={loading || !studentInput.trim()}>
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
            : <><Search className="w-4 h-4" />Search messages</>
          }
        </Button>
      </form>

      {/* Results */}
      {results !== null && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalMessages === 0
                ? 'No messages found.'
                : `${totalMessages} message${totalMessages !== 1 ? 's' : ''} across ${results.length} student${results.length !== 1 ? 's' : ''}`}
              {keyword && <span className="ml-1">matching <span className="font-medium">"{keyword}"</span></span>}
            </p>
          </div>

          {notFound.length > 0 && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              Not found: <span className="font-medium">{notFound.join(', ')}</span>
            </div>
          )}

          {results.map(student => {
            const isDestroyed = destroyedIds.has(student.student_id)
            const displayName = isDestroyed ? 'Former Student' : student.student_name
            return (
              <div key={student.student_id} className="space-y-3">
                <h3 className={cn('text-sm font-semibold', isDestroyed && 'italic text-muted-foreground')}>
                  {displayName}
                  {isDestroyed && (
                    <span className="ml-2 not-italic text-xs font-normal bg-muted px-1.5 py-0.5 rounded">data removed</span>
                  )}
                </h3>
                {student.channels.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-1">No messages in this date range.</p>
                ) : (
                  student.channels.map(channel => (
                    <ChannelAccordion
                      key={channel.channel_id}
                      channel={channel}
                      keyword={keyword}
                      studentName={student.student_name}
                      destroyedName={isDestroyed ? student.student_name : undefined}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
