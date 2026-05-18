import { Trophy, ChevronRight, Users } from 'lucide-react'
import { useBranding } from '@/contexts/BrandingContext'
import { sportDisplayName, type Sport } from '@/api/sports'
import { SeasonBadge } from './SportBadges'
import { cn } from '@/lib/utils'

export function SportCard({ sport, coachRole, onClick }: {
  sport:      Sport
  coachRole?: 'head_coach' | 'assistant_coach'
  onClick:    () => void
}) {
  const { getSportBranding } = useBranding()
  const branding = getSportBranding(sport.id)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4 flex items-center gap-4 group"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-none overflow-hidden">
        {branding.icon_url
          ? <img src={branding.icon_url} alt="" className="w-full h-full object-cover" />
          : <Trophy className="w-4 h-4 text-primary" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{sportDisplayName(sport)}</p>
          <SeasonBadge season={sport.season} />
          {coachRole && (
            <span className={cn(
              'text-xs font-semibold px-1.5 py-0.5 rounded flex-none',
              coachRole === 'head_coach'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              {coachRole === 'head_coach' ? 'Head Coach' : 'Asst. Coach'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <Users className="w-3 h-3" />{sport.athlete_count} athletes
          {sport.record && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="font-semibold text-foreground tabular-nums">
                {sport.record.wins}–{sport.record.losses}
                {sport.record.ties ? `–${sport.record.ties}` : ''}
              </span>
              <span>this season</span>
            </>
          )}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none" />
    </button>
  )
}

export function DistrictSportCard({ name, season, instances, onClick }: {
  name:      string
  season:    string
  instances: Sport[]
  onClick:   () => void
}) {
  const totalAthletes = instances.reduce((sum, s) => sum + s.athlete_count, 0)
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4 flex items-center gap-4 group"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-none">
        <Trophy className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{name}</p>
          <SeasonBadge season={season} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <Users className="w-3 h-3" />{totalAthletes} athletes
          <span className="text-muted-foreground/50">·</span>
          {instances.length} school{instances.length !== 1 ? 's' : ''}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none" />
    </button>
  )
}
