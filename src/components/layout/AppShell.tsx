import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdViewRequests } from '@/api/family'
import { fetchFlaggedMessages } from '@/api/flaggedMessages'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  BarChart2,
  PanelLeftClose, PanelLeftOpen, ChevronDown, Menu, X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { logout, resetDemo, DEMO_ROLES } from '@/api/auth'
import { atLeast } from '@/lib/roles'
import { useTranslationHelpers } from '@/lib/i18n'
import { useTheme } from '@/hooks/useTheme'
import { useProfile } from '@/contexts/ProfileContext'
import { useBranding } from '@/contexts/BrandingContext'
import { clearDestroyedIds } from '@/lib/destroyedStudents'
import { DEMO_BASE } from '@/api/linkedAccounts'
import { DistrictSwitcher } from './DistrictSwitcher'
import { SportRail } from './SportRail'
import { NotificationBell } from './NotificationBell'
import { cn } from '@/lib/utils'
import GemmaDemo from '@/pages/GemmaDemo'
import wordingNavy from '@/assets/branding/keepup-wording-navy.png'
import wordingWhite from '@/assets/branding/keepup-wording-white.png'
import menuOverviewBlue      from '@/assets/icons/blue/menu-overview-icon-blue.png'
import menuAnnouncementsBlue from '@/assets/icons/blue/menu-annoucements-icon-blue.png'
import menuSafetyBlue        from '@/assets/icons/blue/menu-safety-icon-blue.png'
import menuDemoBlue          from '@/assets/icons/blue/menu-demo-icon-blue.png'
import menuFlagBlue          from '@/assets/icons/blue/menu-flag-icon-blue.png'
import menuChatBlue          from '@/assets/icons/blue/menu-chat-icon-blue.png'
import menuAlertBlue         from '@/assets/icons/blue/menu-alert-icon-blue.png'
import menuSportsBlue        from '@/assets/icons/blue/menu-sports-icon-blue.png'
import menuSchoolsBlue       from '@/assets/icons/blue/menu-schools-icon-blue.png'
import menuStaffBlue         from '@/assets/icons/blue/menu-staff-icon-blue.png'
import menuRequestsBlue      from '@/assets/icons/blue/menu-requests-icon-blue.png'
import menuHouseBlue         from '@/assets/icons/blue/menu-house-icon-blue.png'
import familyBlue            from '@/assets/icons/blue/family.png'
import lockBlue              from '@/assets/icons/blue/lock.png'
import sunBlue               from '@/assets/icons/blue/sun.png'
import moonBlue              from '@/assets/icons/blue/moon.png'
import logOutBlue            from '@/assets/icons/blue/log-out.png'
import btnSettingsBlue       from '@/assets/icons/blue/btn-settings-blue.png'
import menuOverviewNavy      from '@/assets/icons/navy/menu-overview-icon-blue.png'
import menuAnnouncementsNavy from '@/assets/icons/navy/menu-annoucements-icon-blue.png'
import menuSafetyNavy        from '@/assets/icons/navy/menu-safety-icon-blue.png'
import menuDemoNavy          from '@/assets/icons/navy/menu-demo-icon-blue.png'
import menuFlagNavy          from '@/assets/icons/navy/menu-flag-icon-blue.png'
import menuChatNavy          from '@/assets/icons/navy/menu-chat-icon-blue.png'
import menuAlertNavy         from '@/assets/icons/navy/menu-alert-icon-blue.png'
import menuSportsNavy        from '@/assets/icons/navy/menu-sports-icon-blue.png'
import menuSchoolsNavy       from '@/assets/icons/navy/menu-schools-icon-blue.png'
import menuStaffNavy         from '@/assets/icons/navy/menu-staff-icon-blue.png'
import menuRequestsNavy      from '@/assets/icons/navy/menu-requests-icon-blue.png'
import menuHouseNavy         from '@/assets/icons/navy/menu-house-icon-blue.png'
import familyNavy            from '@/assets/icons/navy/family.png'
import lockNavy              from '@/assets/icons/navy/lock.png'
import sunNavy               from '@/assets/icons/navy/sun.png'
import moonNavy              from '@/assets/icons/navy/moon.png'
import logOutNavy            from '@/assets/icons/navy/log-out.png'
import btnSettingsNavy       from '@/assets/icons/navy/btn-settings-blue.png'
import menuAuditBlue         from '@/assets/icons/blue/menu-audit-icon-blue.png'
import menuAuditNavy         from '@/assets/icons/navy/menu-audit-icon-blue.png'

type NavIconProps = { className?: string; isActive?: boolean; isDark?: boolean }

