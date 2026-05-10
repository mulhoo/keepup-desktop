import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, ShieldAlert, Megaphone, Trophy, Building2, Settings, LogOut,
  Smartphone, Sun, Moon, ClipboardList, Upload,
  PanelLeftClose, PanelLeftOpen, ArrowLeftRight,
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
import { useUserPhoto } from '@/contexts/UserPhotoContext'
import { fetchSports, DEMO_COACH_SPORTS } from '@/api/sports'
import { fetchLinkedAccounts, DEMO_BASE, type LinkedAccount } from '@/api/linkedAccounts'
import { linkedAccountKey } from '@/contexts/ProfileContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

import { cn } from '@/lib/utils'
import Family from '@/pages/Family'

function schoolAbbr(name: string) {
  return name.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 4).join('')
}

function sportIcon(name: string): React.ElementType {
  const n = name.toLowerCase()
  if (n.includes('swim'))                           return Waves
  if (n.includes('polo'))                           return Waves
  if (n.includes('basket'))                         return CircleDot
  if (n.includes('soccer') || n.includes('futbol')) return Target
  if (n.includes('football'))                       return Shield
  if (n.includes('track') || n.includes('field') || n.includes('cross country')) return Activity
  if (n.includes('tennis'))                         return CircleDot
  if (n.includes('volley'))                         return CircleDot
  if (n.includes('base') || n.includes('soft'))     return CircleDot
  if (n.includes('lacrosse'))                       return Target
  if (n.includes('wrestl'))                         return Shield
  if (n.includes('golf'))                           return Flag
  if (n.includes('gymnast'))                        return Star
  if (n.includes('cheer'))                          return Sparkles
  if (n.includes('wind') || n.includes('sail'))     return Wind
  return Trophy
}

// ── District switcher (top bar) ───────────────────────────────────────────────

function DistrictSwitcher({ demoRole }: { demoRole: string | null }) {
  const [open, setOpen] = useState(false)
  const { activeProfile, defaultKey, switchToProfile } = useProfile()
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

  const base = DEMO_BASE[demoRole ?? '']
  const baseDistrict = base?.district_name ?? ''
  const accepted = linked.filter((a: LinkedAccount) => a.status === 'accepted')
  const crossDistrict = accepted.filter((a: LinkedAccount) => a.district_name !== baseDistrict)

  if (!isCoach || crossDistrict.length === 0) return null

  type Option = { key: string | null; schoolName: string; district: string; account: LinkedAccount | null; role: string }
  const options: Option[] = [
    { key: null, schoolName: base?.school_name ?? 'Home', district: baseDistrict, account: null, role: demoRole ?? '' },
    ...crossDistrict.map((a: LinkedAccount) => ({
      key: linkedAccountKey(a), schoolName: a.school_name, district: a.district_name, account: a, role: a.role,
    })),
  ]

  const activeKey = activeProfile ? linkedAccountKey(activeProfile) : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/25 hover:border-white/50 rounded-md px-2.5 py-1 transition-colors"
      >
        <ArrowLeftRight className="w-3 h-3" />
        Switch district
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm gap-0 p-0">
          <DialogHeader className="px-5 py-4 border-b">
            <DialogTitle>Switch District</DialogTitle>
            <DialogDescription>Select which district to work from.</DialogDescription>
          </DialogHeader>
          <div className="p-3 space-y-1.5">
            {options.map(opt => {
              const isCurrent = opt.key === activeKey
              return (
                <button
                  key={opt.key ?? 'base'}
                  disabled={isCurrent}
                  onClick={() => { switchToProfile(opt.account); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg border text-left transition-colors',
                    isCurrent
                      ? 'bg-primary/5 border-primary/30 cursor-default'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center flex-none border',
                    isCurrent
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  )}>
                    {schoolAbbr(opt.district) || opt.district.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{opt.district}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {opt.schoolName} · <span className="capitalize">{opt.role.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-primary flex-none">Current</span>
                  )}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Sport rail ────────────────────────────────────────────────────────────────

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

// ── Nav config ────────────────────────────────────────────────────────────────

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

// ── AppShell ──────────────────────────────────────────────────────────────────

export default function AppShell() {
  const { user, demoRole, logout: clearAuth } = useAuth()
  const { activeProfile } = useProfile()
  const navigate = useNavigate()
  const { t } = useTranslationHelpers()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const { photoUrl } = useUserPhoto()

  const isCoach = demoRole === 'head_coach' || demoRole === 'assistant_coach'
  const base = DEMO_BASE[demoRole ?? '']
  const currentDistrict = activeProfile?.district_name ?? base?.district_name
  const isDiffDistrict  = isCoach && !!activeProfile && activeProfile.district_name !== base?.district_name

  const isParent     = demoRole === 'parent'
  const isMobileOnly = !atLeast(demoRole, 'assistant_coach') && !isParent

  async function handleLogout() {
    await logout()
    clearAuth()
    navigate('/login')
  }

  const visibleNav = NAV_CONFIG.filter(item => {
    if (!item.roles ? !atLeast(demoRole, item.min ?? '') : !item.roles.includes(demoRole ?? '')) return false
    if (item.to === '/dashboard/settings' && isDiffDistrict) return false
    return true
  })

  if (isParent) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-bold tracking-tight">{t('app.name')}</span>
            <span className="ml-3 text-xs text-muted-foreground">{user?.first_name} {user?.last_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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

  const userInitials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* Top bar */}
      <header className="h-12 bg-primary dark:bg-blue-950 flex items-center gap-3 px-4 flex-none">
        <span className="font-bold text-base tracking-tight text-white">KeepUp</span>

        {currentDistrict && (
          <>
            <div className="w-px h-4 bg-white/20 flex-none" />
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                'text-sm truncate',
                isDiffDistrict ? 'text-amber-300 font-medium' : 'text-white/70 dark:text-cyan-400/70'
              )}>
                {currentDistrict}
              </span>
              <DistrictSwitcher demoRole={demoRole} />
            </div>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.signOut')}
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        <aside className={cn(
          'flex-none border-r flex flex-col transition-[width] duration-200',
          collapsed ? 'w-14' : 'w-56'
        )}>

          {/* User avatar — links to profile */}
          <Link
            to="/dashboard/profile"
            className={cn(
              'border-b flex items-center gap-3 min-h-[56px] hover:bg-muted/40 transition-colors',
              collapsed ? 'px-0 py-3 justify-center' : 'px-4 py-3'
            )}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-none select-none ring-1 ring-border">
              {photoUrl
                ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                : userInitials
              }
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {activeProfile ? activeProfile.email : user?.email}
                </p>
              </div>
            )}
          </Link>

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

          {/* Collapse toggle on the divider line */}
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
          <div className="h-3" />

        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
