import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { atLeast } from '@/lib/roles'
import { Button } from '@/components/ui/button'
import { Palette, Link2, Link2Off, Send, X } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ThemeEditor from '@/components/theme/ThemeEditor'

import { useAccessibility, type FontSize, type ColorMode } from '@/contexts/AccessibilityContext'
import { cn } from '@/lib/utils'


import { fetchLinkedAccounts, fetchPendingInvitations, DEMO_BASE, type LinkedAccount, type PendingInvitation } from '@/api/linkedAccounts'
import { useProfile, linkedAccountKey } from '@/contexts/ProfileContext'


function DefaultProfileSection({ demoRole }: { demoRole: string | null }) {
  const { defaultKey, setDefaultKey } = useProfile()

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn: fetchLinkedAccounts,
  })

  const base = DEMO_BASE[demoRole ?? '']
  const accepted = linked.filter((a: LinkedAccount) => a.status === 'accepted')
  const crossDistrict = accepted.filter((a: LinkedAccount) => a.district_name !== base?.district_name)

  // Only render if there are cross-district accounts (within-district accounts don't need this)
  if (crossDistrict.length === 0) return null

  type ProfileOption = { key: string | null; label: string; district: string; role: string }
  const options: ProfileOption[] = [
    { key: null, label: base?.school_name ?? 'Home', district: base?.district_name ?? '', role: demoRole ?? '' },
    ...crossDistrict.map((a: LinkedAccount) => ({
      key: linkedAccountKey(a), label: a.school_name, district: a.district_name, role: a.role,
    })),
  ]

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Default School</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose which school loads first when you log in. All schools are equal — this only controls what you see first.
        </p>
      </div>
      <div className="space-y-2.5">
        {options.map(opt => {
          const isDefault = opt.key === defaultKey || (opt.key === null && defaultKey === null)
          return (
            <div
              key={opt.key ?? 'base'}
              className="flex items-center gap-3 p-4 rounded-lg border bg-card"
            >
              <div className={`w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center flex-none border ${
                isDefault
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {opt.label.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 3).join('') || opt.label.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{opt.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {opt.district}
                  {' · '}
                  <span className="capitalize">{opt.role.replace(/_/g, ' ')}</span>
                </p>
              </div>
              {isDefault ? (
                <span className="text-xs font-medium text-primary flex-none">Default</span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex-none"
                  onClick={() => setDefaultKey(opt.key)}
                >
                  Set as default
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function LinkedAccountsSection() {
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [pendingMock,   setPendingMock]   = useState<PendingInvitation[]>([])
  const [removedIds,    setRemovedIds]    = useState<number[]>([])
  const [confirmUnlink, setConfirmUnlink] = useState<LinkedAccount | null>(null)
  const queryClient = useQueryClient()

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn: fetchLinkedAccounts,
  })

  const { data: serverPending = [] } = useQuery({
    queryKey: ['linked-pending'],
    queryFn: fetchPendingInvitations,
  })

  const allPending = [...serverPending, ...pendingMock]
  const visibleLinked = linked.filter((a: LinkedAccount) => !removedIds.includes(a.id))

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    const newInvite: PendingInvitation = {
      id: Date.now(),
      email: inviteEmail.trim(),
      sent_at: new Date().toISOString(),
    }
    setPendingMock(prev => [...prev, newInvite])
    setInviteEmail('')
  }

  function removeLink(id: number) {
    setRemovedIds(prev => [...prev, id])
    queryClient.invalidateQueries({ queryKey: ['linked-accounts'] })
  }

  function cancelInvite(id: number) {
    setPendingMock(prev => prev.filter(p => p.id !== id))
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Linked Profiles</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Connect your accounts at other schools so you can switch between them without logging out.
          Each profile stays completely separate — no data crosses between them.
        </p>
      </div>

      {/* Connected accounts */}
      {visibleLinked.length > 0 && (
        <div className="space-y-2.5">
          {visibleLinked.map((account: LinkedAccount) => (
            <div
              key={account.id}
              className="flex items-center gap-3 p-4 rounded-lg border bg-card"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-none">
                <Link2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{account.school_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {account.district_name} · {account.email}
                </p>
              </div>
              <button
                onClick={() => setConfirmUnlink(account)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10 flex-none"
              >
                <Link2Off className="w-3.5 h-3.5" />
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending invitations */}
      {allPending.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
          {allPending.map(inv => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-dashed bg-muted/30"
            >
              <Send className="w-3.5 h-3.5 text-muted-foreground flex-none" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{inv.email}</p>
                <p className="text-xs text-muted-foreground">Invitation sent — waiting for them to accept</p>
              </div>
              <button
                onClick={() => cancelInvite(inv.id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded flex-none"
                aria-label="Cancel invitation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          placeholder="Email at the other school"
          className="flex-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" variant="outline" size="sm" disabled={!inviteEmail.trim()}>
          Send invite
        </Button>
      </form>

      <AlertDialog open={!!confirmUnlink} onOpenChange={v => { if (!v) setConfirmUnlink(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account at {confirmUnlink?.school_name} ({confirmUnlink?.district_name}) will be disconnected.
              You can always send a new invite to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmUnlink) { removeLink(confirmUnlink.id); setConfirmUnlink(null) } }}
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

const FONT_SIZES: FontSize[] = ['small', 'default', 'large']
const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small:   'Small',
  default: 'Default',
  large:   'Large',
}
const FONT_SIZE_SAMPLE_PX: Record<FontSize, number> = {
  small: 15, default: 17, large: 19,
}

const COLOR_MODES: { value: ColorMode; label: string; description: string }[] = [
  { value: 'light',  label: 'Light',  description: 'White background' },
  { value: 'dark',   label: 'Dark',   description: 'Dark navy background' },
  { value: 'school', label: 'School', description: "Your school's brand colors" },
]

function AppearanceCards({
  value,
  onChange,
  hasSchoolTheme,
}: {
  value: ColorMode
  onChange: (v: ColorMode) => void
  hasSchoolTheme: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {COLOR_MODES.map(({ value: mode, label, description }) => {
        const disabled = mode === 'school' && !hasSchoolTheme
        const selected = value === mode
        return (
          <button
            key={mode}
            onClick={() => !disabled && onChange(mode)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-start gap-1.5 py-3 px-3 rounded-lg border transition-colors text-left',
              selected
                ? 'border-primary bg-primary/5'
                : disabled
                  ? 'border-border bg-muted/40 opacity-50 cursor-not-allowed'
                  : 'border-border bg-card hover:bg-muted/40',
            )}
          >
            {/* Mini swatch */}
            <div className={cn(
              'w-full h-8 rounded-md border overflow-hidden flex gap-px',
              mode === 'light'  ? 'bg-[#f0f4f8]' :
              mode === 'dark'   ? 'bg-[#1a2744]' :
                                  'bg-[#1a1d2e]',
            )}>
              <div className={cn(
                'w-1/3 h-full',
                mode === 'light'  ? 'bg-[#22447a]' :
                mode === 'dark'   ? 'bg-[#2c6ea6]' :
                                    'bg-[#06b6d4]',
              )} />
            </div>
            <span className={cn('text-xs font-semibold', selected ? 'text-primary' : 'text-foreground')}>
              {label}
            </span>
            <span className="text-xs text-muted-foreground leading-tight">{description}</span>
            {disabled && <span className="text-xs text-muted-foreground italic">Not configured</span>}
          </button>
        )
      })}
    </div>
  )
}

function FontSizeCards({ value, onChange }: { value: FontSize; onChange: (v: FontSize) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FONT_SIZES.map(size => {
        const selected = value === size
        return (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              'flex flex-col items-center gap-2 py-3 px-2 rounded-lg border transition-colors',
              selected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:bg-muted/40'
            )}
          >
            <span
              className={cn('font-semibold leading-none', selected ? 'text-primary' : 'text-foreground')}
              style={{ fontSize: `${FONT_SIZE_SAMPLE_PX[size]}px` }}
            >
              Aa
            </span>
            <span
              className={cn(selected ? 'text-primary font-semibold' : 'text-muted-foreground')}
              style={{ fontSize: '12px' }}
            >
              {FONT_SIZE_LABELS[size]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function Settings() {
  const { demoRole, effectiveRole, user } = useAuth()
  const { prefs, setFontSize, setColorMode } = useAccessibility()
  const isDistrictLevel = effectiveRole === 'district_admin' || effectiveRole === 'super_admin'
  const hasSchoolTheme  = !!user?.theme && !isDistrictLevel
  const isCoach = effectiveRole === 'head_coach' || effectiveRole === 'assistant_coach'

  const canTheme = atLeast(effectiveRole, 'athletic_director') && effectiveRole !== 'district_admin'

  const [themeOpen, setThemeOpen] = useState(false)

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your school configuration.</p>
      </div>

      {isCoach && <DefaultProfileSection demoRole={demoRole} />}
      {isCoach && <LinkedAccountsSection />}

      {canTheme && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">School Theme</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize your school's colors for the mobile app. You can set one dark and one light theme.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setThemeOpen(true)}>
            <Palette className="w-4 h-4" />
            Edit school theme
          </Button>
          <ThemeEditor open={themeOpen} onClose={() => setThemeOpen(false)} />
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Accessibility</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize how KeepUp looks and feels for you. These preferences are saved to your account.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Appearance</p>
          <AppearanceCards value={prefs.color_mode} onChange={setColorMode} hasSchoolTheme={hasSchoolTheme} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Text size</p>
          <FontSizeCards value={prefs.font_size} onChange={setFontSize} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Account</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your account details.</p>
        </div>
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Account settings coming soon.
        </div>
      </section>
    </div>
  )
}
