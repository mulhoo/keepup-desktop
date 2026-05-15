import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { DistrictProvider } from '@/contexts/DistrictContext'
import { BrandingProvider } from '@/contexts/BrandingContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { UserPhotoProvider } from '@/contexts/UserPhotoContext'
import { AccessibilityProvider } from '@/contexts/AccessibilityContext'
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
import Sports from '@/pages/Sports'
import Schools from '@/pages/Schools'
import Settings from '@/pages/Settings'
import AuditLog from '@/pages/AuditLog'
import Import from '@/pages/Import'
import Staff from '@/pages/Staff'
import TeamRoster from '@/pages/TeamRoster'
import TeamAnnouncements from '@/pages/TeamAnnouncements'
import TeamCalendar from '@/pages/TeamCalendar'
import TeamResults from '@/pages/TeamResults'
import Calendar from '@/pages/Calendar'
import AISchedule from '@/pages/AISchedule'
import MeetResults from '@/pages/MeetResults'
import CommissionerEvents from '@/pages/CommissionerEvents'
import Venues from '@/pages/Venues'
import MajorCompetitions from '@/pages/MajorCompetitions'
import UserProfile from '@/pages/UserProfile'
import Join from '@/pages/Join'
import GemmaDemo from '@/pages/GemmaDemo'
import Family from '@/pages/Family'
import FamilyMessages from '@/pages/FamilyMessages'
import FamilyGroupChat from '@/pages/FamilyGroupChat'
import ParentRequests from '@/pages/ParentRequests'
import { Toaster } from '@/components/ui/Toaster'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

const SAFETY_PATHS = ['/dashboard/safety/', '/dashboard/audit-log']

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
        <Route path="announcements" element={<Announcements />} />
        <Route path="sports"        element={<Sports />} />
        <Route path="schools"       element={<Schools />} />
        <Route path="settings"      element={<Settings />} />
        <Route path="audit-log"     element={<SafetyGate><AuditLog /></SafetyGate>} />
        <Route path="safety/chats"  element={<SafetyGate><ChatViewer /></SafetyGate>} />
        <Route path="import"        element={<Import />} />
        <Route path="staff"         element={<Staff />} />
        <Route path="calendar"      element={<Calendar />} />
        <Route path="ai-schedule"   element={<AISchedule />} />
        <Route path="events"        element={<CommissionerEvents />} />
        <Route path="venues"               element={<Venues />} />
        <Route path="major-competitions"   element={<MajorCompetitions />} />
        <Route path="results"       element={<MeetResults />} />
        <Route path="team/:sportId" element={<Navigate to="roster" replace />} />
        <Route path="team/:sportId/roster"        element={<TeamRoster />} />
        <Route path="team/:sportId/announcements" element={<TeamAnnouncements />} />
        <Route path="team/:sportId/calendar"      element={<TeamCalendar />} />
        <Route path="team/:sportId/results"       element={<TeamResults />} />
        <Route path="team/:sportId/import"        element={<Import />} />
        <Route path="family"                   element={<Family />} />
        <Route path="family-messages"         element={<FamilyMessages />} />
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
            <UserPhotoProvider>
            <AccessibilityProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            </AccessibilityProvider>
            </UserPhotoProvider>
          </ProfileProvider>
        </BrandingProvider>
      </SafetyProvider>
      </AuthProvider>
      </DistrictProvider>
    </QueryClientProvider>
  )
}
