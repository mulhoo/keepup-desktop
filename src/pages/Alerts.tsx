import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ActivityCard from '@/components/activity/ActivityCard'
import { fetchActivities, type Activity } from '@/api/activities'
import { fetchAdViewRequests, approveViewRequest, denyViewRequest, type AdViewRequest } from '@/api/family'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { MessageSquare, Check, X, Clock } from 'lucide-react'
import { useSafety } from '@/contexts/SafetyContext'

type TierFilter = 'severe' | 'questionable' | 'all'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function ViewRequestCard({ req }: { req: AdViewRequest }) {
  const qc = useQueryClient()
  const { logAdminAction } = useSafety()

  const approveMutation = useMutation({
    mutationFn: () => approveViewRequest(req.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adViewRequests'] })
      toast.success('Access approved.')
      logAdminAction('view_request_approved', `Approved chat access for ${req.parent_name} (re: ${req.child_name})`)
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to approve.'),
  })
  const denyMutation = useMutation({
    mutationFn: () => denyViewRequest(req.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adViewRequests'] })
      toast.success('Request denied.')
      logAdminAction('view_request_denied', `Denied chat access for ${req.parent_name} (re: ${req.child_name})`)
    },
    onError: (e: Error) => toast.error(e.message ?? 'Failed to deny.'),
  })

  const isPending = approveMutation.isPending || denyMutation.isPending

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-none" />
        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Parent Chat Access Request</span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{formatDate(req.created_at)}</span>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400 flex-none">
            {req.parent_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold">{req.parent_name}</p>
            <p className="text-xs text-muted-foreground">
              Requesting to view coach-athlete messages for <span className="font-medium text-foreground">{req.child_name}</span>
            </p>
            {req.reason && (
              <p className="text-xs bg-muted/40 rounded px-2.5 py-1.5 text-foreground border-l-2 border-blue-300 dark:border-blue-600">
                "{req.reason}"
              </p>
            )}
            {req.expires_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires {formatDate(req.expires_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
        <button
          onClick={() => denyMutation.mutate()}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border text-destructive border-destructive/60 bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-3.5 h-3.5" />
          Deny
        </button>
        <button
          onClick={() => approveMutation.mutate()}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          Approve access
        </button>
      </div>
    </div>
  )
}

export default function Alerts() {
  const { effectiveRole }    = useAuth()
  const location             = useLocation()
  const focusActivityId      = (location.state as { focusActivityId?: number } | null)?.focusActivityId

  const isCoach           = effectiveRole === 'head_coach' || effectiveRole === 'assistant_coach'
  const isHeadCoach       = effectiveRole === 'head_coach'
  const isDistrictAdmin   = effectiveRole === 'district_admin'
  const isSchoolLevel     = effectiveRole === 'athletic_director' || effectiveRole === 'school_admin'
  const isAD              = ['athletic_director', 'school_admin', 'district_admin', 'super_admin'].includes(effectiveRole ?? '')

  const canNotifyParents       = isHeadCoach || isSchoolLevel || isDistrictAdmin
  const canNotifyAD            = isHeadCoach
  const canNotifyDistrictAdmin = isSchoolLevel

  const canViewActivities = isDistrictAdmin || isSchoolLevel || isHeadCoach || isCoach

  const canFilterTier  = isDistrictAdmin || isSchoolLevel
  const [tierFilter,   setTierFilter]   = useState<TierFilter>(canFilterTier ? 'severe' : 'all')
  const [sportFilter,  setSportFilter]  = useState<Set<string>>(new Set())
  const [schoolFilter, setSchoolFilter] = useState<Set<string>>(new Set())

  const { data: activities, isLoading, isError } = useQuery({
    queryKey: ['activities'],
    queryFn:  fetchActivities,
    enabled:  canViewActivities,
  })

  const { data: viewRequests = [] } = useQuery({
    queryKey: ['adViewRequests'],
    queryFn:  fetchAdViewRequests,
    enabled:  isAD,
    staleTime: 1000 * 30,
  })

  // Clear focus state after first render so navigating back doesn't re-open
  const [focusedId, setFocusedId] = useState<number | undefined>(focusActivityId)
  useEffect(() => {
    if (focusActivityId) {
      setFocusedId(focusActivityId)
      // Clear from history state so a back-nav doesn't retrigger
      window.history.replaceState({}, '')
    }
  }, [focusActivityId])

  const allActivities = activities ?? []

  const sportNames  = [...new Set(allActivities.map(a => a.sport).filter(Boolean) as string[])].sort()
  const schoolNames = [...new Set(allActivities.map(a => a.school_name).filter(Boolean) as string[])].sort()

  const visible = allActivities.filter((a: Activity) => {
    if (canFilterTier && tierFilter !== 'all' && a.tier !== tierFilter) return false
    if (sportFilter.size  > 0 && (!a.sport      || !sportFilter.has(a.sport)))           return false
    if (schoolFilter.size > 0 && (!a.school_name || !schoolFilter.has(a.school_name)))   return false
    return true
  })

  const hasFilters = sportFilter.size > 0 || schoolFilter.size > 0
  const totalCount = visible.length + viewRequests.length

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isDistrictAdmin
            ? 'Flagged incidents across schools in your district.'
            : isCoach
            ? 'Flagged messages for your teams.'
            : 'Flagged messages, data access events, and parent requests for your school.'}
        </p>
      </div>

      <div>
        {/* Filter row */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {canFilterTier && (
            <div className="flex items-center gap-1 rounded-md border p-0.5">
              {(['severe', 'questionable', 'all'] as TierFilter[]).map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={cn(
                    'px-3 py-1 rounded text-xs font-medium transition-colors',
                    tierFilter === tier
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tier === 'severe' ? 'Severe' : tier === 'questionable' ? 'Questionable' : 'All'}
                </button>
              ))}
            </div>
          )}

          {sportNames.length > 1 && (
            <MultiSelect
              options={sportNames}
              selected={sportFilter}
              onChange={setSportFilter}
              placeholder="All sports"
              className="rounded-lg"
            />
          )}

          {schoolNames.length > 1 && (
            <MultiSelect
              options={schoolNames}
              selected={schoolFilter}
              onChange={setSchoolFilter}
              placeholder="All schools"
              className="rounded-lg"
            />
          )}

          {hasFilters && (
            <button
              onClick={() => { setSportFilter(new Set()); setSchoolFilter(new Set()) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {isLoading && (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading alerts…</div>
        )}
        {isError && (
          <div className="rounded-lg border p-6 text-sm text-destructive">Failed to load alerts.</div>
        )}
        {!isLoading && !isError && totalCount === 0 && (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            {canFilterTier && tierFilter !== 'all' && !hasFilters
              ? `No ${tierFilter} incidents to review.`
              : 'No alerts at this time.'}
          </div>
        )}

        {!isLoading && !isError && totalCount > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {totalCount} {totalCount !== 1 ? 'items' : 'item'} pending review
            </p>

            {/* Parent view requests first — they need action */}
            {viewRequests.map(req => (
              <ViewRequestCard key={`vr-${req.id}`} req={req} />
            ))}

            {/* Flagged message / data access activities */}
            {visible.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                canNotifyParents={canNotifyParents && activity.event_type === 'message_flagged'}
                canNotifyAD={canNotifyAD && activity.event_type === 'message_flagged'}
                canNotifyDistrictAdmin={canNotifyDistrictAdmin && activity.event_type === 'message_flagged'}
                canDelete={(isHeadCoach || isSchoolLevel || isDistrictAdmin) && activity.event_type === 'message_flagged'}
                defaultOpen={activity.id === focusedId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
