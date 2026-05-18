import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldCheck, ShieldX, ChevronDown, ChevronUp, TrendingUp, MessageSquareWarning } from 'lucide-react'
import {
  fetchFlaggedMessages, reviewMessage, upholdChallenge, denyChallenge,
  type QuestionableMessage, type ChallengeItem, type SignalStats,
} from '@/api/flaggedMessages'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const CATEGORY_LABEL: Record<string, string> = {
  competitive_aggression: 'Competitive language',
  general_hostility:      'Hostile language',
  explicit_threat:        'Explicit threat',
  self_harm:              'Self-harm language',
  slur:                   'Slur or hate speech',
  off_platform_contact:   'Off-platform contact',
  unknown:                'Uncategorized',
}

const CATEGORY_COLOR: Record<string, string> = {
  competitive_aggression: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  general_hostility:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  explicit_threat:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  self_harm:              'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  slur:                   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  off_platform_contact:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  unknown:                'bg-muted text-muted-foreground',
}

function ScoreMeter({ score }: { score: number }) {
  const pct   = Math.round(score * 100)
  const color = score >= 0.75 ? 'bg-red-500' : score >= 0.55 ? 'bg-amber-500' : 'bg-yellow-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden flex-none">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  )
}

function LearningFeedback({ stats }: { stats: SignalStats }) {
  const rate = stats.approval_rate != null ? Math.round(stats.approval_rate * 100) : null
  return (
    <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
      <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-none" />
      <span>
        Gemma has learned from <strong>{stats.total}</strong> {stats.total === 1 ? 'review' : 'reviews'} of{' '}
        <strong>{CATEGORY_LABEL[stats.category] ?? stats.category}</strong> at this school.
        {rate != null && stats.total >= 3 && (
          <> {rate}% approval rate — Gemma will auto-approve similar messages next time.</>
        )}
        {stats.total < 3 && (
          <> {3 - stats.total} more {3 - stats.total === 1 ? 'review' : 'reviews'} needed before Gemma adjusts its threshold.</>
        )}
      </span>
    </div>
  )
}

