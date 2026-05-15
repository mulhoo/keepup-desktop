import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { fetchSportDetail, sportDisplayName } from '@/api/sports'
import { fetchAnnouncements, sendAnnouncement, type Announcement } from '@/api/announcements'
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

function AnnouncementRow({ item }: { item: Announcement }) {
  return (
    <div className="px-5 py-4 flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-none mt-0.5">
        <Megaphone className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm leading-snug">{item.content}</p>
        <p className="text-[11px] text-muted-foreground">
          {item.sender.name} · {timeAgo(item.created_at)}
        </p>
      </div>
    </div>
  )
}

export default function TeamAnnouncements() {
  const { sportId } = useParams<{ sportId: string }>()
  const numericSportId = Number(sportId)
  const qc = useQueryClient()

  const [content,    setContent]    = useState('')
  const [sentResult, setSentResult] = useState<string[] | null>(null)

  const { data: sport } = useQuery({
    queryKey: ['sport', numericSportId],
    queryFn:  () => fetchSportDetail(numericSportId),
    enabled:  !!sportId,
  })

  const { data: allAnnouncements = [], isLoading } = useQuery({
    queryKey:        ['announcements'],
    queryFn:         fetchAnnouncements,
    refetchInterval: 60_000,
  })

  const teamAnnouncements = allAnnouncements.filter(a =>
    sport && a.sport_name === sport.name && a.gender === sport.gender
  )

  const { mutate: doSend, isPending: sending } = useMutation({
    mutationFn: sendAnnouncement,
    onSuccess: (result) => {
      setSentResult(result.sports)
      setContent('')
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setTimeout(() => setSentResult(null), 6000)
    },
  })

  function handleSend() {
    if (!content.trim() || sending) return
    setSentResult(null)
    doSend({ content: content.trim(), sport_ids: [numericSportId] })
  }

  const displayName = sport ? sportDisplayName(sport) : 'Team'

  return (
    <div className="px-10 py-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Send messages to {displayName} athletes and parents.
        </p>
      </div>

      {/* Composer */}
      <div className="rounded-xl border bg-card divide-y">
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            New announcement → {displayName}
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your announcement…"
            rows={4}
            className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-end">
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                content.trim() && !sending
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {sending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                : <><Send className="w-3.5 h-3.5" />Send</>
              }
            </button>
          </div>
        </div>

        {sentResult && (
          <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/20 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none mt-0.5" />
            <p className="text-xs text-emerald-800 dark:text-emerald-400">
              Sent to <span className="font-semibold">{sentResult.join(', ')}</span>
            </p>
          </div>
        )}
      </div>

      {/* Feed */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Announcements</h2>
        <div className="rounded-xl border bg-card divide-y">
          {isLoading ? (
            <div className="px-5 py-8 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />Loading…
            </div>
          ) : teamAnnouncements.length === 0 ? (
            <div className="px-5 py-8 text-sm text-muted-foreground text-center">
              No announcements yet for {displayName}.
            </div>
          ) : (
            teamAnnouncements.map(a => (
              <AnnouncementRow key={a.id} item={a} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
