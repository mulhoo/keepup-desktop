import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Users, ChevronRight, Loader2, Paintbrush } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/contexts/ProfileContext'
import { fetchSports, fetchSportDetail, DEMO_COACH_SPORTS, type Sport, type SportDetail, type MemberRole } from '@/api/sports'
import type { LinkedAccountSport } from '@/api/linkedAccounts'
import { fetchSchools, type School } from '@/api/schools'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useBranding } from '@/contexts/BrandingContext'
import SportBrandingEditor from '@/components/branding/SportBrandingEditor'
import { cn } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const SEASONS = ['fall', 'winter', 'spring'] as const
const SEASON_LABEL: Record<string, string> = { fall: 'Fall', winter: 'Winter', spring: 'Spring' }
const SEASON_COLOR: Record<string, string> = {
  fall:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  winter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  spring: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const ROLE_LABEL_PLURAL: Record<MemberRole, string> = {
  head_coach:      'Head Coaches',
  assistant_coach: 'Asst. Coaches',
  student_captain: 'Captains',
  student:         'Athletes',
}
const ROLE_ORDER: MemberRole[] = ['head_coach', 'assistant_coach', 'student_captain', 'student']

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Avatar({ first, last }: { first: string; last: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
      {first[0]}{last[0]}
    </div>
  )
}

function SeasonBadge({ season }: { season: string }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex-none', SEASON_COLOR[season])}>
      {SEASON_LABEL[season]}
    </span>
  )
}

// ── School-level panel ────────────────────────────────────────────────────────

