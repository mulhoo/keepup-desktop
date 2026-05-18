import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { DistrictProvider } from '@/contexts/DistrictContext'
import { BrandingProvider } from '@/contexts/BrandingContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext'
import { applySchoolTheme, clearSchoolTheme } from '@/lib/color'
import AppShell from '@/components/layout/AppShell'
import { SafetyProvider, useSafety } from '@/contexts/SafetyContext'
import { SafetyGate } from '@/components/safety/SafetyGate'
import Login from '@/pages/Login'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import AuthCallback from '@/pages/AuthCallback'
import Overview from '@/pages/Overview'
import Alerts from '@/pages/Alerts'
import ChatViewer from '@/pages/ChatViewer'
import Reviews from '@/pages/Reviews'
import Announcements from '@/pages/Announcements'
import AllAnnouncements from '@/pages/AllAnnouncements'
import Sports from '@/pages/Sports'
import Schools from '@/pages/Schools'
import Settings from '@/pages/Settings'
import AuditLog from '@/pages/AuditLog'
import Staff from '@/pages/Staff'
import TeamRoster from '@/pages/TeamRoster'
import TeamAnnouncements from '@/pages/TeamAnnouncements'
import TeamResults from '@/pages/TeamResults'
import MeetResults from '@/pages/MeetResults'
import UserProfile from '@/pages/UserProfile'
import Join from '@/pages/Join'
import GemmaDemo from '@/pages/GemmaDemo'
import Family from '@/pages/Family'
import FamilyMessages from '@/pages/FamilyMessages'
import FamilyGroups from '@/pages/FamilyGroups'
import FamilyGroupChat from '@/pages/FamilyGroupChat'
import ParentRequests from '@/pages/ParentRequests'
import { Toaster } from '@/components/ui/Toaster'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

const SAFETY_PATHS = ['/dashboard/safety/', '/dashboard/audit-log']

function SchoolThemeApplier() {
  const { prefs }       = useAccessibility()
  const { user, effectiveRole } = useAuth()
  const colorMode       = prefs.color_mode
  const userTheme       = user?.theme ?? null
  const isDistrictLevel = effectiveRole === 'district_admin' || effectiveRole === 'super_admin'

  useEffect(() => {
    const root = document.documentElement
    if (colorMode === 'school' && userTheme && !isDistrictLevel) {
      root.classList.remove('dark')
      applySchoolTheme(userTheme)
    } else {
      clearSchoolTheme()
      colorMode === 'dark'
        ? root.classList.add('dark')
        : root.classList.remove('dark')
    }
  }, [colorMode, userTheme, isDistrictLevel])

  return null
}

function SafetySessionGuard() {
  const { isSafetyAuthenticated, exitSafetySession } = useSafety()
  const location = useLocation()
  const authRef  = useRef(isSafetyAuthenticated)
  authRef.current = isSafetyAuthenticated

  useEffect(() => {
    const onSafetyRoute = SAFETY_PATHS.some(p => location.pathname.startsWith(p))
    if (!onSafetyRoute && authRef.current) {
      exitSafetySession('manual')
    }
  }, [location.pathname, exitSafetySession])

  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()
  return (
    <>
    <SchoolThemeApplier />
    <SafetySessionGuard />
    <Routes>
      <Route
        path="/login"
        element={isLoading ? null : isAuthenticated ? <Navigate to="/dashboard/overview" replace /> : <Login />}
      />
      <Route
        path="/demo"
        element={<Login />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/auth/callback"   element={<AuthCallback />} />
      <Route path="/join"            element={<Join />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><AppShell /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"      element={<Overview />} />
        <Route path="alerts"        element={<Alerts />} />
        <Route path="reviews"       element={<Reviews />} />
        <Route path="announcements"     element={<Announcements />} />
        <Route path="announcements/all" element={<AllAnnouncements />} />
        <Route path="sports"        element={<Sports />} />
        <Route path="schools"       element={<Schools />} />
        <Route path="settings"      element={<Settings />} />
        <Route path="audit-log"     element={<SafetyGate><AuditLog /></SafetyGate>} />
        <Route path="safety/chats"  element={<SafetyGate><ChatViewer /></SafetyGate>} />
        <Route path="staff"         element={<Staff />} />
        <Route path="results"       element={<MeetResults />} />
        <Route path="team/:sportId" element={<Navigate to="roster" replace />} />
        <Route path="team/:sportId/roster"        element={<TeamRoster />} />
        <Route path="team/:sportId/announcements" element={<TeamAnnouncements />} />
        <Route path="team/:sportId/results"       element={<TeamResults />} />
        <Route path="family"                   element={<Family />} />
        <Route path="family-messages"         element={<FamilyMessages />} />
        <Route path="family-groups"           element={<FamilyGroups />} />
        <Route path="family-group/:id"        element={<FamilyGroupChat />} />
        <Route path="parent-requests"         element={<ParentRequests />} />
        <Route path="profile"       element={<UserProfile />} />
        <Route path="gemma-demo"    element={<GemmaDemo />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard/overview' : '/login'} replace />}
      />
    </Routes>
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <DistrictProvider>
      <AuthProvider>
      <SafetyProvider>
        <BrandingProvider>
          <ProfileProvider>
            <AccessibilityProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            </AccessibilityProvider>
          </ProfileProvider>
        </BrandingProvider>
      </SafetyProvider>
      </AuthProvider>
      </DistrictProvider>
    </QueryClientProvider>
  )
}
