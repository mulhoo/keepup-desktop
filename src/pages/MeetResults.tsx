import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Sparkles, ChevronDown, MapPin, Calendar, TrendingUp,
  Clock, CheckCircle2, ShieldCheck,
  Loader2, Trophy, Medal,
} from 'lucide-react'
import {
  fetchAllResults, fetchQualificationFlags, fetchTimeStandards,
  approveResult, acceptQualificationFlag, saveTimeStandards,
  SEASON_AI_INSIGHTS,
  type MeetResult, type QualificationFlag, type TimeStandard, type QualLevel,
} from '@/api/results'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'


function schoolShort(name: string) {
  return name.replace(' High School', '').replace(' Academy', '')
}

const LEVEL_LABEL: Record<QualLevel, string> = {
  state:              'State',
  districts:          'Districts',
  districts_wildcard: 'Districts Wild Card',
  kingco:             'KingCo',
}

const LEVEL_COLOR: Record<QualLevel, string> = {
  state:              'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  districts:          'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
  districts_wildcard: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
  kingco:             'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30',
}

const LEVEL_ORDER: QualLevel[] = ['state', 'districts', 'districts_wildcard', 'kingco']

const STATUS_BADGE: Record<MeetResult['status'], { label: string; className: string }> = {
  published:           { label: 'Published',              className: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20' },
  pending_commissioner:{ label: 'Awaiting your approval', className: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' },
  pending_opponent:    { label: 'Awaiting opponent',      className: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
}


function ResultCard({
  result,
  qualFlags,
  onApprove,
  approving,
  readOnly,
}: {
  result: MeetResult
  qualFlags: QualificationFlag[]
  onApprove?: () => void
  approving?: boolean
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(!readOnly && result.status === 'pending_commissioner')
  const homeWins = result.home_score > result.away_score
  const badge = STATUS_BADGE[result.status]
  const resultFlags = qualFlags.filter(f => f.result_id === result.id)

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      result.cross_division && 'border-amber-500/30',
      result.status === 'pending_commissioner' && 'border-blue-500/40 shadow-sm',
    )}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className={cn(
          'w-2 h-2 rounded-full flex-none',
          result.status !== 'published' ? 'bg-muted-foreground/30' :
          (homeWins ? result.home_school_id : result.away_school_id) === 1 ? 'bg-green-500' : 'bg-muted-foreground/30'
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-medium', homeWins ? 'text-foreground' : 'text-muted-foreground')}>
              {schoolShort(result.home_school)}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-sm">
              <span className={cn('font-bold', homeWins ? 'text-foreground' : 'text-muted-foreground')}>{result.home_score}</span>
              <span className="text-muted-foreground/50">–</span>
              <span className={cn('font-bold', !homeWins ? 'text-foreground' : 'text-muted-foreground')}>{result.away_score}</span>
            </div>
            <span className={cn('text-sm font-medium', !homeWins ? 'text-foreground' : 'text-muted-foreground')}>
              {schoolShort(result.away_school)}
            </span>
            {result.cross_division && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Cross-div</span>
            )}
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded border', badge.className)}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(result.date), 'MMM d, yyyy')}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{result.venue}</span>
            {resultFlags.length > 0 && result.status === 'published' && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <Trophy className="w-3 h-3" />
                {resultFlags.filter(f => f.status === 'pending').length} qual flag{resultFlags.filter(f => f.status === 'pending').length !== 1 ? 's' : ''} pending
              </span>
            )}
          </div>
        </div>

        <ChevronDown className={cn('w-4 h-4 text-muted-foreground flex-none transition-transform duration-150', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Approve action — commissioner only */}
          {!readOnly && result.status === 'pending_commissioner' && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div>
                <p className="text-sm font-medium">Both teams have confirmed this result.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Approving will publish the result and generate qualification flag checks.
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onApprove?.() }}
                disabled={approving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex-none ml-4 disabled:opacity-60"
              >
                {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Approve
              </button>
            </div>
          )}

          {!readOnly && result.status === 'pending_opponent' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-none mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Waiting for <strong>{schoolShort(result.away_school)}</strong> to confirm the score.
                Once confirmed, you'll be able to approve and publish.
              </p>
            </div>
          )}

          {/* AI Summary */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />AI Analysis
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.ai_summary}</p>
          </div>

          {result.ai_standouts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />Standouts
              </div>
              <ul className="space-y-1">
                {result.ai_standouts.map((s, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-none">·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}


          {result.events.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Event breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                {result.events.map(ev => (
                  <div key={ev.event} className="border rounded-md p-2.5 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{ev.event}</p>
                    {ev.results.map(r => (
                      <div key={r.athlete} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-muted-foreground/50 w-3 flex-none">{r.place}.</span>
                          <span className="truncate">{r.athlete}</span>
                          <span className="text-xs text-muted-foreground/50 flex-none">{r.school}</span>
                          {r.personal_best && <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 flex-none">PR</span>}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground flex-none">{r.time}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Uploaded by {result.uploaded_by} · {format(new Date(result.uploaded_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      )}
    </div>
  )
}


function QualificationsTab({ readOnly }: { readOnly?: boolean }) {
  const { data: rawFlags = [], isLoading } = useQuery({
    queryKey: ['qual-flags'],
    queryFn: fetchQualificationFlags,
  })
  const [accepted, setAccepted] = useState<Set<number>>(
    () => new Set(rawFlags.filter(f => f.status === 'accepted').map(f => f.id))
  )
  const [accepting, setAccepting] = useState<number | null>(null)

  const flags = rawFlags.map(f => ({
    ...f,
    status: accepted.has(f.id) ? 'accepted' as const : f.status,
  }))

  const pending  = flags.filter(f => f.status === 'pending')
  const done     = flags.filter(f => f.status === 'accepted')

  async function handleAccept(id: number) {
    setAccepting(id)
    await acceptQualificationFlag(id)
    setAccepted(prev => new Set([...prev, id]))
    setAccepting(null)
  }

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{pending.length} pending review</span>
        <span>·</span>
        <span>{done.length} accepted</span>
      </div>

      {LEVEL_ORDER.map(level => {
        const levelFlags = pending.filter(f => f.level === level)
        if (levelFlags.length === 0) return null
        return (
          <div key={level} className="space-y-2">
            <div className="flex items-center gap-2">
              {level === 'state' && <Trophy className="w-4 h-4 text-yellow-500" />}
              {level === 'districts' && <Medal className="w-4 h-4 text-blue-500" />}
              {(level === 'districts_wildcard' || level === 'kingco') && <Medal className="w-4 h-4 text-muted-foreground" />}
              <h3 className="text-sm font-semibold">{LEVEL_LABEL[level]}</h3>
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded border',
                LEVEL_COLOR[level]
              )}>{levelFlags.length}</span>
            </div>
            <div className="space-y-1.5">
              {levelFlags.map(flag => (
                <div key={flag.id} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg border',
                  level === 'state' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  level === 'districts' ? 'bg-blue-500/5 border-blue-500/20' :
                  'bg-muted/30 border-border'
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{flag.athlete}</span>
                      <span className="text-xs text-muted-foreground">{flag.school}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{flag.event}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-mono">
                      <span className="font-semibold text-foreground">{flag.time}</span>
                      <span>vs std {flag.standard_time}</span>
                    </div>
                  </div>
                  {readOnly ? (
                    <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded border flex-none', LEVEL_COLOR[flag.level])}>
                      {LEVEL_LABEL[flag.level]}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAccept(flag.id)}
                      disabled={accepting === flag.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-none disabled:opacity-60"
                    >
                      {accepting === flag.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <CheckCircle2 className="w-3 h-3" />
                      }
                      Accept
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {done.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accepted ({done.length})</h3>
          <div className="space-y-1">
            {done.map(flag => (
              <div key={flag.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-none" />
                <span className="text-xs flex-1">{flag.athlete} · {flag.event} · <span className="font-mono">{flag.time}</span></span>
                <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded border', LEVEL_COLOR[flag.level])}>
                  {LEVEL_LABEL[flag.level]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


function StandardsTab() {
  const { data: rawStandards = [], isLoading } = useQuery({
    queryKey: ['time-standards', 'Girls Swimming'],
    queryFn: () => fetchTimeStandards('Girls Swimming'),
  })
  const [standards, setStandards] = useState<TimeStandard[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const display = standards.length ? standards : rawStandards

  function update(event: string, field: keyof Omit<TimeStandard, 'event'>, value: string) {
    const base = standards.length ? standards : rawStandards
    setStandards(base.map(s => s.event === event ? { ...s, [field]: value } : s))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await saveTimeStandards('Girls Swimming', display)
    setSaving(false)
    setSaved(true)
  }

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />)}</div>
  }

  const COLS: { field: keyof Omit<TimeStandard, 'event'>; label: string; color: string }[] = [
    { field: 'kingco',            label: 'KingCo',         color: 'text-green-600 dark:text-green-400' },
    { field: 'districts_wildcard',label: 'Districts WC',   color: 'text-sky-600 dark:text-sky-400'    },
    { field: 'districts',         label: 'Districts',      color: 'text-blue-600 dark:text-blue-400'  },
    { field: 'state',             label: 'State',          color: 'text-yellow-600 dark:text-yellow-400' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Girls Swimming qualifying cuts — athletes must swim <strong>faster</strong> than the listed time.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Note: in a future update, standards will be set directly on each major meet (KingCo, Districts, State) when scheduling.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors flex-none',
            saved ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
           saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> :
           'Save standards'}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-40">Event</th>
              {COLS.map(c => (
                <th key={c.field} className={cn('text-center px-2 py-2.5 font-medium', c.color)}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {display.map(std => (
              <tr key={std.event} className="hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 text-xs text-muted-foreground">{std.event}</td>
                {COLS.map(c => (
                  <td key={c.field} className="px-2 py-1.5 text-center">
                    <input
                      type="text"
                      value={std[c.field] ?? ''}
                      onChange={e => update(std.event, c.field, e.target.value)}
                      placeholder="—"
                      className="w-20 h-7 text-center font-mono text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


type Tab = 'results' | 'qualifications' | 'standards'

export default function MeetResults() {
  const { effectiveRole } = useAuth()
  const isAthleticDirector = effectiveRole === 'athletic_director'

  const [tab,            setTab]            = useState<Tab>('results')
  const [sportFilter,    setSportFilter]    = useState<string | null>(null)

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['meet-results'],
    queryFn: fetchAllResults,
  })
  const { data: allFlags = [] } = useQuery({
    queryKey: ['qual-flags'],
    queryFn: fetchQualificationFlags,
  })

  const [approvedIds, setApprovedIds] = useState<Set<number>>(new Set())
  const [approvingId, setApprovingId] = useState<number | null>(null)

  const allDisplayResults = results.map(r =>
    approvedIds.has(r.id) ? { ...r, status: 'published' as const } : r
  )

  // Sport names present in results data — used for AD filter chips
  const availableSports = [...new Set(allDisplayResults.map(r => r.sport_name))].sort()

  const displayResults = sportFilter
    ? allDisplayResults.filter(r => r.sport_name === sportFilter)
    : allDisplayResults

  async function handleApprove(id: number) {
    setApprovingId(id)
    await approveResult(id)
    setApprovedIds(prev => new Set([...prev, id]))
    setApprovingId(null)
  }

  const pendingApproval  = allDisplayResults.filter(r => r.status === 'pending_commissioner').length
  const pendingQualFlags = allFlags.filter(f => f.status === 'pending').length

  const TABS: { id: Tab; label: string; badge?: number }[] = isAthleticDirector
    ? [
        { id: 'results',        label: 'Results'        },
        { id: 'qualifications', label: 'Qualifications' },
      ]
    : [
        { id: 'results',        label: 'Results',        badge: pendingApproval  },
        { id: 'qualifications', label: 'Qualifications', badge: pendingQualFlags },
        { id: 'standards',      label: 'Standards'                               },
      ]

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meet Results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAthleticDirector
            ? `${allDisplayResults.filter(r => r.status === 'published').length} published results across all sports`
            : `${allDisplayResults.filter(r => r.status === 'published').length} published · ${pendingApproval} pending approval`
          }
        </p>
      </div>

      {/* Sport filter chips — AD only */}
      {isAthleticDirector && availableSports.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSportFilter(null)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              sportFilter === null
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
            )}
          >
            All sports
          </button>
          {availableSports.map(sport => (
            <button
              key={sport}
              onClick={() => setSportFilter(s => s === sport ? null : sport)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors',
                sportFilter === sport
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
              )}
            >
              {sport}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground min-w-[18px] text-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results tab */}
      {tab === 'results' && (
        <div className="space-y-6">
          {!isAthleticDirector && (
            <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Season Insights</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{SEASON_AI_INSIGHTS}</p>
            </div>
          )}

          {resultsLoading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />)}
            </div>
          ) : displayResults.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              No results for {sportFilter ?? 'any sport'} yet.
            </div>
          ) : (
            <div className="space-y-2">
              {displayResults.map(result => (
                <ResultCard
                  key={result.id}
                  result={result}
                  qualFlags={allFlags}
                  onApprove={isAthleticDirector ? undefined : () => handleApprove(result.id)}
                  approving={approvingId === result.id}
                  readOnly={isAthleticDirector}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'qualifications' && <QualificationsTab readOnly={isAthleticDirector} />}
      {tab === 'standards'      && <StandardsTab />}
    </div>
  )
}