function MenuIcon({ light, dark, className, isActive }: { light: string; dark: string; className?: string; isActive?: boolean; isDark?: boolean }) {
  // light mode: inactive→navy, active→blue; dark mode: inactive→blue, active→navy
  const lightSrc = isActive ? dark  : light
  const darkSrc  = isActive ? light : dark
  return (
    <>
      <img src={lightSrc} alt="" className={cn(className, 'dark:hidden')}      style={{ objectFit: 'contain' }} />
      <img src={darkSrc}  alt="" className={cn(className, 'hidden dark:block')} style={{ objectFit: 'contain' }} />
    </>
  )
}
const MenuOverview      = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuOverviewNavy}      dark={menuOverviewBlue}      isActive={isActive} isDark={isDark} className={className} />
const MenuAnnouncements = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuAnnouncementsNavy} dark={menuAnnouncementsBlue} isActive={isActive} isDark={isDark} className={className} />
const MenuSafety        = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuSafetyNavy}        dark={menuSafetyBlue}        isActive={isActive} isDark={isDark} className={className} />
const MenuDemo          = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuDemoNavy}          dark={menuDemoBlue}          isActive={isActive} isDark={isDark} className={className} />
const MenuFlag          = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuFlagNavy}          dark={menuFlagBlue}          isActive={isActive} isDark={isDark} className={className} />
const MenuChat          = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuChatNavy}          dark={menuChatBlue}          isActive={isActive} isDark={isDark} className={className} />
const MenuAlert         = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuAlertNavy}         dark={menuAlertBlue}         isActive={isActive} isDark={isDark} className={className} />
const MenuSports        = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuSportsNavy}        dark={menuSportsBlue}        isActive={isActive} isDark={isDark} className={className} />
const MenuSchools       = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuSchoolsNavy}       dark={menuSchoolsBlue}       isActive={isActive} isDark={isDark} className={className} />
const MenuStaff         = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuStaffNavy}        dark={menuStaffBlue}         isActive={isActive} isDark={isDark} className={className} />
const MenuRequests      = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuRequestsNavy}      dark={menuRequestsBlue}      isActive={isActive} isDark={isDark} className={className} />
const MenuHouse         = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuHouseNavy}         dark={menuHouseBlue}         isActive={isActive} isDark={isDark} className={className} />
const MenuFamily        = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={familyNavy}            dark={familyBlue}            isActive={isActive} isDark={isDark} className={className} />
const LockIcon          = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={lockNavy}              dark={lockBlue}              isActive={isActive} isDark={isDark} className={className} />
const SunIcon           = ({ className,           isDark }: NavIconProps) => <MenuIcon light={sunNavy}               dark={sunBlue}               isDark={isDark}                   className={className} />
const MoonIcon          = ({ className,           isDark }: NavIconProps) => <MenuIcon light={moonNavy}              dark={moonBlue}              isDark={isDark}                   className={className} />
const LogOutIcon        = ({ className,           isDark }: NavIconProps) => <MenuIcon light={logOutNavy}            dark={logOutBlue}            isDark={isDark}                   className={className} />
const SettingsIcon      = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={btnSettingsNavy}       dark={btnSettingsBlue}       isActive={isActive} isDark={isDark} className={className} />
const MenuAudit         = ({ className, isActive, isDark }: NavIconProps) => <MenuIcon light={menuAuditNavy}         dark={menuAuditBlue}         isActive={isActive} isDark={isDark} className={className} />
const ResultsIcon       = ({ className                   }: NavIconProps) => <BarChart2 className={className} />


const COACH_ROLES = ['assistant_coach', 'head_coach', 'athletic_director', 'school_admin', 'district_admin', 'super_admin']

type NavChild = { to: string; label: string; icon: React.FC<NavIconProps>; roles?: string[] }
type NavItem  = { to?: string; key: string; icon: React.FC<NavIconProps>; min?: string; roles?: string[]; children?: NavChild[] }

const AD_ROLES = ['athletic_director', 'school_admin', 'district_admin', 'super_admin']

const SAFETY_SUBNAV: NavChild[] = [
  { to: '/dashboard/safety/chats', label: 'Chat Viewer', icon: MenuChat },
  { to: '/dashboard/audit-log',    label: 'Audit Log',   icon: MenuAudit,     roles: AD_ROLES },
]

