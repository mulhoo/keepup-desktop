import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight } from 'lucide-react'
import { fetchLinkedAccounts, DEMO_BASE, type LinkedAccount } from '@/api/linkedAccounts'
import { useProfile, linkedAccountKey } from '@/contexts/ProfileContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

function schoolAbbr(name: string) {
  return name.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 4).join('')
}

export function DistrictSwitcher({ demoRole }: { demoRole: string | null }) {
  const [open, setOpen] = useState(false)
  const { activeProfile, defaultKey, switchToProfile } = useProfile()
  const isCoach = demoRole === 'head_coach' || demoRole === 'assistant_coach'
  const initializedRef = useRef(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: linked = [] } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn:  fetchLinkedAccounts,
    enabled:  isCoach,
  })

  useEffect(() => {
    if (initializedRef.current || !linked.length || !defaultKey) return
    initializedRef.current = true
    const id = parseInt(defaultKey.replace('linked-', ''))
    const match = linked.find((a: LinkedAccount) => a.id === id)
    if (match) switchToProfile(match)
  }, [linked])

  const base         = DEMO_BASE[demoRole ?? '']
  const baseDistrict = base?.district_name ?? ''
  const accepted     = linked.filter((a: LinkedAccount) => a.status === 'accepted')
  const crossDistrict = accepted.filter((a: LinkedAccount) => a.district_name !== baseDistrict)

  if (!isCoach || crossDistrict.length === 0) return null

  type Option = { key: string | null; schoolName: string; district: string; account: LinkedAccount | null; role: string }
  const options: Option[] = [
    { key: null, schoolName: base?.school_name ?? 'Home', district: baseDistrict, account: null, role: demoRole ?? '' },
    ...crossDistrict.map((a: LinkedAccount) => ({
      key: linkedAccountKey(a), schoolName: a.school_name, district: a.district_name, account: a, role: a.role,
    })),
  ]

  const activeKey = activeProfile ? linkedAccountKey(activeProfile) : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/25 hover:border-white/50 rounded-md px-2.5 py-1 transition-colors"
      >
        <ArrowLeftRight className="w-3 h-3" />
        Switch district
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm gap-0 p-0">
          <DialogHeader className="px-5 py-4 border-b">
            <DialogTitle>Switch District</DialogTitle>
            <DialogDescription>Select which district to work from.</DialogDescription>
          </DialogHeader>
          <div className="p-3 space-y-1.5">
            {options.map(opt => {
              const isCurrent = opt.key === activeKey
              return (
                <button
                  key={opt.key ?? 'base'}
                  disabled={isCurrent}
                  onClick={() => {
                  switchToProfile(opt.account)
                  queryClient.invalidateQueries({ queryKey: ['sports'] })
                  queryClient.invalidateQueries({ queryKey: ['sport'] })
                  queryClient.invalidateQueries({ queryKey: ['calendar'] })
                  setOpen(false)
                  navigate('/dashboard/overview')
                }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg border text-left transition-colors',
                    isCurrent
                      ? 'bg-primary/5 border-primary/30 cursor-default'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-md text-xs font-bold flex items-center justify-center flex-none border',
                    isCurrent
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  )}>
                    {schoolAbbr(opt.district) || opt.district.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{opt.district}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {opt.schoolName} · <span className="capitalize">{opt.role.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-primary flex-none">Current</span>
                  )}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
