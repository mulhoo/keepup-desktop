import { useState, type FormEvent, useEffect, useRef } from 'react'
import { Shield, ShieldCheck, Mail, Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestSafetyCode, verifySafetyCode } from '@/api/safety'
import { useSafety } from '@/contexts/SafetyContext'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

type Step = 'password' | 'code' | 'done'

interface Props {
  children: React.ReactNode
}

export function SafetyGate({ children }: Props) {
  const { isSafetyAuthenticated, sessionStartedAt, exitSafetySession, resetInactivity } = useSafety()
  const { user } = useAuth()

  // Reset inactivity on any mouse/keyboard activity inside safety pages
  useEffect(() => {
    if (!isSafetyAuthenticated) return
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetInactivity, { passive: true }))
    return () => events.forEach(e => window.removeEventListener(e, resetInactivity))
  }, [isSafetyAuthenticated, resetInactivity])

  if (isSafetyAuthenticated) {
    return (
      <div>
        {/* Safety session indicator bar */}
        <div className="flex items-center justify-between px-6 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safety session active — auto-logout after 5 min idle
            {sessionStartedAt && (
              <span className="text-amber-600 dark:text-amber-500 ml-1">
                (started {sessionStartedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })})
              </span>
            )}
          </span>
          <button
            onClick={() => exitSafetySession('manual')}
            className="flex items-center gap-1 font-medium hover:text-amber-950 dark:hover:text-amber-200 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            End session
          </button>
        </div>
        {children}
      </div>
    )
  }

  return <SafetyAuthForm userEmail={user?.email} />
}

function SafetyAuthForm({ userEmail }: { userEmail?: string }) {
  const { enterSafetySession } = useSafety()
  const [step, setStep]         = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [code, setCode]         = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const codeInputRef            = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus()
  }, [step])

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await requestSafetyCode(password)
      if (res.dev_bypass) {
        enterSafetySession()
        return
      }
      setSentEmail(res.email)
      setStep('code')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code. Check your password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifySafetyCode(code)
      enterSafetySession()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code.')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Safety Section Access</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This area requires additional verification. Your access will be logged.
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 justify-center">
          {(['password', 'code'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={cn('w-8 h-px', step === 'code' ? 'bg-primary' : 'bg-border')} />}
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
                step === s || (s === 'password' && step === 'code')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {i + 1}
              </div>
            </div>
          ))}
        </div>

        {step === 'password' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="safety-password">Confirm your password</Label>
              <Input
                id="safety-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your KeepUp password"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending code…</>
                : <><Mail className="w-4 h-4 mr-2" />Send verification code</>
              }
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="safety-code">Verification code</Label>
              <p className="text-xs text-muted-foreground">
                A 6-digit code was sent to <span className="font-medium">{sentEmail || userEmail}</span>
              </p>
              <Input
                id="safety-code"
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-xl tracking-widest font-mono"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying…</>
                : <><ShieldCheck className="w-4 h-4 mr-2" />Verify & enter</>
              }
            </Button>
            <button
              type="button"
              onClick={() => { setStep('password'); setCode(''); setError(null) }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