const NAV_CONFIG: NavItem[] = [
  { to: '/dashboard/overview',        key: 'nav.overview',       icon: MenuOverview,      min: 'assistant_coach'   },
  { to: '/dashboard/alerts',          key: 'nav.alerts',         icon: MenuAlert,         roles: ['assistant_coach', 'head_coach', 'athletic_director', 'school_admin', 'district_admin', 'super_admin'] },
  { to: '/dashboard/reviews',         key: 'nav.reviews',        icon: MenuFlag,          roles: ['assistant_coach', 'head_coach', 'athletic_director', 'school_admin', 'super_admin'] },
  { key: 'nav.safety',                icon: MenuSafety,          roles: ['head_coach', 'athletic_director', 'school_admin', 'district_admin', 'super_admin'], children: SAFETY_SUBNAV },
  { to: '/dashboard/announcements',   key: 'nav.announcements',  icon: MenuAnnouncements, roles: COACH_ROLES       },
  { to: '/dashboard/sports',          key: 'nav.sports',         icon: MenuSports,        roles: ['athletic_director', 'school_admin', 'district_admin', 'super_admin'] },
  { to: '/dashboard/results',         key: 'nav.results',        icon: ResultsIcon,       roles: ['super_admin'] },
  { to: '/dashboard/schools',         key: 'nav.schools',        icon: MenuSchools,       min: 'district_admin'    },
  { to: '/dashboard/staff',           key: 'nav.staff',          icon: MenuStaff,         min: 'athletic_director' },
  { to: '/dashboard/parent-requests', key: 'nav.parentRequests', icon: MenuRequests,      roles: ['athletic_director', 'school_admin', 'district_admin', 'super_admin'] },
  { to: '/dashboard/gemma-demo',      key: 'nav.gemmaDemo',      icon: MenuDemo,          roles: ['head_coach', 'assistant_coach', 'student', 'student_captain', 'parent', 'athletic_director', 'school_admin'] },
  { to: '/dashboard/settings',        key: 'nav.settings',       icon: SettingsIcon,      min: 'assistant_coach'   },
]

