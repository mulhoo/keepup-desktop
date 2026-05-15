import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPassword() {
  const [searchParams]        = useSearchParams()
  const navigate              = useNavigate()
  const token                 = searchParams.get('token') ?? ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Invalid link</CardTitle>
            <CardDescription>This reset link is missing or malformed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/forgot-password">
              <Button variant="outline" className="w-full">Request a new link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Password updated</CardTitle>
            <CardDescription>You'll be redirected to sign in shortly.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">KeepUp</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Set a new password</CardTitle>
            <CardDescription>Must be at least 8 characters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
