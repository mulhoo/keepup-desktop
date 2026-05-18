import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Info, Loader2, ChevronDown, ChevronRight, Shield, ClipboardList } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchAuditLog, type AuditEntry } from '@/api/auditLog'
import { fetchSafetyAuditEvents, type SafetyAuditDbEvent } from '@/api/safety'
import { useSafety, type SafetyAuditEvent } from '@/contexts/SafetyContext'
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

function SafetyEventRow({ event }: { event: SafetyAuditDbEvent }) {
  const label = event.event_type === 'safety_accessed' ? 'Safety Access Started'
    : event.event_type === 'safety_exited'
      ? `Safety Access Ended${event.reason === 'inactivity' ? ' (inactivity)' : ''}${event.duration_seconds != null ? ` · ${event.duration_seconds}s` : ''}`
    : 'Chat Search'

  return (
    <div className="rounded-lg border bg-card overflow-hidden border-amber-200 dark:border-amber-800/40">
      <div className="px-4 py-3 flex items-start gap-3 bg-amber-50/50 dark:bg-amber-950/10">
        <Shield className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-none" />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-medium">{label}</p>
          {event.notes && (
            <p className="text-xs text-muted-foreground">{event.notes}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatTime(event.occurred_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

const DECISION_LABEL: Record<string, string> = {
  alert_viewed:               'Alert viewed',
  parents_notified:           'Parents notified',
  ad_notified:                'Athletic director notified',
  district_notified:          'District admin notified',
  view_request_approved:      'Chat access approved',
  view_request_denied:        'Chat access denied',
  data_destruction_requested: 'Data destruction requested',
  message_deleted_everywhere: 'Message deleted from all channels',
  chat_search:                'Chat search performed',
}

const DECISION_COLORS: Record<string, string> = {
  alert_viewed:               'text-blue-600 dark:text-blue-400',
  parents_notified:           'text-emerald-600 dark:text-emerald-400',
  ad_notified:                'text-emerald-600 dark:text-emerald-400',
  district_notified:          'text-emerald-600 dark:text-emerald-400',
  view_request_approved:      'text-emerald-600 dark:text-emerald-400',
  view_request_denied:        'text-red-500',
  data_destruction_requested: 'text-red-500',
  message_deleted_everywhere: 'text-red-500',
  chat_search:                'text-amber-600 dark:text-amber-400',
}

const ADMIN_ACTION_TYPES = new Set([
  'alert_viewed', 'parents_notified', 'ad_notified', 'district_notified',
  'view_request_approved', 'view_request_denied', 'data_destruction_requested',
  'message_deleted_everywhere', 'chat_search',
])

function DecisionRow({ event }: { event: SafetyAuditEvent }) {
  const label = DECISION_LABEL[event.type] ?? event.type
  const color = DECISION_COLORS[event.type] ?? 'text-muted-foreground'
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <ClipboardList className={cn('w-3.5 h-3.5 mt-0.5 flex-none', color)} />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={cn('text-sm font-medium', color)}>{label}</p>
          {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
          <p className="text-xs text-muted-foreground">{formatTime(event.occurred_at)}</p>
        </div>
      </div>
    </div>
  )
}

export default function AuditLog() {
  const { effectiveRole } = useAuth()
  const { isSafetyAuthenticated, safetyEvents } = useSafety()
  const isDistrictAdmin = effectiveRole === 'district_admin'

  const accessedAt = useMemo(() => new Date(), [])
  const [schoolFilter, setSchoolFilter] = useState<string>('')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: fetchAuditLog,
  })

  const { data: safetyDbEvents = [] } = useQuery({
    queryKey: ['safety-audit-events'],
    queryFn: fetchSafetyAuditEvents,
    enabled: isSafetyAuthenticated,
    refetchInterval: 30_000,
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
    <div className="px-10 py-8 max-w-4xl space-y-6">
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

      {/* Decision log (in-session) */}
      {safetyEvents.filter(e => ADMIN_ACTION_TYPES.has(e.type)).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Decision Log — This Session</h2>
          <div className="space-y-2">
            {safetyEvents
              .filter(e => ADMIN_ACTION_TYPES.has(e.type))
              .map(event => <DecisionRow key={event.id} event={event} />)}
          </div>
        </div>
      )}

      {/* Safety access history (persisted) */}
      {safetyDbEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Safety Access History</h2>
          <div className="space-y-2">
            {safetyDbEvents.map(event => (
              <SafetyEventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