function MemberGroup({ role, members }: { role: MemberRole; members: SportDetail['members'] }) {
  const inRole = members.filter(m => m.role === role)
  if (inRole.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {ROLE_LABEL_PLURAL[role]}{inRole.length > 1 ? ` (${inRole.length})` : ''}
      </p>
      {inRole.map(m => (
        <div key={m.user_id} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors', m.graduated && 'opacity-60')}>
          <Avatar first={m.first_name} last={m.last_name} />
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-medium leading-none', m.graduated && 'italic')}>
              {m.first_name} {m.last_name}
              {m.graduated && (
                <span className="ml-2 text-[10px] font-normal not-italic bg-muted text-muted-foreground px-1.5 py-0.5 rounded align-middle">
                  Graduated
                </span>
              )}
            </p>
            {m.grade && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Grade {m.grade}{m.jersey_number ? ` · #${m.jersey_number}` : ''}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SchoolSportPanel({ sportId, pastYears, canEditBranding, onClose }: {
  sportId: number
  pastYears: string[]
  canEditBranding: boolean
  onClose: () => void
}) {
  const [brandingOpen, setBrandingOpen] = useState(false)
  const { getSportBranding } = useBranding()
  const branding = getSportBranding(sportId)

  const { data, isLoading } = useQuery({
    queryKey: ['sport', sportId],
    queryFn: () => fetchSportDetail(sportId),
  })

  return (
    <>
      <Sheet open onOpenChange={v => { if (!v) onClose() }}>
        <SheetContent className="p-0 flex flex-col">
          {/* Banner */}
          <div className="relative w-full h-28 bg-primary/10 flex-none overflow-hidden">
            {branding.banner_url ? (
              <img src={branding.banner_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary/30" />
              </div>
            )}
            {/* Sport icon chip */}
            <div className="absolute bottom-3 left-4 w-12 h-12 rounded-xl border-2 border-background bg-card shadow-sm overflow-hidden flex items-center justify-center">
              {branding.icon_url ? (
                <img src={branding.icon_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Trophy className="w-5 h-5 text-primary" />
              )}
            </div>
            {canEditBranding && (
              <button
                onClick={() => setBrandingOpen(true)}
                className="absolute top-2 right-2 flex items-center gap-1.5 text-xs bg-background/80 backdrop-blur-sm px-2.5 py-1.5 rounded-md hover:bg-background transition-colors text-foreground"
              >
                <Paintbrush className="w-3 h-3" />
                Edit branding
              </button>
            )}
          </div>

          <div className="px-6 pt-5 pb-3">
            <h2 className="text-base font-semibold">{data?.name ?? 'Loading…'}</h2>
            {data && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {SEASON_LABEL[data.season]} · {data.school_year} · {data.athlete_count} athletes
                {pastYears.length > 0 && ` · Also in: ${pastYears.join(', ')}`}
              </p>
            )}
          </div>

          <SheetBody className="px-6">
            {isLoading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {data && (
              <div className="space-y-5">
                {ROLE_ORDER.map(role => (
                  <MemberGroup key={role} role={role} members={data.members} />
                ))}
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {data && brandingOpen && (
        <SportBrandingEditor
          sportId={sportId}
          sportName={data.name}
          open={brandingOpen}
          onClose={() => setBrandingOpen(false)}
        />
      )}
    </>
  )
}

// ── District panel ────────────────────────────────────────────────────────────

function SchoolRosterDialog({ sport, onClose }: { sport: Sport; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sport', sport.id],
    queryFn: () => fetchSportDetail(sport.id),
  })

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="w-[480px] max-w-[95vw] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle>{sport.school_name}</DialogTitle>
          <DialogDescription>
            {sport.name} · {SEASON_LABEL[sport.season]} · {sport.school_year} · {sport.athlete_count} athletes
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {data && ROLE_ORDER.map(role => {
            const members = data.members.filter(m => m.role === role)
            if (members.length === 0) return null
            return (
              <div key={role} className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {ROLE_LABEL_PLURAL[role]}{members.length > 1 ? ` (${members.length})` : ''}
                </p>
                {members.map(m => (
                  <div key={m.user_id} className={cn('flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors', m.graduated && 'opacity-60')}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
                      {m.first_name[0]}{m.last_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium leading-none', m.graduated && 'italic')}>
                        {m.first_name} {m.last_name}
                        {m.graduated && (
                          <span className="ml-2 text-[10px] font-normal not-italic bg-muted text-muted-foreground px-1.5 py-0.5 rounded align-middle">
                            Graduated
                          </span>
                        )}
                      </p>
                      {m.grade && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Grade {m.grade}{m.jersey_number ? ` · #${m.jersey_number}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SchoolSportCard({ sport, school, onClick }: { sport: Sport; school?: School; onClick: () => void }) {
  const headCoach = sport.coaches.find(c => c.role === 'head_coach')
  const ad        = school?.athletic_director
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4 space-y-3 group"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{sport.school_name}</p>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none" />
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {ad && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground/70 w-24 flex-none">AD</span>
            <span>{ad.first_name} {ad.last_name}</span>
          </div>
        )}
        {headCoach && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground/70 w-24 flex-none">Head Coach</span>
            <span>{headCoach.first_name} {headCoach.last_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground/70 w-24 flex-none">Athletes</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{sport.athlete_count}</span>
        </div>
      </div>
    </button>
  )
}

function DistrictSportPanel({ sportName, season, instances, schools, showYear, onClose }: {
  sportName: string
  season: string
  instances: Sport[]
  schools: School[]
  showYear?: string
  onClose: () => void
}) {
  const [rosterSport, setRosterSport] = useState<Sport | null>(null)
  const schoolMap = Object.fromEntries(schools.map(s => [s.id, s]))
  const totalAthletes = instances.reduce((sum, s) => sum + s.athlete_count, 0)
  return (
    <>
      <Sheet open onOpenChange={v => { if (!v) onClose() }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary flex-none" />
              {sportName}
            </SheetTitle>
            <SheetDescription>
              {showYear ? `${showYear} · ` : ''}{SEASON_LABEL[season]} · {instances.length} school{instances.length !== 1 ? 's' : ''} · {totalAthletes} athletes
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-3">
            {instances.map(sport => (
              <SchoolSportCard
                key={sport.id}
                sport={sport}
                school={schoolMap[sport.school_id]}
                onClick={() => setRosterSport(sport)}
              />
            ))}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {rosterSport && (
        <SchoolRosterDialog sport={rosterSport} onClose={() => setRosterSport(null)} />
      )}
    </>
  )
}

// ── Sport cards ───────────────────────────────────────────────────────────────

function SportCard({ sport, coachRole, onClick }: {
  sport: Sport
  coachRole?: 'head_coach' | 'assistant_coach'
  onClick: () => void
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
          <p className="text-sm font-semibold truncate">{sport.name}</p>
          <SeasonBadge season={sport.season} />
          {coachRole && (
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded flex-none',
              coachRole === 'head_coach'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              {coachRole === 'head_coach' ? 'Head Coach' : 'Asst. Coach'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Users className="w-3 h-3" />{sport.athlete_count} athletes
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none" />
    </button>
  )
}

function DistrictSportCard({ name, season, instances, onClick }: {
  name: string
  season: string
  instances: Sport[]
  onClick: () => void
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

// ── Panel state ───────────────────────────────────────────────────────────────

type ActivePanel =
  | { type: 'school'; sportId: number; pastYears: string[] }
  | { type: 'district'; sportName: string; season: string; showYear?: string }
  | null

// ── Page ──────────────────────────────────────────────────────────────────────

type EffectiveSport = Sport & { coach_role?: 'head_coach' | 'assistant_coach' }

export default function Sports() {
  const { user, demoRole } = useAuth()
  const { activeProfile } = useProfile()
  const [searchParams] = useSearchParams()
  const isDistrictAdmin = demoRole === 'district_admin'
  const isCoach = demoRole === 'head_coach' || demoRole === 'assistant_coach'

  const initSportId = Number(searchParams.get('sport')) || null
  const [activePanel, setActivePanel] = useState<ActivePanel>(
    initSportId ? { type: 'school', sportId: initSportId, pastYears: [] } : null
  )
  const [showPast, setShowPast] = useState(false)
  const [seasonFilters, setSeasonFilters] = useState<Set<string>>(new Set())

  const { data: sports = [], isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: () => fetchSports(),
    enabled: !activeProfile,
  })

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: fetchSchools,
    enabled: isDistrictAdmin && !activeProfile,
  })

  // When a linked profile is active, use its sports exclusively (no data crosses)
  const effectiveSports: EffectiveSport[] = activeProfile
    ? (activeProfile.active_sports as LinkedAccountSport[])
    : isCoach && user
      ? sports
          .filter(s => s.coaches.some(c => c.first_name === user.first_name && c.last_name === user.last_name))
          .map(s => ({ ...s, coach_role: DEMO_COACH_SPORTS[demoRole ?? '']?.[s.id] }))
      : sports.map(s => ({ ...s }))

  const isLoading = sportsLoading && !activeProfile

  const schoolYears = [...new Set(effectiveSports.map(s => s.school_year))].sort().reverse()
  const currentYear = schoolYears[0] ?? ''

  const matchesSeason = (s: EffectiveSport) => seasonFilters.size === 0 || seasonFilters.has(s.season)

  // ── School-level: deduplicate by name, current year only ──
  const schoolSportGroups = Object.values(
    effectiveSports.reduce<Record<string, { name: string; current?: EffectiveSport; pastYears: string[] }>>((acc, s) => {
      if (!acc[s.name]) acc[s.name] = { name: s.name, pastYears: [] }
      if (s.school_year === currentYear) acc[s.name].current = s
      else acc[s.name].pastYears.push(s.school_year)
      return acc
    }, {})
  )
    .filter(g => g.current !== undefined && matchesSeason(g.current))
    .sort((a, b) => a.name.localeCompare(b.name))

  // ── Timeline (past seasons on) ──
  const timeline = schoolYears.map(year => ({
    year,
    items: effectiveSports.filter(s => s.school_year === year && matchesSeason(s)),
  })).filter(y => y.items.length > 0)

  const districtPanelInstances = activePanel?.type === 'district'
    ? sports.filter(s =>
        s.name === activePanel.sportName &&
        s.season === activePanel.season &&
        (activePanel.showYear ? s.school_year === activePanel.showYear : s.school_year === currentYear)
      )
    : []

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Sports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isDistrictAdmin ? 'All sports across the district.' : 'Teams and rosters at your school.'}
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {SEASONS.map(s => (
          <button
            key={s}
            onClick={() => setSeasonFilters(prev => {
              const next = new Set(prev)
              next.has(s) ? next.delete(s) : next.add(s)
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

      {/* ── District admin: year always visible, past years append below ── */}
      {isDistrictAdmin && !isLoading && (
        <div className="space-y-10">
          {timeline.map(({ year, items }) => {
            const isPast = year !== currentYear
            if (isPast && !showPast) return null
            const groups = Object.values(
              items.reduce<Record<string, { name: string; season: string; instances: Sport[] }>>((acc, s) => {
                if (!acc[s.name]) acc[s.name] = { name: s.name, season: s.season, instances: [] }
                acc[s.name].instances.push(s)
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

      {/* ── School-level: flat active / timeline past ── */}
      {!isDistrictAdmin && !isLoading && !showPast && (
        <div className="space-y-2">
          {schoolSportGroups.map(g => g.current ? (
            <SportCard
              key={g.name}
              sport={g.current}
              coachRole={isCoach ? g.current.coach_role : undefined}
              onClick={() => setActivePanel({ type: 'school', sportId: g.current!.id, pastYears: g.pastYears })}
            />
          ) : null)}
          {schoolSportGroups.length === 0 && (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground text-center">No sports found.</div>
          )}
        </div>
      )}

      {!isDistrictAdmin && !isLoading && showPast && (
        <div className="space-y-10">
          {timeline.map(({ year, items }) => (
            <div key={year} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{year}</h2>
              <div className="space-y-2">
                {items.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                  <SportCard
                    key={s.id}
                    sport={s}
                    coachRole={isCoach ? s.coach_role : undefined}
                    onClick={() => setActivePanel({ type: 'school', sportId: s.id, pastYears: [] })}
                  />
                ))}
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground text-center">No sports found.</div>
          )}
        </div>
      )}

      {/* ── Panels ── */}
      {activePanel?.type === 'school' && (
        <SchoolSportPanel
          sportId={activePanel.sportId}
          pastYears={activePanel.pastYears}
          canEditBranding={demoRole === 'head_coach'}
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
