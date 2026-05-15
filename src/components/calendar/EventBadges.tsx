import { cn } from '@/lib/utils'
import type { EventType, HomeAway } from '@/api/calendar'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  game: 'Game', meet: 'Meet', practice: 'Practice', tournament: 'Tournament', other: 'Other',
}

export const HOME_AWAY_LABELS: Record<HomeAway, string> = {
  home: 'Home', away: 'Away', neutral: 'Neutral',
}

export function eventTypeClass(type: EventType): string {
  const map: Record<EventType, string> = {
    game:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    meet:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    practice:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    tournament: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    other:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return map[type]
}

export function EventTypeBadge({ type }: { type: EventType }) {
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', eventTypeClass(type))}>
      {EVENT_TYPE_LABELS[type]}
    </span>
  )
}

export function HomeAwayBadge({ ha }: { ha: HomeAway }) {
  const colors: Record<HomeAway, string> = {
    home:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    away:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', colors[ha])}>
      {HOME_AWAY_LABELS[ha]}
    </span>
  )
}

export function HomeAwayLabel({ ha }: { ha: HomeAway }) {
  const map: Record<HomeAway, { label: string; cls: string }> = {
    home:    { label: 'Home',    cls: 'text-green-600 dark:text-green-400' },
    away:    { label: 'Away',    cls: 'text-orange-500 dark:text-orange-400' },
    neutral: { label: 'Neutral', cls: 'text-muted-foreground' },
  }
  const { label, cls } = map[ha]
  return <span className={cn('text-xs font-medium', cls)}>{label}</span>
}

export function CancelledBadge() {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      Cancelled
    </span>
  )
}

export function PostponedBadge() {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
      Postponed
    </span>
  )
}

const SPORT_PALETTE = [
  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
]

export function sportChipColor(index: number): string {
  return SPORT_PALETTE[index % SPORT_PALETTE.length]
}
