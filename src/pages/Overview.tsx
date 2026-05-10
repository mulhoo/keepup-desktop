import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import ActivityCard from '@/components/activity/ActivityCard'
import { fetchActivities } from '@/api/activities'

export default function Overview() {
  const { user, demoRole } = useAuth()

  const canNotifyParents       = demoRole === 'head_coach' || demoRole === 'athletic_director' || demoRole === 'school_admin'
  const canNotifyAD            = demoRole === 'head_coach'
  const canNotifyDistrictAdmin = demoRole === 'athletic_director' || demoRole === 'school_admin'

  const { data: activities, isLoading, isError } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    enabled: canNotifyParents || canNotifyAD || canNotifyDistrictAdmin,
  })

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.first_name}.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Activity Feed</h2>

        {isLoading && (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Loading activity…
          </div>
        )}

        {isError && (
          <div className="rounded-lg border p-6 text-sm text-destructive">
            Failed to load activity feed.
          </div>
        )}

        {!isLoading && !isError && (!activities || activities.length === 0) && (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            No recent activity.
          </div>
        )}

        {activities && activities.length > 0 && (
          <div className="space-y-3">
            {activities.map((activity) => (
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
