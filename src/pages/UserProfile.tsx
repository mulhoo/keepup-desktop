import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/contexts/ProfileContext'
import { DEMO_BASE } from '@/api/linkedAccounts'
import { useTranslationHelpers } from '@/lib/i18n'

export default function UserProfile() {
  const { user, demoRole, effectiveRole } = useAuth()
  const { activeProfile } = useProfile()
  const { t } = useTranslationHelpers()
  const tStr  = t as (key: string) => string

  const base = DEMO_BASE[demoRole ?? '']
  const currentSchool   = activeProfile?.school_name   ?? base?.school_name   ?? '—'
  const currentDistrict = activeProfile?.district_name ?? base?.district_name ?? '—'
  const currentEmail    = activeProfile?.email         ?? user?.email         ?? '—'
  const roleLabel       = tStr(`roles.${effectiveRole}`) || effectiveRole?.replace(/_/g, ' ') || '—'
  const initials        = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`

  return (
    <div className="px-10 py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account details.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border flex-none">
          <span className="text-xl font-bold text-primary select-none">{initials}</span>
        </div>
      </div>

      {/* Info fields */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">First name</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{user?.first_name ?? '—'}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Last name</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{user?.last_name ?? '—'}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{currentEmail}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm capitalize">{roleLabel}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">School</label>
            <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm truncate">{currentSchool}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">District</label>
          <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm">{currentDistrict}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Contact your administrator to update your name, email, or role.
      </p>
    </div>
  )
}
