import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, isFuture } from 'date-fns'
import { Megaphone, Send, CheckCircle2, Loader2, Clock, CalendarClock, X, ShieldCheck } from 'lucide-react'
import { fetchSportDetail, sportDisplayName } from '@/api/sports'
import { fetchAnnouncements, sendAnnouncement, type Announcement } from '@/api/announcements'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function SidebarRow({ item }: { item: Announcement }) {
  const isScheduled = item.scheduled_at && isFuture(parseISO(item.scheduled_at))
  return (
    <div className="flex gap-3 py-3 px-4">
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-none mt-0.5',
        isScheduled ? 'bg-amber-500/10' : 'bg-primary/10',
      )}>
        {isScheduled
          ? <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
          : <Megaphone className="w-3.5 h-3.5 text-primary" />
        }
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs leading-snug line-clamp-3">{item.content}</p>
        <p className="text-xs text-muted-foreground">
          {isScheduled
            ? `Scheduled · ${format(parseISO(item.scheduled_at!), 'MMM d, h:mm a')}`
            : `${item.sender.name} · ${timeAgo(item.created_at)}`
          }
        </p>
      </div>
    </div>
  )
}

export default function TeamAnnouncements() {
  const { sportId } = useParams<{ sportId: string }>()
  const { effectiveRole } = useAuth()
  const numericSportId = Number(sportId)
  const qc = useQueryClient()

  const isHeadCoach    = effectiveRole === 'head_coach'
  const isCommissioner = effectiveRole === 'sports_commissioner'
  const canSend        = isHeadCoach || isCommissioner

  const [content,      setContent]      = useState('')
  const [scheduling,   setScheduling]   = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('08:00')
  const [sentResult,   setSentResult]   = useState<{ label: string; scheduled_at: string | null } | null>(null)

  const { data: sport } = useQuery({
    queryKey: ['sport', numericSportId],
    queryFn:  () => fetchSportDetail(numericSportId),
    enabled:  !!sportId,
  })

  const { data, isLoading } = useQuery({
    queryKey:        ['announcements', numericSportId],
    queryFn:         fetchAnnouncements,
    refetchInterval: 60_000,
  })

  const allSent      = data?.sent      ?? []
  const allScheduled = data?.scheduled ?? []

  const teamSent      = allSent.filter(a => a.sports.some(s => s.id === numericSportId))
  const teamScheduled = allScheduled.filter(a => a.sports.some(s => s.id === numericSportId))
  const { mutate: doSend, isPending: sending } = useMutation({
    mutationFn: sendAnnouncement,
    onSuccess: (result) => {
      setSentResult({ label: result.label, scheduled_at: result.scheduled_at })
      setContent('')
      setScheduling(false)
      setScheduleDate('')
      setScheduleTime('08:00')
      qc.invalidateQueries({ queryKey: ['announcements', numericSportId] })
      setTimeout(() => setSentResult(null), 6000)
    },
  })

  function handleSend() {
    if (!content.trim() || sending) return
    setSentResult(null)
    const params: Parameters<typeof sendAnnouncement>[0] = {
      content:   content.trim(),
      sport_ids: [numericSportId],
    }
    if (scheduling && scheduleDate) {
      params.scheduled_at = `${scheduleDate}T${scheduleTime}:00`
    }
    doSend(params)
  }

  const displayName = sport ? sportDisplayName(sport) : 'Team'

  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() + 5)
  const minDateStr = minDate.toISOString().slice(0, 10)

  const scheduleReady = scheduling && !!scheduleDate

  return (
    <div className="px-10 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Send messages to {displayName} athletes and parents.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 items-start">

        {/* Composer */}
        <div className="space-y-4">
          {canSend && (
            <div className="rounded-xl border bg-card divide-y">
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  New announcement → {displayName}
                </p>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your announcement…"
                  rows={5}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                {/* Schedule picker */}
                {scheduling && (
                  <div className="flex items-center gap-2 flex-wrap rounded-lg bg-muted/40 px-3 py-2.5 border">
                    <CalendarClock className="w-4 h-4 text-muted-foreground flex-none" />
                    <span className="text-xs text-muted-foreground mr-1">Send on</span>
                    <input
                      type="date"
                      value={scheduleDate}
                      min={minDateStr}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-xs text-muted-foreground">at</span>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => { setScheduling(false); setScheduleDate(''); setScheduleTime('08:00') }}
                      className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3 h-3 text-violet-500 flex-none" />
                  <span>Content moderated by Gemma 4</span>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  {!scheduling && (
                    <button
                      onClick={() => setScheduling(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Schedule
                    </button>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={!content.trim() || sending || (scheduling && !scheduleDate)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      content.trim() && !sending && (!scheduling || scheduleDate)
                        ? scheduleReady
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed',
                    )}
                  >
                    {sending
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                      : scheduleReady
                        ? <><CalendarClock className="w-3.5 h-3.5" />Schedule</>
                        : <><Send className="w-3.5 h-3.5" />Send</>
                    }
                  </button>
                </div>
              </div>

              {sentResult && (
                <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/20 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none mt-0.5" />
                  <p className="text-xs text-emerald-800 dark:text-emerald-400">
                    {sentResult.scheduled_at
                      ? <>Scheduled for <span className="font-semibold">{format(parseISO(sentResult.scheduled_at), 'MMM d, h:mm a')}</span> → {sentResult.label}</>
                      : <>Sent to <span className="font-semibold">{sentResult.label}</span></>
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Full feed below composer */}
          <div>
            <h2 className="text-sm font-semibold mb-3">All Announcements</h2>
            <div className="rounded-xl border bg-card divide-y">
              {isLoading ? (
                <div className="px-5 py-8 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />Loading…
                </div>
              ) : teamSent.length === 0 ? (
                <div className="px-5 py-8 text-sm text-muted-foreground text-center">
                  No announcements yet for {displayName}.
                </div>
              ) : (
                teamSent.map(a => (
                  <div key={a.id} className="px-5 py-4 flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-none mt-0.5">
                      <Megaphone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm leading-snug">{a.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.sender.name} · {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sticky top-6 space-y-4">
          {teamScheduled.length > 0 && (
            <div className="rounded-xl border bg-card">
              <div className="px-4 pt-3 pb-2 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                  Scheduled
                </p>
              </div>
              <div className="divide-y">
                {teamScheduled.map(a => <SidebarRow key={a.id} item={a} />)}
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-card">
            <div className="px-4 pt-3 pb-2 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recent
              </p>
            </div>
            {isLoading ? (
              <div className="px-4 py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…
              </div>
            ) : teamSent.length === 0 ? (
              <div className="px-4 py-6 text-xs text-muted-foreground text-center">
                Nothing sent yet.
              </div>
            ) : (
              <div className="divide-y">
                {teamSent.slice(0, 5).map(a => <SidebarRow key={a.id} item={a} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
