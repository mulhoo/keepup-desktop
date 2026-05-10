import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, ShieldAlert, Megaphone, Trophy, Building2, Settings, LogOut,
  Smartphone, Sun, Moon, ClipboardList, Upload, ArrowUpRight,
  PanelLeftClose, PanelLeftOpen,
  Waves, CircleDot, Activity, Flag, Shield, Star, Sparkles, Wind, Target,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/api/auth'
import { atLeast } from '@/lib/roles'
import { useTranslationHelpers } from '@/lib/i18n'
import { useTheme } from '@/hooks/useTheme'
import { useBranding } from '@/contexts/BrandingContext'
import { useProfile } from '@/contexts/ProfileContext'
import { fetchSports, DEMO_COACH_SPORTS } from '@/api/sports'
import { fetchLinkedAccounts, DEMO_BASE, type LinkedAccount } from '@/api/linkedAccounts'
import { linkedAccountKey } from '@/contexts/ProfileContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Family from '@/pages/Family'

function schoolAbbr(name: string) {
  return name.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 4).join('')
}

function sportIcon(name: string): React.ElementType {
  const n = name.toLowerCase()
  if (n.includes('swim'))                          return Waves
  if (n.includes('polo'))                          return Waves
  if (n.includes('basket'))                        return CircleDot
  if (n.includes('soccer') || n.includes('futbol')) return Target
  if (n.includes('football'))                      return Shield
  if (n.includes('track') || n.includes('field') || n.includes('cross country')) return Activity
  if (n.includes('tennis'))                        return CircleDot
  if (n.includes('volley'))                        return CircleDot
  if (n.includes('base') || n.includes('soft'))    return CircleDot
  if (n.includes('lacrosse'))                      return Target
  if (n.includes('wrestl'))                        return Shield
  if (n.includes('golf'))                          return Flag
  if (n.includes('gymnast'))                       return Star
  if (n.includes('cheer'))                         return Sparkles
  if (n.includes('wind') || n.includes('sail'))    return Wind
  return Trophy
}

