import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { refresh }    = useAuth()
  const ran            = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const error = searchParams.get('error')

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    refresh().then(() => navigate('/dashboard', { replace: true }))
  }, [searchParams, navigate, refresh])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
