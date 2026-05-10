import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { atLeast } from '@/lib/roles'
import { Button } from '@/components/ui/button'
import { Palette, ImageIcon, ChevronRight, Trophy, Link2, Link2Off, Send, X, Building2 } from 'lucide-react'
import ThemeEditor from '@/components/theme/ThemeEditor'
import SchoolBrandingEditor from '@/components/branding/SchoolBrandingEditor'
import { useBranding } from '@/contexts/BrandingContext'
import { fetchSports, DEMO_COACH_SPORTS } from '@/api/sports'

function schoolAbbr(name: string) {
  return name.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 4).join('')
}
import { fetchLinkedAccounts, fetchPendingInvitations, DEMO_BASE, type LinkedAccount, type PendingInvitation } from '@/api/linkedAccounts'
import { useProfile, linkedAccountKey } from '@/contexts/ProfileContext'

function MyTeamsSection({ demoRole }: { demoRole: string | null }) {
  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn: () => fetchSports(),
  })

  const schoolYears = [...new Set(sports.map(s => s.school_year))].sort().reverse()
  const currentYear = schoolYears[0] ?? ''

  const mySports = sports
    .filter(s => s.school_year === currentYear && DEMO_COACH_SPORTS[demoRole ?? '']?.[s.id] !== undefined)
    .sort((a, b) => {
      const ra = DEMO_COACH_SPORTS[demoRole ?? '']?.[a.id] === 'head_coach' ? 0 : 1
      const rb = DEMO_COACH_SPORTS[demoRole ?? '']?.[b.id] === 'head_coach' ? 0 : 1
      return ra - rb || a.name.localeCompare(b.name)
    })

  if (mySports.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">My Teams</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Your current rosters for {currentYear}.</p>
      </div>
      <div className="space-y-2">
        {mySports.map(sport => (
          <Link
            key={sport.id}
            to={`/dashboard/team/${sport.id}`}
            className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-none">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{sport.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                {DEMO_COACH_SPORTS[demoRole ?? '']?.[sport.id] === 'head_coach' ? 'Head Coach' : 'Asst. Coach'}
                <span className="text-muted-foreground/40">·</span>
                {sport.athlete_count} athletes
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-muted text-muted-foreground px-1 py-0.5 rounded">
                  <Building2 className="w-2.5 h-2.5" />
                  {schoolAbbr(sport.school_name)}
                </span>
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function DefaultProfileSection({ demoRole }: { demoRole: string | null }) {
  const { defaultKey, setDefaultKey } = useProfile()

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts', demoRole],
    queryFn: () => fetchLinkedAccounts(demoRole ?? ''),
    enabled: !!demoRole,
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
              <div className={`w-8 h-8 rounded-md text-[10px] font-bold flex items-center justify-center flex-none border ${
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
                <span className="text-[10px] font-medium text-primary flex-none">Default</span>
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

function LinkedAccountsSection({ demoRole }: { demoRole: string | null }) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [pendingMock, setPendingMock] = useState<PendingInvitation[]>([])
  const [removedIds, setRemovedIds] = useState<number[]>([])
  const queryClient = useQueryClient()

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts', demoRole],
    queryFn: () => fetchLinkedAccounts(demoRole ?? ''),
    enabled: !!demoRole,
  })

  const { data: serverPending = [] } = useQuery({
    queryKey: ['linked-pending', demoRole],
    queryFn: () => fetchPendingInvitations(demoRole ?? ''),
    enabled: !!demoRole,
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
                onClick={() => removeLink(account.id)}
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
          {allPending.map(inv => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-dashed bg-muted/30"
            >
              <Send className="w-3.5 h-3.5 text-muted-foreground flex-none" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{inv.email}</p>
                <p className="text-[10px] text-muted-foreground">Invitation sent — waiting for them to accept</p>
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
    </section>
  )
}

export default function Settings() {
  const { demoRole } = useAuth()
  const { schoolBranding } = useBranding()
  const isCoach = demoRole === 'head_coach' || demoRole === 'assistant_coach'

  const canTheme    = atLeast(demoRole, 'athletic_director') && demoRole !== 'district_admin'
  const canBranding = demoRole === 'athletic_director' || demoRole === 'school_admin'

  const [themeOpen,    setThemeOpen]    = useState(false)
  const [brandingOpen, setBrandingOpen] = useState(false)

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your school configuration.</p>
      </div>

      {isCoach && <MyTeamsSection demoRole={demoRole} />}
      {isCoach && <DefaultProfileSection demoRole={demoRole} />}
      {isCoach && <LinkedAccountsSection demoRole={demoRole} />}

      {canBranding && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">School Branding</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              School icon and banner shown across the mobile app.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border bg-muted/50 overflow-hidden flex items-center justify-center flex-none">
              {schoolBranding.icon_url
                ? <img src={schoolBranding.icon_url} alt="School icon" className="w-full h-full object-cover" />
                : <ImageIcon className="w-5 h-5 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 h-14 rounded-xl border bg-muted/50 overflow-hidden flex items-center justify-center">
              {schoolBranding.banner_url
                ? <img src={schoolBranding.banner_url} alt="School banner" className="w-full h-full object-cover" />
                : <span className="text-xs text-muted-foreground">No banner set</span>
              }
            </div>
          </div>

          <Button variant="outline" className="gap-2" onClick={() => setBrandingOpen(true)}>
            <ImageIcon className="w-4 h-4" />
            Edit school branding
          </Button>
          <SchoolBrandingEditor open={brandingOpen} onClose={() => setBrandingOpen(false)} />
        </section>
      )}

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
