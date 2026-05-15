import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchInvitation, acceptInvitation } from '@/api/roster'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  student: 'Student-Athlete',
  parent:  'Parent / Guardian',
}

export default function Join() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [done, setDone]           = useState(false)

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => fetchInvitation(token),
    enabled: !!token,
    retry: false,
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvitation(token, {
      first_name: firstName || invitation?.first_name || '',
      last_name:  lastName  || invitation?.last_name  || '',
      password,
    }),
    onSuccess: () => setDone(true),
  })

  const validationError = (() => {
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return null
  })()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validationError) return
    acceptMutation.mutate()
  }

  if (!token) {
    return <ErrorState message="Invalid invitation link." />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading invitation…</p>
      </div>
    )
  }

  if (error) {
    const msg = (error as Error).message
    return <ErrorState message={msg.includes('already been used') ? 'This invitation has already been used.' : msg.includes('expired') ? 'This invitation has expired.' : 'Invitation not found.'} />
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold">You're all set!</p>
            <p className="text-sm text-muted-foreground">
              Your KeepUp account is ready. Download the app to get started.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full pt-2">
            <a
              href="https://apps.apple.com/app/keepup"
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md text-center hover:bg-primary/90 transition-colors"
            >
              Download on the App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=app.hajos.keepup"
              className="w-full py-2.5 border text-sm font-medium rounded-md text-center hover:bg-muted/50 transition-colors"
            >
              Get it on Google Play
            </a>
          </div>
        </div>
      </div>
    )
  }

  const inv = invitation!
  const roleLabel = ROLE_LABELS[inv.role] ?? inv.role

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">KeepUp</p>
          <h1 className="text-2xl font-bold">Join {inv.school_name}</h1>
          <p className="text-sm text-muted-foreground">
            {inv.sport_name} — {inv.season_name} ({inv.school_year}) · {roleLabel}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">First name</label>
              <input
                type="text"
                value={firstName || inv.first_name || ''}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First"
                className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Last name</label>
              <input
                type="text"
                value={lastName || inv.last_name || ''}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last"
                className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Email</label>
            <input
              type="email"
              value={inv.email}
              disabled
              className="w-full text-sm border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {(validationError && (password.length > 0 || confirm.length > 0)) && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-none" />
              <span>{validationError}</span>
            </div>
          )}

          {acceptMutation.isError && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-none" />
              <span>{(acceptMutation.error as Error).message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!!validationError || acceptMutation.isPending}
            className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {acceptMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          This invitation expires 7 days after it was sent.
          <br />
          If you weren't expecting this, contact your athletic department.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <div className="space-y-1">
          <p className="font-semibold">Invitation unavailable</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}