function ThemeToggle({ inline = false }: { inline?: boolean }) {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={inline
        ? 'w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        : 'fixed top-3 right-4 z-50 w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
      }
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

function SportRail({ role, collapsed }: { role: string | null; collapsed: boolean }) {
  const { getSportBranding } = useBranding()
  const { activeProfile } = useProfile()
  const isCoach = role === 'head_coach' || role === 'assistant_coach'
  const primaryDistrict = DEMO_BASE[role ?? '']?.district_name ?? ''

  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn: () => fetchSports(),
    enabled: isCoach && !activeProfile,
  })

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts', role],
    queryFn: () => fetchLinkedAccounts(role ?? ''),
    enabled: isCoach && !activeProfile,
  })

  const schoolYears = [...new Set(sports.map(s => s.school_year))].sort().reverse()
  const currentYear = schoolYears[0] ?? ''

  const sameDistrictSports = linked
    .filter((a: LinkedAccount) => a.status === 'accepted' && a.district_name === primaryDistrict)
    .flatMap((a: LinkedAccount) => a.active_sports)

  const myActiveSports = activeProfile
    ? activeProfile.active_sports
    : [
        ...sports.filter(s =>
          s.school_year === currentYear &&
          s.status === 'active' &&
          DEMO_COACH_SPORTS[role ?? '']?.[s.id] !== undefined
        ),
        ...sameDistrictSports.filter(s => s.status === 'active' && s.school_year === currentYear),
      ]

  if (!isCoach || myActiveSports.length === 0) return null

  return (
    <div className="mt-6 pt-4 border-t border-border/50 space-y-0.5">
      {!collapsed && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">My Teams</p>
      )}
      {myActiveSports.map(sport => {
        const branding = getSportBranding(sport.id)
        const coachRole = activeProfile
          ? activeProfile.active_sports.find(s => s.id === sport.id)?.coach_role
          : DEMO_COACH_SPORTS[role ?? '']?.[sport.id]
            ?? sameDistrictSports.find(s => s.id === sport.id)?.coach_role
        const SportIcon = sportIcon(sport.name)
        return (
          <div key={sport.id} className="relative group/sport">
            <Link
              to={`/dashboard/team/${sport.id}`}
              className={cn(
                'flex items-center rounded-md hover:bg-muted transition-colors group',
                collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2 py-1.5'
              )}
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-none bg-primary/10 flex items-center justify-center border border-border/50">
                {branding.icon_url
                  ? <img src={branding.icon_url} alt="" className="w-full h-full object-cover" />
                  : <SportIcon className="w-3.5 h-3.5 text-primary" />
                }
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground/80 truncate leading-tight group-hover:text-foreground transition-colors">
                    {sport.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                    {coachRole === 'head_coach' ? 'Head Coach' : 'Asst. Coach'}
                    <span className="text-muted-foreground/40">·</span>
                    <span className="font-medium text-muted-foreground/70">{schoolAbbr(sport.school_name)}</span>
                  </p>
                </div>
              )}
            </Link>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2.5 py-1.5 rounded-md bg-popover border border-border shadow-md text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/sport:opacity-100 transition-opacity duration-150">
              <p className="font-medium text-foreground">{sport.name}</p>
              <p className="text-[10px] text-muted-foreground">{sport.school_name}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProfileSwitcher({ demoRole, collapsed }: { demoRole: string | null; collapsed: boolean }) {
  const { activeProfile, defaultKey, switchToProfile } = useProfile()
  const [pending, setPending] = useState<LinkedAccount | null | undefined>(undefined)
  const isCoach = demoRole === 'head_coach' || demoRole === 'assistant_coach'
  const initializedRef = useRef(false)

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts', demoRole],
    queryFn: () => fetchLinkedAccounts(demoRole ?? ''),
    enabled: isCoach,
  })

  useEffect(() => {
    if (initializedRef.current || !linked.length || !defaultKey) return
    initializedRef.current = true
    const id = parseInt(defaultKey.replace('linked-', ''))
    const match = linked.find((a: LinkedAccount) => a.id === id)
    if (match) switchToProfile(match)
  }, [linked])

  const accepted = linked.filter((a: LinkedAccount) => a.status === 'accepted')
  const base = DEMO_BASE[demoRole ?? '']
  const baseDistrict = base?.district_name ?? ''
  const crossDistrict = accepted.filter((a: LinkedAccount) => a.district_name !== baseDistrict)

  if (!isCoach || crossDistrict.length === 0 || collapsed) return null

  type ChipEntry = { key: string | null; label: string; district: string; account: LinkedAccount | null; role: string }
  const allChips: ChipEntry[] = [
    { key: null, label: base?.school_name ?? 'Home', district: baseDistrict, account: null, role: demoRole ?? '' },
    ...crossDistrict.map((a: LinkedAccount) => ({
      key: linkedAccountKey(a), label: a.school_name, district: a.district_name, account: a, role: a.role,
    })),
  ]
  const orderedChips = defaultKey
    ? [...allChips.filter(c => c.key === defaultKey), ...allChips.filter(c => c.key !== defaultKey)]
    : allChips

  const activeKey = activeProfile ? linkedAccountKey(activeProfile) : null

  function handleChipClick(chip: ChipEntry) {
    if (chip.key === activeKey) return
    setPending(chip.account)
  }

  const fromDistrict = activeProfile?.district_name ?? baseDistrict
  const fromName     = activeProfile?.school_name   ?? base?.school_name ?? 'current school'
  const toChip       = pending === undefined ? null : orderedChips.find(c => c.account === pending) ?? null
  const toName       = toChip?.label    ?? ''
  const toDistrict   = toChip?.district ?? ''
  const toRole       = toChip?.role     ?? ''

  return (
    <>
      <div className="flex items-center gap-1.5 px-3 py-1">
        {orderedChips.map(chip => {
          const isCurrent = chip.key === activeKey
          const isAsst    = chip.role === 'assistant_coach'
          return (
            <button
              key={chip.key ?? 'base'}
              onClick={() => handleChipClick(chip)}
              disabled={isCurrent}
              title={`${chip.label} · ${chip.district}`}
              className={cn(
                'w-7 h-7 rounded-md text-[10px] font-bold flex items-center justify-center border transition-colors flex-none relative',
                isCurrent
                  ? 'bg-primary text-primary-foreground border-primary cursor-default'
                  : isAsst
                    ? 'bg-muted text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
              )}
            >
              {schoolAbbr(chip.label) || chip.label.slice(0, 2).toUpperCase()}
              {!isCurrent && (
                <ArrowUpRight className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-background rounded-full text-muted-foreground" />
              )}
            </button>
          )
        })}
      </div>

      {pending !== undefined && (
        <Dialog open onOpenChange={v => { if (!v) setPending(undefined) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary flex-none" />
                Switch to {toName}?
              </DialogTitle>
              <DialogDescription className="pt-1 space-y-2 text-left">
                <span className="block">
                  You're leaving{' '}
                  <span className="font-medium text-foreground">{fromName}</span>
                  {' '}({fromDistrict}) and switching to{' '}
                  <span className="font-medium text-foreground">{toName}</span>
                  {' '}({toDistrict}).
                </span>
                <span className="block text-xs">
                  Your role there:{' '}
                  <span className="font-medium text-foreground capitalize">
                    {toRole.replace(/_/g, ' ')}
                  </span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  These are separate districts — data stays completely isolated between them.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPending(undefined)}>Stay here</Button>
              <Button size="sm" onClick={() => { switchToProfile(pending ?? null); setPending(undefined) }}>
                Switch profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

const NAV_CONFIG: { to: string; key: string; icon: React.ElementType; min?: string; roles?: string[] }[] = [
  { to: '/dashboard/overview',      key: 'nav.overview',      icon: LayoutDashboard, min: 'assistant_coach'   },
  { to: '/dashboard/reviews',       key: 'nav.reviews',       icon: ShieldAlert,     min: 'assistant_coach'   },
  { to: '/dashboard/announcements', key: 'nav.announcements', icon: Megaphone,       min: 'assistant_coach'   },
  { to: '/dashboard/sports',        key: 'nav.sports',        icon: Trophy,          min: 'athletic_director' },
  { to: '/dashboard/schools',       key: 'nav.schools',       icon: Building2,       min: 'district_admin'    },
  { to: '/dashboard/audit-log',     key: 'nav.auditLog',      icon: ClipboardList,   min: 'athletic_director' },
  { to: '/dashboard/import',        key: 'nav.import',        icon: Upload,          roles: ['head_coach', 'athletic_director'] },
  { to: '/dashboard/settings',      key: 'nav.settings',      icon: Settings,        min: 'assistant_coach'   },
]

export default function AppShell() {
  const { user, demoRole, logout: clearAuth } = useAuth()
  const { activeProfile } = useProfile()
  const navigate = useNavigate()
  const { t } = useTranslationHelpers()
  const [collapsed, setCollapsed] = useState(false)

  const isCoach = demoRole === 'head_coach' || demoRole === 'assistant_coach'
  const base = DEMO_BASE[demoRole ?? '']
  const currentSchool   = activeProfile?.school_name   ?? base?.school_name
  const currentDistrict = activeProfile?.district_name ?? base?.district_name
  const isDiffDistrict  = isCoach && !!activeProfile && activeProfile.district_name !== base?.district_name

  const isParent     = demoRole === 'parent'
  const isMobileOnly = !atLeast(demoRole, 'assistant_coach') && !isParent

  async function handleLogout() {
    await logout()
    clearAuth()
    navigate('/login')
  }

  const visibleNav = NAV_CONFIG.filter(item =>
    item.roles ? item.roles.includes(demoRole ?? '') : atLeast(demoRole, item.min ?? '')
  )

  if (isParent) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-bold tracking-tight">{t('app.name')}</span>
            <span className="ml-3 text-xs text-muted-foreground">{user?.first_name} {user?.last_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle inline />
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.signOut')}
            </button>
          </div>
        </header>
        <Family />
      </div>
    )
  }

  if (isMobileOnly) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <ThemeToggle />
        <div className="text-center space-y-4 max-w-sm">
          <Smartphone className="w-10 h-10 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{t('mobileOnly.heading')}</h1>
            <p className="text-sm text-muted-foreground">{t('mobileOnly.description')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            {t('nav.signOut')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ThemeToggle />
      <aside className={cn(
        'flex-none border-r flex flex-col transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}>
        {/* Header */}
        <div className={cn(
          'border-b flex items-center gap-2 min-h-[64px]',
          collapsed ? 'px-2 py-4 justify-center' : 'px-4 py-4'
        )}>
          {collapsed ? (
            <span className="font-bold text-base tracking-tight text-primary select-none">KU</span>
          ) : (
            <div className="flex-1 min-w-0">
              <span className="font-bold text-lg tracking-tight">{t('app.name')}</span>
              {isCoach && currentSchool ? (
                <span className={cn(
                  'block text-xs mt-0.5 truncate font-medium',
                  isDiffDistrict ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                )}>
                  {currentSchool}
                </span>
              ) : demoRole && (
                <span className="block text-xs text-muted-foreground mt-0.5 capitalize">
                  {t(`roles.${demoRole}` as any) || demoRole.replace(/_/g, ' ')}
                </span>
              )}
              <ProfileSwitcher demoRole={demoRole} collapsed={collapsed} />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? t(key as any) : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-md text-sm transition-colors',
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              }
            >
              <Icon className="w-4 h-4 flex-none" />
              {!collapsed && t(key as any)}
            </NavLink>
          ))}
          <SportRail role={demoRole} collapsed={collapsed} />
        </nav>

        {/* Divider with collapse toggle sitting on it */}
        <div className="relative border-t">
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -top-3 right-2 w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed
              ? <PanelLeftOpen className="w-3.5 h-3.5" />
              : <PanelLeftClose className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* Footer */}
        <div className="px-2 py-3 space-y-1">
          {!collapsed && (
            <div className="px-3 py-1">
              <p className="text-xs font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {activeProfile ? activeProfile.email : user?.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? t('nav.signOut') : undefined}
            className={cn(
              'flex items-center gap-2.5 py-2 w-full rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
              collapsed ? 'justify-center px-0' : 'px-3'
            )}
          >
            <LogOut className="w-4 h-4 flex-none" />
            {!collapsed && t('nav.signOut')}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
