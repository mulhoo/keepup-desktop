import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { BrandingProvider } from '@/contexts/BrandingContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { UserPhotoProvider } from '@/contexts/UserPhotoContext'
import { AccessibilityProvider } from '@/contexts/AccessibilityContext'
import AppShell from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Overview from '@/pages/Overview'
import Reviews from '@/pages/Reviews'
import Announcements from '@/pages/Announcements'
import Sports from '@/pages/Sports'
import Schools from '@/pages/Schools'
import Settings from '@/pages/Settings'
import AuditLog from '@/pages/AuditLog'
import Import from '@/pages/Import'
import TeamRoster from '@/pages/TeamRoster'
import UserProfile from '@/pages/UserProfile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard/overview" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><AppShell /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"      element={<Overview />} />
        <Route path="reviews"       element={<Reviews />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="sports"        element={<Sports />} />
        <Route path="schools"       element={<Schools />} />
        <Route path="settings"      element={<Settings />} />
        <Route path="audit-log"     element={<AuditLog />} />
        <Route path="import"        element={<Import />} />
        <Route path="team/:sportId" element={<TeamRoster />} />
        <Route path="profile"       element={<UserProfile />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard/overview' : '/login'} replace />}
      />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  )
}
