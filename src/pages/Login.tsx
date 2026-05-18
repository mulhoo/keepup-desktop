import { useState, type FormEvent } from 'react'
import wordingNavy from '@/assets/branding/keepup-wording-navy.png'
import wordingWhite from '@/assets/branding/keepup-wording-white.png'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { loginWithPassword, loginAsDemo, getMicrosoftAuthUrl, DEMO_ROLES, type DemoRole } from '@/api/auth'
import { DEMO_MODE } from '@/api/client'
import { cn } from '@/lib/utils'

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  )
}

export default function Login() {
  const { isDark, toggle: toggleTheme } = useTheme()
  const { login }          = useAuth()
  const navigate           = useNavigate()
  const { pathname }       = useLocation()
  const [searchParams]     = useSearchParams()
  const oauthError         = searchParams.get('error')
  const isDemoRoute        = pathname === '/demo'

  const [tab, setTab]      = useState<'credentials' | 'demo'>(isDemoRoute || DEMO_MODE ? 'demo' : 'credentials')
  const [email, setEmail]  = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]  = useState<string | null>(oauthError)
  const [loading, setLoading] = useState(false)

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginWithPassword(email, password)
      login(res.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoLogin(role: DemoRole) {
    setError(null)
    setLoading(true)
    try {
      const res = await loginAsDemo(role)
      login(res.user, role)
      navigate('/dashboard/gemma-demo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  function handleMicrosoftLogin() {
    window.location.href = getMicrosoftAuthUrl()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      {isDemoRoute && (
        <div className="h-8 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 flex items-center px-4 flex-none">
          <span className="text-xs text-amber-800 dark:text-amber-400">Demo mode — safe to explore</span>
        </div>
      )}
      <div className="flex-1 flex items-center justify-center px-4 pt-7">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <img src={wordingNavy} alt="KeepUp" className="h-14 dark:hidden" />
            <img src={wordingWhite} alt="KeepUp" className="h-14 hidden dark:block" />
          </div>
          <p className="text-sm text-muted-foreground">Communication student-athletes will actually use, with the protection schools need.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            {DEMO_MODE && !isDemoRoute && (
              <div className="flex border-b mb-2">
                <button
                  onClick={() => setTab('demo')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
                    tab === 'demo'
                      ? 'border-foreground/40 text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Try a role
                </button>
                <button
                  onClick={() => setTab('credentials')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
                    tab === 'credentials'
                      ? 'border-foreground/40 text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Sign in
                </button>
              </div>
            )}
            <CardTitle className="text-lg">
              {tab === 'demo' ? 'Explore the demo' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {tab === 'demo'
                ? 'Pick a role to see KeepUp from their perspective.'
                : 'Sign in to your account to continue.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {tab === 'credentials' ? (
              <div className="space-y-4">
                {/* Microsoft SSO — primary for district staff */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleMicrosoftLogin}
                  disabled={loading}
                >
                  <MicrosoftIcon />
                  Sign in with Microsoft
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@school.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="space-y-2">
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.key}
                    onClick={() => handleDemoLogin(role.key)}
                    disabled={loading}
                    className="w-full flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors hover:bg-secondary hover:border-foreground/30 hover:shadow focus:outline-none disabled:opacity-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                    <span className="text-muted-foreground text-xs">→</span>
                  </button>
                ))}
                {error && <p className="text-sm text-destructive pt-1">{error}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {DEMO_MODE && !isDemoRoute && (
          <p className="text-center text-xs text-muted-foreground">
            Demo mode — safe to explore
          </p>
        )}
      </div>
      </div>
    </div>
  )
}
