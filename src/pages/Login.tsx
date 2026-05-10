import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { loginWithPassword, loginAsDemo, DEMO_ROLES, type DemoRole } from '@/api/auth'
import { DEMO_MODE } from '@/api/client'
import { cn } from '@/lib/utils'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'credentials' | 'demo'>(DEMO_MODE ? 'demo' : 'credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
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
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Wordmark */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">KeepUp</h1>
          <p className="text-sm text-muted-foreground">Communication student-athletes will actually use, with the protection schools need.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            {DEMO_MODE && (
              <div className="flex rounded-md border p-1 gap-1 mb-2">
                <button
                  onClick={() => setTab('demo')}
                  className={cn(
                    'flex-1 rounded py-1.5 text-sm font-medium transition-colors',
                    tab === 'demo'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Try a role
                </button>
                <button
                  onClick={() => setTab('credentials')}
                  className={cn(
                    'flex-1 rounded py-1.5 text-sm font-medium transition-colors',
                    tab === 'credentials'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
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
                  <Label htmlFor="password">Password</Label>
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
            ) : (
              <div className="space-y-2">
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.key}
                    onClick={() => handleDemoLogin(role.key)}
                    disabled={loading}
                    className="w-full flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
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

        {DEMO_MODE && (
          <p className="text-center text-xs text-muted-foreground">
            Demo mode — no real data, safe to explore
          </p>
        )}
      </div>
    </div>
  )
}
