import { useAuth } from '@/hooks/useAuth'

export default function Overview() {
  const { user } = useAuth()

  return (
    <div className="px-10 py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.first_name}.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Announcements</h2>
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No announcements yet.
        </div>
      </div>
    </div>
  )
}
