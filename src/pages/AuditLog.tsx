import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Info, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchAuditLog, type AuditEntry } from '@/api/auditLog'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<string, string> = {
  head_coach:        'Head Coach',
  assistant_coach:   'Asst. Coach',
  athletic_director: 'Athletic Director',
  school_admin:      'School Admin',
  district_admin:    'District Admin',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn(
      'rounded-lg border bg-card overflow-hidden',
      entry.anomaly_flagged && 'border-red-300 dark:border-red-800',
    )}>
      <div
        className={cn(
          'px-4 py-3 flex items-start gap-3',
          entry.anomaly_flagged && 'bg-red-50/60 dark:bg-red-950/20',
        )}
      >
        {/* Status dot */}
        <div className="mt-1 flex-none">
          {entry.anomaly_flagged
            ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            : <div className="w-2 h-2 rounded-full bg-muted-foreground/30 mt-0.5" />
          }
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm">
            <span className="font-medium">{entry.accessor_name}</span>
            <span className="text-muted-foreground text-xs ml-1.5 border rounded px-1.5 py-0.5">
              {ROLE_LABEL[entry.accessor_role] ?? entry.accessor_role}
            </span>
            <span className="text-muted-foreground"> accessed </span>
            <span className="font-medium">{entry.accessed_user_name}</span>
            <span className="text-muted-foreground">'s {entry.resource_type}</span>
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span>{entry.reason}</span>
            {entry.sport_name && <><span>·</span><span>{entry.sport_name}</span></>}
            <span>·</span>
            <span>{entry.school_name}</span>
            <span>·</span>
            <span>{formatTime(entry.occurred_at)}</span>
          </p>
        </div>

        {/* Anomaly expand toggle */}
        {entry.anomaly_flagged && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-none text-red-500 hover:text-red-600 transition-colors p-0.5"
            aria-label={expanded ? 'Collapse anomaly detail' : 'Expand anomaly detail'}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Anomaly detail */}
      {entry.anomaly_flagged && expanded && (
        <div className="px-4 py-3 border-t border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-400 space-y-1">
          <p className="font-semibold">Anomaly detected — score {entry.anomaly_score?.toFixed(2)}</p>
          <p>{entry.anomaly_reason}</p>
        </div>
      )}
    </div>
  )
}

export default function AuditLog() {
  const { demoRole } = useAuth()
  const isDistrictAdmin = demoRole === 'district_admin'

  const accessedAt = useMemo(() => new Date(), [])
  const [schoolFilter, setSchoolFilter] = useState<string>('')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['audit-log', demoRole],
    queryFn: () => fetchAuditLog(demoRole ?? ''),
  })

  const schools = useMemo(
    () => [...new Set(entries.map(e => e.school_name))].sort(),
    [entries],
  )

  const filtered = schoolFilter
    ? entries.filter(e => e.school_name === schoolFilter)
    : entries

  const anomalyCount = filtered.filter(e => e.anomaly_flagged).length

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isDistrictAdmin
            ? 'All student data access across the district.'
            : 'Student data access logs for your school.'}
        </p>
      </div>

      {/* Self-log notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/25 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
        <Info className="w-4 h-4 flex-none mt-0.5" />
        <span>
          Your access to this log was recorded at {formatTime(accessedAt.toISOString())}.
        </span>
      </div>

      {/* Summary + filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{filtered.length} entries</span>
          {anomalyCount > 0 && (
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {anomalyCount} anomal{anomalyCount === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>

        {isDistrictAdmin && schools.length > 1 && (
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All schools</option>
            {schools.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground text-center">
          No access log entries.
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(entry => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
