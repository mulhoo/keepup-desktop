import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/contexts/ProfileContext'
import { fetchSports, sportDisplayName, type Sport } from '@/api/sports'
import type { LinkedAccountSport } from '@/api/linkedAccounts'
import { fetchSchools } from '@/api/schools'
import { SchoolSportPanel } from '@/components/sports/SchoolSportPanel'
import { DistrictSportPanel } from '@/components/sports/DistrictSportPanel'
import { SportCard, DistrictSportCard } from '@/components/sports/SportCard'
import { SEASONS, SEASON_LABEL, SEASON_COLOR } from '@/components/sports/SportBadges'
import { cn } from '@/lib/utils'

type ActivePanel =
  | { type: 'school'; sportId: number; pastYears: string[] }
  | { type: 'district'; sportName: string; season: string; showYear?: string }
  | null

type EffectiveSport = Sport & { coach_role?: 'head_coach' | 'assistant_coach' }

export default function Sports() {
  const { user, effectiveRole, isAuthenticated } = useAuth()
  const { activeProfile }  = useProfile()
  const [searchParams]     = useSearchParams()
  const navigate           = useNavigate()

  const isDistrictAdmin    = effectiveRole === 'district_admin'
  const isAthleticDirector = effectiveRole === 'athletic_director'
  const isCoach            = effectiveRole === 'head_coach' || effectiveRole === 'assistant_coach'
  const isSchoolAdmin      = effectiveRole === 'school_admin'
  const goToRoster         = isAthleticDirector || isSchoolAdmin

  const initSportId = Number(searchParams.get('sport')) || null
  const [activePanel,    setActivePanel]    = useState<ActivePanel>(
    initSportId ? { type: 'school', sportId: initSportId, pastYears: [] } : null
  )
  const [showPast,       setShowPast]       = useState(false)
  const [seasonFilters,  setSeasonFilters]  = useState<Set<string>>(new Set())

  const { data: sports = [], isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn:  () => fetchSports(),
    enabled:  isAuthenticated && !activeProfile,
  })

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn:  fetchSchools,
    enabled:  isDistrictAdmin && !activeProfile,
  })

  const effectiveSports: EffectiveSport[] = activeProfile
    ? (activeProfile.active_sports as LinkedAccountSport[])
    : isCoach && user
      ? sports
          .filter(s => s.coaches.some(c => c.id === user.id))
          .map(s => ({ ...s, coach_role: s.coaches.find(c => c.id === user.id)?.role as 'head_coach' | 'assistant_coach' | undefined }))
      : sports.map(s => ({ ...s }))

  const isLoading   = sportsLoading && !activeProfile
  const schoolYears = [...new Set(effectiveSports.map(s => s.school_year))].sort().reverse()
  const currentYear = schoolYears[0] ?? ''

  const matchesSeason = (s: EffectiveSport) => seasonFilters.size === 0 || seasonFilters.has(s.season)

  const schoolSportGroups = Object.values(
    effectiveSports.reduce<Record<string, { name: string; current?: EffectiveSport; pastYears: string[] }>>((acc, s) => {
      const key = sportDisplayName(s)
      if (!acc[key]) acc[key] = { name: key, pastYears: [] }
      if (s.school_year === currentYear) acc[key].current = s
      else acc[key].pastYears.push(s.school_year)
      return acc
    }, {})
  )
    .filter(g => g.current !== undefined && matchesSeason(g.current))
    .sort((a, b) => a.name.localeCompare(b.name))

  const timeline = schoolYears.map(year => ({
    year,
    items: effectiveSports.filter(s => s.school_year === year && matchesSeason(s)),
  })).filter(y => y.items.length > 0)

  const districtPanelInstances = activePanel?.type === 'district'
    ? sports.filter(s =>
        sportDisplayName(s) === activePanel.sportName &&
        s.season === activePanel.season &&
        (activePanel.showYear ? s.school_year === activePanel.showYear : s.school_year === currentYear)
      )
    : []

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isDistrictAdmin ? 'All sports across the district.' : 'Teams and rosters at your school.'}
        </p>
      </div>

      {/* Season filter chips + past seasons toggle */}
      <div className="flex gap-2 flex-wrap">
        {SEASONS.map(s => (
          <button
            key={s}
            onClick={() => setSeasonFilters(prev => {
              const next = new Set(prev)
              if (next.has(s)) next.delete(s); else next.add(s)
              return next
            })}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              seasonFilters.has(s)
                ? cn(SEASON_COLOR[s], 'border-transparent')
                : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            )}
          >
            {SEASON_LABEL[s]}
          </button>
        ))}

        <div className="w-px bg-border self-stretch mx-1" />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-muted-foreground dark:text-foreground">Show past seasons</span>
          <button
            role="switch"
            aria-checked={showPast}
            onClick={() => setShowPast(v => !v)}
            className={cn(
              'relative w-10 h-6 rounded-full transition-all duration-200 border-2 flex-none',
              'border-blue-900 dark:border-cyan-400',
              showPast ? 'bg-blue-900 dark:bg-cyan-400' : 'bg-transparent'
            )}
          >
            <span className={cn(
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200',
              showPast ? 'bg-white translate-x-[18px]' : 'bg-blue-900 dark:bg-cyan-400 translate-x-0'
            )} />
          </button>
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading sports…</span>
        </div>
      )}

      {/* District admin: grouped multi-school view */}
      {isDistrictAdmin && !isLoading && (
        <div className="space-y-10">
          {timeline.map(({ year, items }) => {
            const isPast = year !== currentYear
            if (isPast && !showPast) return null
            const groups = Object.values(
              items.reduce<Record<string, { name: string; season: string; instances: Sport[] }>>((acc, s) => {
                const key = sportDisplayName(s)
                if (!acc[key]) acc[key] = { name: key, season: s.season, instances: [] }
                acc[key].instances.push(s)
                return acc
              }, {})
            ).sort((a, b) => a.name.localeCompare(b.name))
            return (
              <div key={year} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">{year}</h2>
                <div className="space-y-2">
                  {groups.map(({ name, season, instances }) => (
                    <DistrictSportCard
                      key={name}
                      name={name}
                      season={season}
                      instances={instances}
                      onClick={() => setActivePanel({ type: 'district', sportName: name, season, showYear: isPast ? year : undefined })}
                    />
                  ))}
                  {groups.length === 0 && (
                    <div className="rounded-lg border p-6 text-sm text-muted-foreground text-center">No sports found.</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* School-level: current year always visible, past years shown when toggled */}
      {!isDistrictAdmin && !isLoading && (
        <div className="space-y-10">
          {timeline.map(({ year, items }) => {
            const isPast = year !== currentYear
            if (isPast && !showPast) return null
            const pastYearsForSport = schoolSportGroups.reduce<Record<number, string[]>>((acc, g) => {
              if (g.current) acc[g.current.id] = g.pastYears
              return acc
            }, {})
            return (
              <div key={year} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">{year}</h2>
                <div className="space-y-2">
                  {items.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                    <SportCard
                      key={s.id}
                      sport={s}
                      coachRole={isCoach ? s.coach_role : undefined}
                      onClick={() =>
                        goToRoster
                          ? navigate(`/dashboard/team/${s.id}/roster`)
                          : setActivePanel({ type: 'school', sportId: s.id, pastYears: pastYearsForSport[s.id] ?? [] })
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
          {timeline.length === 0 && (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground text-center">No sports found.</div>
          )}
        </div>
      )}

      {activePanel?.type === 'school' && (
        <SchoolSportPanel
          sportId={activePanel.sportId}
          pastYears={activePanel.pastYears}
          canEdit={isAthleticDirector}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel?.type === 'district' && (
        <DistrictSportPanel
          sportName={activePanel.sportName}
          season={activePanel.season}
          instances={districtPanelInstances}
          schools={schools}
          showYear={activePanel.showYear}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  )
}
