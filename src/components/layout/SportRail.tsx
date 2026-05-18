import { useState, useEffect } from 'react'
import { NavLink, Link, useMatch } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, UsersRound, Megaphone, ChevronDown, BarChart2,
  Waves, CircleDot, Activity, Flag, Shield, Star, Sparkles, Wind, Target,
} from 'lucide-react'
import { fetchSports, type Sport, type SportCoach } from '@/api/sports'
import { fetchLinkedAccounts, DEMO_BASE, type LinkedAccount } from '@/api/linkedAccounts'
import { useBranding } from '@/contexts/BrandingContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

function schoolAbbr(name: string) {
  return name.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 4).join('')
}

function sportIcon(name: string): React.ElementType {
  const n = name.toLowerCase()
  if (n.includes('swim'))                                               return Waves
  if (n.includes('polo'))                                               return Waves
  if (n.includes('basket'))                                             return CircleDot
  if (n.includes('soccer') || n.includes('futbol'))                    return Target
  if (n.includes('football'))                                           return Shield
  if (n.includes('track') || n.includes('field') || n.includes('cross country')) return Activity
  if (n.includes('tennis'))                                             return CircleDot
  if (n.includes('volley'))                                             return CircleDot
  if (n.includes('base') || n.includes('soft'))                        return CircleDot
  if (n.includes('lacrosse'))                                           return Target
  if (n.includes('wrestl'))                                             return Shield
  if (n.includes('golf'))                                               return Flag
  if (n.includes('gymnast'))                                            return Star
  if (n.includes('cheer'))                                              return Sparkles
  if (n.includes('wind') || n.includes('sail'))                        return Wind
  return Trophy
}

const TEAM_SUBNAV = [
  { to: 'roster',        label: 'Roster',       Icon: UsersRound   },
  { to: 'announcements', label: 'Announcements', Icon: Megaphone    },
  { to: 'results',       label: 'Results',       Icon: BarChart2    },
]

export function SportRail({ role, collapsed }: { role: string | null; collapsed: boolean }) {
  const { getSportBranding } = useBranding()
  const { activeProfile }    = useProfile()
  const { user }             = useAuth()
  const isCoach              = role === 'head_coach' || role === 'assistant_coach'
  const primaryDistrict      = DEMO_BASE[role ?? '']?.district_name ?? ''

  const teamMatch      = useMatch('/dashboard/team/:sportId/*')
  const currentSportId = teamMatch ? Number(teamMatch.params.sportId) : null

  const [expandedIds, setExpandedIds] = useState<Set<number>>(() =>
    new Set(currentSportId ? [currentSportId] : [])
  )

  useEffect(() => {
    if (currentSportId) {
      setExpandedIds(prev => prev.has(currentSportId) ? prev : new Set([...prev, currentSportId]))
    }
  }, [currentSportId])

  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn:  () => fetchSports(),
    enabled:  isCoach && !activeProfile,
  })

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn:  fetchLinkedAccounts,
    enabled:  isCoach && !activeProfile,
  })

  const schoolYears    = [...new Set(sports.map(s => s.school_year))].sort().reverse()
  const currentYear    = schoolYears[0] ?? ''
  const sameDistrictSports = linked
    .filter((a: LinkedAccount) => a.status === 'accepted' && a.district_name === primaryDistrict)
    .flatMap((a: LinkedAccount) => a.active_sports)

  const myActiveSports = activeProfile
    ? activeProfile.active_sports
    : [
        ...sports.filter((s: Sport) =>
          s.school_year === currentYear &&
          s.status === 'active' &&
          s.coaches.some((c: SportCoach) => c.id === user?.id)
        ),
        ...sameDistrictSports.filter(s => s.status === 'active' && s.school_year === currentYear),
      ]

  if (!isCoach || myActiveSports.length === 0) return null

  function toggleSport(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="mt-6 pt-4 border-t border-border/50 space-y-0.5">
      {!collapsed && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">My Teams</p>
      )}
      {myActiveSports.map(sport => {
        const branding  = getSportBranding(sport.id)
        const coachRole = activeProfile
          ? activeProfile.active_sports.find(s => s.id === sport.id)?.coach_role
          : sports.find((s: Sport) => s.id === sport.id)?.coaches.find((c: SportCoach) => c.id === user?.id)?.role
            ?? sameDistrictSports.find(s => s.id === sport.id)?.coach_role
        const SportIcon  = sportIcon(sport.name)
        const isExpanded = expandedIds.has(sport.id)

        const sportAvatar = (
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-none bg-primary/10 flex items-center justify-center border border-border/50">
            {branding.icon_url
              ? <img src={branding.icon_url} alt="" className="w-full h-full object-cover" />
              : <SportIcon className="w-3.5 h-3.5 text-primary" />
            }
          </div>
        )

        return (
          <div key={sport.id} className="relative group/sport">
            {collapsed ? (
              <Link
                to={`/dashboard/team/${sport.id}/roster`}
                className="flex items-center justify-center rounded-md hover:bg-muted transition-colors px-0 py-2"
              >
                {sportAvatar}
              </Link>
            ) : (
              <button
                onClick={() => toggleSport(sport.id)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors group"
              >
                {sportAvatar}
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs text-foreground/80 truncate leading-tight group-hover:text-foreground transition-colors">
                    {sport.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight flex items-center gap-1">
                    {coachRole === 'head_coach' ? 'Head Coach' : 'Asst. Coach'}
                    <span className="text-muted-foreground/40">·</span>
                    <span className="font-medium text-muted-foreground/70">{schoolAbbr(sport.school_name)}</span>
                  </p>
                </div>
                <ChevronDown className={cn(
                  'w-3.5 h-3.5 text-muted-foreground flex-none transition-transform duration-150',
                  isExpanded && 'rotate-180'
                )} />
              </button>
            )}

            {!collapsed && isExpanded && (
              <div className="ml-3 pl-3.5 border-l border-border/40 mt-0.5 mb-1 space-y-0.5">
                {TEAM_SUBNAV.filter(item => item.to !== 'import' || coachRole === 'head_coach').map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={`/dashboard/team/${sport.id}/${to}`}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 flex-none" />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}

            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2.5 py-1.5 rounded-md bg-popover border border-border shadow-md text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/sport:opacity-100 transition-opacity duration-150">
                <p className="font-medium text-foreground">{sport.name}</p>
                <p className="text-xs text-muted-foreground">{sport.school_name}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
