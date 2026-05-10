import { useQuery } from '@tanstack/react-query'
import { Trophy, Loader2, Smartphone } from 'lucide-react'
import { fetchFamily, type Child, type ChildSport } from '@/api/family'
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
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function SportCard({ sport }: { sport: ChildSport }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Sport header */}
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

      {/* Coaches */}
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

      {/* Recent announcements */}
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

export default function Family() {
  const { data: children, isLoading, isError } = useQuery({
    queryKey: ['family'],
    queryFn: fetchFamily,
  })

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Family</h1>
        <p className="text-sm text-muted-foreground mt-1">Your children and their sports.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border p-6 text-sm text-destructive">
          Failed to load family data.
        </div>
      )}

      {children && children.length === 0 && (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No children linked to your account yet.
        </div>
      )}

      {children && children.length > 0 && (
        <div className="space-y-10">
          {children.map(child => (
            <ChildSection key={child.id} child={child} />
          ))}
        </div>
      )}

      {/* Mobile nudge */}
      <div className="rounded-lg border border-dashed p-4 flex items-start gap-3 text-sm text-muted-foreground">
        <Smartphone className="w-4 h-4 flex-none mt-0.5" />
        <p>To message coaches or receive real-time updates, use the KeepUp mobile app.</p>
      </div>
    </div>
  )
}