function QuestionableCard({
  message,
  onReview,
  isPending,
}: {
  message:   QuestionableMessage
  onReview:  (id: number, action: 'approved' | 'rejected') => void
  isPending: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const category = message.flag_category ?? 'unknown'

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none mt-0.5">
          {message.sender.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{message.sender.name}</span>
            {message.sport && (
              <span className="text-xs text-muted-foreground">
                · {message.sport.gender === 'girls' ? 'Girls' : message.sport.gender === 'boys' ? 'Boys' : ''} {message.sport.name}
                {' · '}{message.sport.school_name}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">
              {new Date(message.sent_at).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </span>
          </div>

          <p className="text-sm bg-muted/40 rounded-md px-3 py-2 border-l-2 border-amber-400">
            {message.content}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', CATEGORY_COLOR[category] ?? CATEGORY_COLOR.unknown)}>
              {CATEGORY_LABEL[category] ?? category}
            </span>
            <ScoreMeter score={message.moderation_score ?? 0} />
            <span className="text-xs text-muted-foreground"># {message.channel.name}</span>
          </div>

          {message.report_notes && (
            <div className="flex items-start gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
              <MessageSquareWarning className="w-3.5 h-3.5 mt-0.5 flex-none text-amber-500" />
              <span className="text-muted-foreground"><strong className="text-amber-700 dark:text-amber-400">User reported:</strong> {message.report_notes}</span>
            </div>
          )}
          {message.flag_reason && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'Why was this flagged?'}
            </button>
          )}
          {expanded && message.flag_reason && (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
              {message.flag_reason}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
        <button
          onClick={() => onReview(message.id, 'rejected')}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border text-destructive border-destructive/60 bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldX className="w-3.5 h-3.5" />
          Remove from chat
        </button>
        <button
          onClick={() => onReview(message.id, 'approved')}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Looks fine
        </button>
      </div>
    </div>
  )
}

function ChallengeCard({
  item,
  onUphold,
  onDeny,
  isPending,
}: {
  item:      ChallengeItem
  onUphold:  (id: number) => void
  onDeny:    (id: number) => void
  isPending: boolean
}) {
  const [flagExpanded, setFlagExpanded] = useState(false)
  return (
    <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-card overflow-hidden">
      {/* Challenge header */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
        <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-none" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {item.sender.name} is challenging a blocked message
        </span>
      </div>

      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none mt-0.5">
          {item.sender.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{item.sender.name}</span>
            {item.sport && (
              <span className="text-xs text-muted-foreground">
                · {item.sport.gender === 'girls' ? 'Girls' : item.sport.gender === 'boys' ? 'Boys' : ''} {item.sport.name}
                {' · '}{item.sport.school_name}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">
              {new Date(item.sent_at).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </span>
          </div>

          {/* The blocked message */}
          <p className="text-sm bg-muted/40 rounded-md px-3 py-2 border-l-2 border-destructive/50">
            {item.content}
          </p>

          <ScoreMeter score={item.moderation_score ?? 0} />

          {/* Student's reason */}
          {item.challenge_reason && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 space-y-0.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Student's reason</p>
              <p className="text-xs text-foreground">"{item.challenge_reason}"</p>
            </div>
          )}

          {/* AI flag reason */}
          {item.flag_reason && (
            <button
              onClick={() => setFlagExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {flagExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {flagExpanded ? 'Hide' : 'Why was this flagged?'}
            </button>
          )}
          {flagExpanded && item.flag_reason && (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
              {item.flag_reason}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
        <button
          onClick={() => onDeny(item.id)}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border text-destructive border-destructive/60 bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldX className="w-3.5 h-3.5" />
          Keep blocked
        </button>
        <button
          onClick={() => onUphold(item.id)}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Uphold — send message
        </button>
      </div>
    </div>
  )
}

export default function Reviews() {
  const queryClient = useQueryClient()
  const [recentStats, setRecentStats] = useState<SignalStats | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['flagged_messages'],
    queryFn:  fetchFlaggedMessages,
    refetchInterval: 30_000,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approved' | 'rejected' }) =>
      reviewMessage(id, action),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['flagged_messages'] })
      if (result.signal_stats) setRecentStats(result.signal_stats)
      if (result.action_taken === 'approved') {
        toast.success('Got it — Gemma will be less likely to flag this next time.')
      } else {
        toast.success('Message removed from the chat.')
      }
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to review message.'),
  })

  const challengeMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'uphold' | 'deny' }) =>
      action === 'uphold' ? upholdChallenge(id) : denyChallenge(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['flagged_messages'] })
      if (result.action === 'upheld') {
        toast.success('Challenge upheld — message sent to the chat.')
      } else {
        toast.success('Challenge denied — message stays blocked.')
      }
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to process challenge.'),
  })

  const items = data ?? []
  const isPending = reviewMutation.isPending || challengeMutation.isPending

  return (
    <div className="px-10 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Message Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Questionable messages deliver normally but land here for Gemma training. Severe blocks can be challenged by students.
        </p>
      </div>

      {recentStats && <LearningFeedback stats={recentStats} />}

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-muted-foreground justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="rounded-lg border bg-card px-6 py-12 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-medium">All clear</p>
          <p className="text-xs text-muted-foreground">No messages pending review.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length !== 1 ? 'items' : 'item'} pending review
          </p>
          {items.map(item =>
            item.type === 'challenge' ? (
              <ChallengeCard
                key={`c-${item.id}`}
                item={item}
                onUphold={id => challengeMutation.mutate({ id, action: 'uphold' })}
                onDeny={id => challengeMutation.mutate({ id, action: 'deny' })}
                isPending={isPending}
              />
            ) : (
              <QuestionableCard
                key={`q-${item.id}`}
                message={item}
                onReview={(id, action) => reviewMutation.mutate({ id, action })}
                isPending={isPending}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