export default function AppShell() {
  const { user, demoRole, effectiveRole, logout: clearAuth } = useAuth()
  const { activeProfile, resetProfile } = useProfile()
  const { resetBranding } = useBranding()
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const { t }       = useTranslationHelpers()
  const tStr        = t as (key: string) => string
  const { isDark, toggle: toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const location      = useLocation()
  const isCoach       = effectiveRole === 'head_coach' || effectiveRole === 'assistant_coach'
  const base          = DEMO_BASE[demoRole ?? '']
  const isDiffDistrict  = isCoach && !!activeProfile && activeProfile.district_name !== base?.district_name

  const headerLabel = activeProfile?.district_name ?? base?.district_name ?? null

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

  const safetyChildPaths   = SAFETY_SUBNAV.map(c => c.to)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const init = new Set<string>()
    if (safetyChildPaths.some(p => location.pathname.startsWith(p))) init.add('nav.safety')
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
    clearDestroyedIds()
    queryClient.clear()
    navigate('/login')
  }

  async function handleEndDemo() {
    await resetDemo()
    clearAuth()
    resetProfile()
    resetBranding()
    clearDestroyedIds()
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

  useEffect(() => { setMobileNavOpen(false) }, [location.pathname])

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
      { to: '/dashboard/family',          label: 'Family',        icon: MenuHouse     },
      { to: '/dashboard/family-messages', label: 'Safety',        icon: MenuSafety,   locked: true },
      { to: '/dashboard/family-groups',   label: 'Family Groups', icon: MenuFamily    },
      { to: '/dashboard/gemma-demo',      label: 'Gemma 4',       icon: MenuDemo      },
    ]

    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top bar */}
        <header className="h-12 bg-muted border-b dark:border-transparent dark:bg-blue-950 flex items-center gap-3 px-4 flex-none">
          <button
            onClick={() => setMobileNavOpen(v => !v)}
            aria-label="Open navigation"
            className="md:hidden w-8 h-8 rounded-md flex items-center justify-center text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 transition-colors flex-none"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src={wordingNavy} alt="KeepUp" className="h-7 dark:hidden" />
          <img src={wordingWhite} alt="KeepUp" className="h-7 hidden dark:block" />
          {demoRole && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-foreground/8 dark:bg-white/10 text-foreground/60 dark:text-white/60 flex-none">
              {demoRoleLabel ?? 'demo'}
            </span>
          )}
          <div className="flex-1" />
          {demoRole && (
            <button onClick={handleEndDemo} className="hidden sm:block text-xs text-foreground/50 dark:text-white/50 hover:text-foreground dark:hover:text-white transition-colors">
              Reset demo
            </button>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-md flex items-center justify-center text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 transition-colors"
          >
            {isDark ? <SunIcon className="w-4 h-4" isDark={isDark} /> : <MoonIcon className="w-4 h-4" isDark={isDark} />}
          </button>
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-sm text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
          >
            <LogOutIcon className="w-4 h-4" isDark={isDark} />
            {t('nav.signOut')}
          </button>
        </header>

        {/* Mobile nav drawer — parent layout */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 max-w-[85vw] bg-background border-r flex flex-col overflow-hidden">
              <div className="h-12 flex items-center gap-3 px-4 bg-muted dark:bg-blue-950 border-b flex-none">
                <img src={wordingNavy} alt="KeepUp" className="h-7 dark:hidden" />
                <img src={wordingWhite} alt="KeepUp" className="h-7 hidden dark:block" />
                <div className="flex-1" />
                <button onClick={() => setMobileNavOpen(false)} className="w-8 h-8 flex items-center justify-center text-muted-foreground rounded-md hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 py-4 border-b flex-none">
                <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-muted-foreground dark:text-white/50 mt-0.5">Parent</p>
              </div>
              <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                {parentNav.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="w-4 h-4 flex-none" isActive={isActive} isDark={isDark} />
                        <span className="flex-1">{item.label}</span>
                        {item.locked && <LockIcon className="w-3 h-3 opacity-50" isActive={isActive} isDark={isDark} />}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="px-2 pb-3 pt-2 border-t flex-none">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 transition-colors"
                >
                  <LogOutIcon className="w-4 h-4 flex-none" isDark={isDark} />
                  {t('nav.signOut')}
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Parent sidebar — hidden on mobile */}
          <aside className="hidden md:flex w-52 border-r flex-col shrink-0 bg-muted/50 dark:bg-black/20">
            <div className="px-4 py-4 border-b">
              <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-muted-foreground dark:text-white/50 mt-0.5">Parent</p>
            </div>

            <nav className="flex-1 p-2 space-y-0.5">
              {parentNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-4 h-4 flex-none" isActive={isActive} isDark={isDark} />
                      <span className="flex-1">{item.label}</span>
                      {item.locked && <LockIcon className="w-3 h-3 opacity-50" isActive={isActive} isDark={isDark} />}
                    </>
                  )}
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
        <header className="h-12 bg-muted border-b dark:border-transparent dark:bg-blue-950 flex items-center gap-3 px-4 flex-none">
          <img src={wordingNavy} alt="KeepUp" className="h-7 dark:hidden" />
          <img src={wordingWhite} alt="KeepUp" className="h-7 hidden dark:block" />
          {demoRole && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-foreground/8 dark:bg-white/10 text-foreground/60 dark:text-white/60 flex-none">
              {demoRoleLabel ?? 'demo'}
            </span>
          )}
          <div className="flex-1" />
          {demoRole && (
            <button onClick={handleEndDemo} className="hidden sm:block text-xs text-foreground/50 dark:text-white/50 hover:text-foreground dark:hover:text-white transition-colors">
              Reset demo
            </button>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-md flex items-center justify-center text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 transition-colors"
          >
            {isDark ? <SunIcon className="w-4 h-4" isDark={isDark} /> : <MoonIcon className="w-4 h-4" isDark={isDark} />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
          >
            <LogOutIcon className="w-4 h-4" isDark={isDark} />
            <span className="hidden sm:inline">{t('nav.signOut')}</span>
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

      {/* Top bar */}
      <header className="h-12 bg-muted border-b dark:border-transparent dark:bg-blue-950 flex items-center gap-3 px-4 flex-none">
        <button
          onClick={() => setMobileNavOpen(v => !v)}
          aria-label="Open navigation"
          className="md:hidden w-8 h-8 rounded-md flex items-center justify-center text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 transition-colors flex-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src={wordingNavy} alt="KeepUp" className="h-7 flex-none dark:hidden" />
        <img src={wordingWhite} alt="KeepUp" className="h-7 flex-none hidden dark:block" />
        {demoRole && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-foreground/8 dark:bg-white/10 text-foreground/60 dark:text-white/60 flex-none">
            {demoRoleLabel ?? 'demo'}
          </span>
        )}

        {headerLabel && (
          <>
            <div className="w-px h-4 bg-foreground/20 dark:bg-white/20 flex-none hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className={cn(
                'text-sm truncate',
                isDiffDistrict ? 'text-amber-600 dark:text-amber-300 font-medium' : 'text-foreground/60 dark:text-cyan-400/70'
              )}>
                {headerLabel}
              </span>
              <DistrictSwitcher demoRole={demoRole} />
            </div>
          </>
        )}

        <div className="flex-1" />

        {demoRole && (
          <button onClick={handleEndDemo} className="hidden sm:block text-xs text-foreground/50 dark:text-white/50 hover:text-foreground dark:hover:text-white transition-colors">
            Reset demo
          </button>
        )}

        <NotificationBell />

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-md flex items-center justify-center text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 transition-colors"
        >
          {isDark ? <SunIcon className="w-4 h-4" isDark={isDark} /> : <MoonIcon className="w-4 h-4" isDark={isDark} />}
        </button>

        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-1.5 text-sm text-foreground/60 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-foreground/8 dark:hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
        >
          <LogOutIcon className="w-4 h-4" isDark={isDark} />
          {t('nav.signOut')}
        </button>
      </header>

      {/* Mobile nav drawer — main layout */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 max-w-[85vw] bg-background border-r flex flex-col overflow-hidden">
            <div className="h-12 flex items-center gap-3 px-4 bg-muted dark:bg-blue-950 border-b flex-none">
              <img src={wordingNavy} alt="KeepUp" className="h-7 dark:hidden" />
              <img src={wordingWhite} alt="KeepUp" className="h-7 hidden dark:block" />
              <div className="flex-1" />
              <button onClick={() => setMobileNavOpen(false)} className="w-8 h-8 flex items-center justify-center text-muted-foreground rounded-md hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-3 min-h-[56px] hover:bg-muted/40 transition-colors px-4 py-3 border-b flex-none"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-none select-none ring-1 ring-border">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-muted-foreground dark:text-white/45 truncate">
                  {activeProfile ? activeProfile.email : user?.email}
                </p>
              </div>
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
                      <button
                        onClick={() => toggleGroup(key)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                          anyChildActive
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-none" isActive={anyChildActive} isDark={isDark} />
                        {tStr(key)}
                        <ChevronDown className={cn('ml-auto w-3.5 h-3.5 flex-none transition-transform duration-150', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && (
                        <div className="ml-3 pl-3.5 border-l border-border/40 mt-0.5 mb-1 space-y-0.5">
                          {visibleChildren.map(({ to, label, icon: ChildIcon }) => (
                            <NavLink
                              key={to}
                              to={to}
                              className={({ isActive }) => cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                              )}
                            >
                              {({ isActive }) => (
                                <>
                                  <ChildIcon className="w-3.5 h-3.5 flex-none" isActive={isActive} isDark={isDark} />
                                  {label}
                                </>
                              )}
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
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative flex-none">
                          <Icon className="w-4 h-4" isActive={isActive} isDark={isDark} />
                          {hasBadge && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />}
                        </span>
                        {tStr(key)}
                        {hasBadge && (
                          <span className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-xs font-semibold text-destructive-foreground px-1">
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
              <SportRail role={effectiveRole} collapsed={false} />
            </nav>
            {settingsItem && (
              <div className="px-2 pt-2 border-t flex-none">
                <NavLink
                  to={settingsItem.to!}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <SettingsIcon className="w-4 h-4 flex-none" isActive={isActive} isDark={isDark} />
                      {tStr('nav.settings')}
                    </>
                  )}
                </NavLink>
              </div>
            )}
            <div className="px-2 pb-3 pt-1 flex-none">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 transition-colors"
              >
                <LogOutIcon className="w-4 h-4 flex-none" isDark={isDark} />
                {t('nav.signOut')}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        <aside className={cn(
          'hidden md:flex flex-none flex-col transition-[width] duration-200 relative bg-muted/50 dark:bg-black/20',
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
              {userInitials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-muted-foreground dark:text-white/45 truncate">
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
                            : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                        )}
                      >
                        {({ isActive }) => (
                          <Icon className="w-4 h-4 flex-none" isActive={isActive || anyChildActive} isDark={isDark} />
                        )}
                      </NavLink>
                    ) : (
                      <button
                        onClick={() => toggleGroup(key)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                          anyChildActive
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-none" isActive={anyChildActive} isDark={isDark} />
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
                                : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                            )}
                          >
                            {({ isActive }) => (
                              <>
                                <ChildIcon className="w-3.5 h-3.5 flex-none" isActive={isActive} isDark={isDark} />
                                {label}
                              </>
                            )}
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
                        : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative flex-none">
                        <Icon className="w-4 h-4" isActive={isActive} isDark={isDark} />
                        {hasBadge && collapsed && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
                        )}
                      </span>
                      {!collapsed && tStr(key)}
                      {!collapsed && hasBadge && (
                        <span className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-xs font-semibold text-destructive-foreground px-1">
                          {badgeCount}
                        </span>
                      )}
                    </>
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
                      : 'text-muted-foreground dark:text-white/65 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <SettingsIcon className="w-4 h-4 flex-none" isActive={isActive} isDark={isDark} />
                    {!collapsed && tStr('nav.settings')}
                  </>
                )}
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
