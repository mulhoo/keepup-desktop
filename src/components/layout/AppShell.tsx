import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdViewRequests } from '@/api/family'
import { fetchFlaggedMessages } from '@/api/flaggedMessages'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, ShieldAlert, Megaphone, Trophy, Building2, Settings, LogOut,
  Sun, Moon, ClipboardList, Upload, UsersRound, BarChart2, Flag, Shield, MessageSquare,
  PanelLeftClose, PanelLeftOpen, CalendarDays, Sparkles, ChevronDown, CalendarCheck, MapPinned, Cpu,
  Home, Lock, InboxIcon,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { logout, resetDemo, DEMO_ROLES } from '@/api/auth'
import { atLeast } from '@/lib/roles'
import { useTranslationHelpers } from '@/lib/i18n'
import { useTheme } from '@/hooks/useTheme'
import { useProfile } from '@/contexts/ProfileContext'
import { useUserPhoto } from '@/contexts/UserPhotoContext'
import { useBranding } from '@/contexts/BrandingContext'
import { DEMO_BASE } from '@/api/linkedAccounts'
import { DistrictSwitcher } from './DistrictSwitcher'
import { SportRail } from './SportRail'
import { NotificationBell } from './NotificationBell'
import { cn } from '@/lib/utils'
import GemmaDemo from '@/pages/GemmaDemo'

function DemoBanner({ label, onEnd }: { label?: string; onEnd: () => void }) {
  return (
    <div className="h-8 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 flex items-center justify-between px-4 flex-none">
      <span className="text-xs text-amber-800 dark:text-amber-400">
        Demo mode{label ? ` — ${label}` : ''}
      </span>
      <button
        onClick={onEnd}
        className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-200 transition-colors"
      >
        End Demo
      </button>
    </div>
  )
}

const COACH_ROLES = ['assistant_coach', 'head_coach', 'athletic_director', 'school_admin', 'district_admin', 'super_admin']

type NavChild = { to: string; label: string; icon: React.ElementType; roles?: string[] }
type NavItem  = { to?: string; key: string; icon: React.ElementType; min?: string; roles?: string[]; children?: NavChild[] }

const AD_ROLES = ['athletic_director', 'school_admin', 'district_admin', 'super_admin']

const SAFETY_SUBNAV: NavChild[] = [
  { to: '/dashboard/safety/chats', label: 'Chat Viewer', icon: MessageSquare },
  { to: '/dashboard/audit-log',    label: 'Audit Log',   icon: ClipboardList, roles: AD_ROLES },
]

const SCHEDULE_SUBNAV: NavChild[] = [
  { to: '/dashboard/calendar',          label: 'Calendar',            icon: CalendarDays },
  { to: '/dashboard/ai-schedule',       label: 'Generate Schedule',   icon: Sparkles     },
  { to: '/dashboard/major-competitions', label: 'Major Competitions', icon: Trophy       },
]

const NAV_CONFIG: NavItem[] = [
  { to: '/dashboard/overview',        key: 'nav.overview',       icon: LayoutDashboard, min: 'assistant_coach'   },
  { to: '/dashboard/alerts',          key: 'nav.alerts',         icon: ShieldAlert,     roles: ['head_coach', 'athletic_director', 'school_admin', 'district_admin', 'super_admin'] },
  { to: '/dashboard/reviews',         key: 'nav.reviews',        icon: Flag,            roles: ['assistant_coach', 'head_coach', 'athletic_director', 'school_admin', 'super_admin'] },
  { key: 'nav.safety',                icon: Shield,              roles: ['head_coach', 'athletic_director', 'school_admin', 'district_admin', 'super_admin'], children: SAFETY_SUBNAV },
  { to: '/dashboard/announcements',   key: 'nav.announcements',  icon: Megaphone,       roles: COACH_ROLES       },
  { to: '/dashboard/sports',          key: 'nav.sports',         icon: Trophy,          roles: ['athletic_director', 'school_admin', 'district_admin', 'super_admin'] },
  { to: '/dashboard/sports',          key: 'nav.teams',          icon: Trophy,          roles: ['sports_commissioner'] },
  { key: 'nav.schedule',              icon: CalendarDays,        roles: ['sports_commissioner'], children: SCHEDULE_SUBNAV },
  { to: '/dashboard/events',          key: 'nav.events',         icon: CalendarCheck,   roles: ['sports_commissioner'] },
  { to: '/dashboard/venues',          key: 'nav.venues',         icon: MapPinned,       roles: ['sports_commissioner'] },
  { to: '/dashboard/results',         key: 'nav.results',        icon: BarChart2,       roles: ['sports_commissioner', 'athletic_director'] },
  { to: '/dashboard/calendar',        key: 'nav.calendar',       icon: CalendarDays,    roles: ['athletic_director', 'school_admin', 'district_admin', 'super_admin'] },
  { to: '/dashboard/schools',         key: 'nav.schools',        icon: Building2,       min: 'district_admin'    },
  { to: '/dashboard/staff',           key: 'nav.staff',          icon: UsersRound,      min: 'athletic_director' },
  { to: '/dashboard/import',          key: 'nav.import',         icon: Upload,          roles: ['athletic_director'] },
  { to: '/dashboard/parent-requests', key: 'nav.parentRequests', icon: InboxIcon,       roles: ['athletic_director', 'school_admin', 'district_admin', 'super_admin'] },
  { to: '/dashboard/gemma-demo',      key: 'nav.gemmaDemo',      icon: Cpu,             roles: ['head_coach', 'assistant_coach'] },
  { to: '/dashboard/settings',        key: 'nav.settings',       icon: Settings,        min: 'assistant_coach'   },
]

