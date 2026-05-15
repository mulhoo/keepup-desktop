import { format, parseISO, endOfMonth, addMonths } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Clock, MapPin, Trophy, Users, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchSports } from '@/api/sports'
import { fetchSchedule } from '@/api/calendar'
import { EventTypeBadge, HomeAwayLabel, sportChipColor } from '@/components/calendar/EventBadges'
import { SeasonBadge } from '@/components/sports/SportBadges'
import { cn } from '@/lib/utils'

const today = new Date()
const FROM   = format(today, 'yyyy-MM-dd')
const TO     = format(endOfMonth(addMonths(today, 2)), 'yyyy-MM-dd')

export function CommissionerOverview() {
  const { user } = useAuth()

  const { data: allSports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn:  () => fetchSports(),
  })

  const { data: events = [] } = useQuery({
    queryKey: ['schedule', FROM, TO],
    queryFn:  () => fetchSchedule({ from: FROM, to: TO }),
  })

  const sports      = allSports.filter(s => s.name.toLowerCase().includes('swimming'))
  const schoolYears = [...new Set(sports.map(s => s.school_year))].sort().reverse()
  const currentYear = schoolYears[0] ?? ''
  const teams       = sports.filter(s => s.school_year === currentYear)

  const totalAthletes = teams.reduce((sum, s) => sum + s.athlete_count, 0)
  const schoolCount   = new Set(teams.map(s => s.school_id)).size

  const upcomingEvents = events
    .filter(e => new Date(e.starts_at) >= today)
    .slice(0, 5)

  const sportNames = [...new Set(events.map(e => e.sport_name))].sort()

  return (
    <div className="px-10 py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.first_name}. Here's what's happening across your sports.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={teams.length}   label="Teams"    />
        <StatCard value={totalAthletes}  label="Athletes" />
        <StatCard value={schoolCount}    label="Schools"  />
      </div>

      {/* Upcoming events */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Upcoming Events</h2>
          <Link to="/dashboard/calendar" className="text-xs text-primary hover:underline">
            View schedule →
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No upcoming events.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map(event => {
              const sportIdx = sportNames.indexOf(event.sport_name)
              return (
                <div
                  key={event.id}
                  className={cn('border rounded-lg p-4 bg-card', event.status === 'cancelled' && 'opacity-60')}
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', sportChipColor(sportIdx))}>
                      {event.sport_name}
                    </span>
                    <EventTypeBadge type={event.event_type} />
                    <HomeAwayLabel ha={event.home_away} />
                  </div>
                  <p className="font-medium text-sm">{event.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {format(parseISO(event.starts_at), 'EEE, MMM d · h:mm a')}
                      {event.ends_at && ` – ${format(parseISO(event.ends_at), 'h:mm a')}`}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Teams */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Teams</h2>
          <Link to="/dashboard/sports" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {teams.map(sport => {
            const headCoach = sport.coaches.find(c => c.role === 'head_coach')
            return (
              <Link
                key={sport.id}
                to={`/dashboard/team/${sport.id}/calendar`}
                className="flex items-center gap-4 border rounded-lg p-4 bg-card hover:bg-muted/40 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-none">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{sport.name}</p>
                    <SeasonBadge season={sport.season} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    {sport.school_name}
                    {headCoach && <><span className="text-muted-foreground/40">·</span>HC: {headCoach.first_name} {headCoach.last_name}</>}
                    <span className="text-muted-foreground/40">·</span>
                    <Users className="w-3 h-3" />{sport.athlete_count}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
