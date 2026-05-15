import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/contexts/ProfileContext'
import ActivityCard from '@/components/activity/ActivityCard'
import { fetchActivities, type Activity } from '@/api/activities'
import { fetchSports, type Sport, type SportCoach } from '@/api/sports'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { cn } from '@/lib/utils'

type TierFilter = 'severe' | 'all'

export default function Alerts() {
  const { user, effectiveRole } = useAuth()
  const { activeProfile }       = useProfile()

  const isCoach           = effectiveRole === 'head_coach' || effectiveRole === 'assistant_coach'
  const isDistrictAdmin   = effectiveRole === 'district_admin'
  const isSchoolLevel     = effectiveRole === 'athletic_director' || effectiveRole === 'school_admin'

  const canNotifyParents       = effectiveRole === 'head_coach' || effectiveRole === 'athletic_director' || effectiveRole === 'school_admin' || effectiveRole === 'district_admin'
  const canNotifyAD            = effectiveRole === 'head_coach'
  const canNotifyDistrictAdmin = effectiveRole === 'athletic_director' || effectiveRole === 'school_admin'

  const [tierFilter,   setTierFilter]   = useState<TierFilter>(isDistrictAdmin ? 'severe' : 'all')
  const [sportFilter,  setSportFilter]  = useState<Set<string>>(new Set())
  const [schoolFilter, setSchoolFilter] = useState<Set<string>>(new Set())

  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn:  fetchSports,
    enabled:  isCoach && !activeProfile,
  })

  const schoolId: number | undefined = activeProfile
    ? activeProfile.school_id
    : sports.find((s: Sport) => s.coaches.some((c: SportCoach) => c.id === user?.id))?.school_id

  const canViewActivities = isDistrictAdmin || isSchoolLevel || canNotifyParents || canNotifyAD

  const { data: activities, isLoading, isError } = useQuery({
    queryKey: ['activities', schoolId],
    queryFn:  () => fetchActivities(schoolId),
    enabled:  canViewActivities && (isCoach ? schoolId !== undefined : true),
  })

  const allActivities = activities ?? []

  const sportNames  = [...new Set(allActivities.map(a => a.sport).filter(Boolean) as string[])].sort()
  const schoolNames = [...new Set(allActivities.map(a => a.school_name).filter(Boolean) as string[])].sort()

  const visible = allActivities.filter((a: Activity) => {
    if (isDistrictAdmin && tierFilter === 'severe' && a.tier !== 'severe') return false
    if (sportFilter.size  > 0 && (!a.sport      || !sportFilter.has(a.sport)))           return false
    if (schoolFilter.size > 0 && (!a.school_name || !schoolFilter.has(a.school_name)))   return false
    return true
  })

  const hasFilters = sportFilter.size > 0 || schoolFilter.size > 0

  return (
    <div className="px-10 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isDistrictAdmin
            ? 'Flagged incidents across schools in your district.'
            : 'Flagged messages and data access events for your teams.'}
        </p>
      </div>

      <div>
        {/* Filter row */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {isDistrictAdmin && (
            <div className="flex items-center gap-1 rounded-md border p-0.5">
              {(['severe', 'all'] as TierFilter[]).map(tier => (
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
                  {tier === 'severe' ? 'Severe only' : 'All'}
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

          {isDistrictAdmin && schoolNames.length > 1 && (
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
        {!isLoading && !isError && visible.length === 0 && (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            {isDistrictAdmin && tierFilter === 'severe' && !hasFilters
              ? 'No severe incidents to review.'
              : 'No alerts match the current filters.'}
          </div>
        )}
        {visible.length > 0 && (
          <div className="space-y-3">
            {visible.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                canNotifyParents={canNotifyParents && activity.event_type === 'message_flagged'}
                canNotifyAD={canNotifyAD && activity.event_type === 'message_flagged'}
                canNotifyDistrictAdmin={canNotifyDistrictAdmin && activity.event_type === 'message_flagged'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