export default function AppShell() {
  const { user, demoRole, effectiveRole, logout: clearAuth } = useAuth()
  const { activeProfile, resetProfile } = useProfile()
  const { resetBranding } = useBranding()
  const { resetPhoto, photoUrl } = useUserPhoto()
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const { t }       = useTranslationHelpers()
  const tStr        = t as (key: string) => string
  const { isDark, toggle: toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  const location      = useLocation()
  const isCoach       = effectiveRole === 'head_coach' || effectiveRole === 'assistant_coach'
  const base          = DEMO_BASE[demoRole ?? '']
  const isDiffDistrict  = isCoach && !!activeProfile && activeProfile.district_name !== base?.district_name

  const headerLabel = (() => {
    if (effectiveRole === 'sports_commissioner') {
      const names = base?.managed_sport_names
      return names?.length ? names.join(', ') : (base?.district_name || null)
    }
    return activeProfile?.district_name ?? base?.district_name ?? null
  })()

  const isParent     = effectiveRole === 'parent'
  const isMobileOnly = !atLeast(effectiveRole, 'assistant_coach') && !isParent
  const isAD         = ['athletic_director', 'school_admin', 'district_admin', 'super_admin'].includes(effectiveRole ?? '')
  const canReview    = ['assistant_coach', 'head_coach', 'athletic_director', 'school_admin', 'super_admin'].includes(effectiveRole ?? '')

  const { data: pendingRequests } = useQuery({
    queryKey: ['adViewRequests'],
    queryFn:  fetchAdViewRequests,
    enabled:  isAD,
    staleTime: 1000 * 30,
  })
  const pendingCount = pendingRequests?.length ?? 0

  const { data: flaggedMessages } = useQuery({
    queryKey: ['flagged_messages'],
    queryFn:  fetchFlaggedMessages,
    enabled:  canReview,
    staleTime: 1000 * 30,
  })
  const reviewCount = flaggedMessages?.length ?? 0

  const scheduleChildPaths = SCHEDULE_SUBNAV.map(c => c.to)
  const safetyChildPaths   = SAFETY_SUBNAV.map(c => c.to)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const init = new Set<string>()
    if (scheduleChildPaths.some(p => location.pathname.startsWith(p))) init.add('nav.schedule')
    if (safetyChildPaths.some(p => location.pathname.startsWith(p)))   init.add('nav.safety')
    return init
  })
  function toggleGroup(key: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  async function handleLogout() {
    await logout()
    clearAuth()
    resetProfile()
    resetBranding()
    resetPhoto()
    queryClient.clear()
    navigate('/login')
  }

  async function handleEndDemo() {
    await resetDemo()
    clearAuth()
    resetProfile()
    resetBranding()
    resetPhoto()
    queryClient.clear()
    navigate('/demo', { replace: true })
  }

  const allVisible = NAV_CONFIG.filter(item => {
    if (!item.roles ? !atLeast(effectiveRole, item.min ?? '') : !item.roles.includes(effectiveRole ?? '')) return false
    if (item.to === '/dashboard/settings' && isDiffDistrict) return false
    return true
  })
  const visibleNav   = allVisible.filter(item => item.to !== '/dashboard/settings')
  const settingsItem = allVisible.find(item => item.to === '/dashboard/settings')

  const demoRoleLabel = DEMO_ROLES.find(r => r.key === demoRole)?.label

  // Redirect parents away from non-parent routes to /dashboard/family
  useEffect(() => {
    if (!isParent) return
    const nonParentPaths = ['/dashboard', '/dashboard/overview']
    if (nonParentPaths.includes(location.pathname)) {
      navigate('/dashboard/family', { replace: true })
    }
  }, [isParent, location.pathname, navigate])

  if (isParent) {
    const parentNav = [
      { to: '/dashboard/family',          label: 'Family',   icon: Home          },
      { to: '/dashboard/family-messages', label: 'Messages', icon: MessageSquare, locked: true },
      { to: '/dashboard/gemma-demo',      label: 'Gemma 4',  icon: Cpu           },
    ]

    return (
      <div className="min-h-screen flex flex-col bg-background">
        {demoRole && <DemoBanner label={demoRoleLabel} onEnd={handleEndDemo} />}

        {/* Top bar */}
        <header className="h-12 bg-primary dark:bg-blue-950 flex items-center gap-3 px-4 flex-none">
          <span className="font-bold text-base tracking-tight text-white">{t('app.name')}</span>
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

        <div className="flex flex-1 overflow-hidden">
          {/* Parent sidebar */}
          <aside className="w-52 border-r flex flex-col shrink-0">
            <div className="px-4 py-4 border-b">
              <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Parent</p>
            </div>

            <nav className="flex-1 p-2 space-y-0.5">
              {parentNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="w-4 h-4 flex-none" />
                  <span className="flex-1">{item.label}</span>
                  {item.locked && <Lock className="w-3 h-3 opacity-50" />}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  if (isMobileOnly) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {demoRole && <DemoBanner label={demoRoleLabel} onEnd={handleEndDemo} />}
        <header className="h-12 bg-primary dark:bg-blue-950 flex items-center gap-3 px-4 flex-none">
          <span className="font-bold text-base tracking-tight text-white">KeepUp</span>
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
        <div className="flex-1 overflow-y-auto">
          <GemmaDemo />
        </div>
      </div>
    )
  }

  const userInitials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {demoRole && <DemoBanner label={demoRoleLabel} onEnd={handleEndDemo} />}

      {/* Top bar */}
      <header className="h-12 bg-primary dark:bg-blue-950 flex items-center gap-3 px-4 flex-none">
        <span className="font-bold text-base tracking-tight text-white">KeepUp</span>

        {headerLabel && (
          <>
            <div className="w-px h-4 bg-white/20 flex-none" />
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                'text-sm truncate',
                isDiffDistrict ? 'text-amber-300 font-medium' : 'text-white/70 dark:text-cyan-400/70'
              )}>
                {headerLabel}
              </span>
              <DistrictSwitcher demoRole={demoRole} />
            </div>
          </>
        )}

        <div className="flex-1" />

        <NotificationBell />

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

      <div className="flex flex-1 overflow-hidden">

        <aside className={cn(
          'flex-none flex flex-col transition-[width] duration-200 relative',
          collapsed ? 'w-14' : 'w-56'
        )}>

          {/* User avatar — links to profile */}
          <Link
            to="/dashboard/profile"
            className={cn(
              'flex items-center gap-3 min-h-[56px] hover:bg-muted/40 transition-colors',
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

          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {visibleNav.map(item => {
              const { key, icon: Icon } = item

              if (item.children) {
                const visibleChildren = item.children.filter(c => !c.roles || c.roles.includes(effectiveRole ?? ''))
                if (!visibleChildren.length) return null
                const isOpen = expandedGroups.has(key)
                const anyChildActive = visibleChildren.some(c => location.pathname.startsWith(c.to))
                return (
                  <div key={key}>
                    {collapsed ? (
                      <NavLink
                        to={visibleChildren[0]?.to ?? item.children[0].to}
                        title={tStr(key)}
                        className={({ isActive }) => cn(
                          'flex items-center justify-center rounded-md text-sm transition-colors px-0 py-2.5',
                          isActive || anyChildActive
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-none" />
                      </NavLink>
                    ) : (
                      <button
                        onClick={() => toggleGroup(key)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                          anyChildActive
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-none" />
                        {tStr(key)}
                        <ChevronDown className={cn(
                          'ml-auto w-3.5 h-3.5 flex-none transition-transform duration-150',
                          isOpen && 'rotate-180'
                        )} />
                      </button>
                    )}
                    {!collapsed && isOpen && (
                      <div className="ml-3 pl-3.5 border-l border-border/40 mt-0.5 mb-1 space-y-0.5">
                        {visibleChildren.map(({ to, label, icon: ChildIcon }) => (
                          <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                          >
                            <ChildIcon className="w-3.5 h-3.5 flex-none" />
                            {label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              const badgeCount = item.to === '/dashboard/parent-requests' ? pendingCount
                               : item.to === '/dashboard/reviews'         ? reviewCount
                               : 0
              const hasBadge = badgeCount > 0
              return (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  title={collapsed ? tStr(key) : undefined}
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
                  <span className="relative flex-none">
                    <Icon className="w-4 h-4" />
                    {hasBadge && collapsed && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
                    )}
                  </span>
                  {!collapsed && tStr(key)}
                  {!collapsed && hasBadge && (
                    <span className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground px-1">
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
            <SportRail role={effectiveRole} collapsed={collapsed} />
          </nav>

          {/* Settings pinned at bottom */}
          {settingsItem && (
            <div className="px-2 pb-2 pt-2">
              <NavLink
                to={settingsItem.to!}
                title={collapsed ? tStr('nav.settings') : undefined}
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
                <Settings className="w-4 h-4 flex-none" />
                {!collapsed && tStr('nav.settings')}
              </NavLink>
            </div>
          )}

          {/* Right border with collapse button centered on it */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-border">
            <button
              onClick={() => setCollapsed(v => !v)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors z-10"
            >
              {collapsed
                ? <PanelLeftOpen className="w-3.5 h-3.5" />
                : <PanelLeftClose className="w-3.5 h-3.5" />
              }
            </button>
          </div>

        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
