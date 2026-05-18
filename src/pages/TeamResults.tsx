import { useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Plus, Sparkles, ChevronDown, MapPin, Calendar,
  TrendingUp, AlertCircle, Loader2, X, Check, FileText,
  Upload, TriangleAlert, Clock, ShieldCheck, MessageSquareWarning,
} from 'lucide-react'
import { fetchSports, sportDisplayName, type Sport } from '@/api/sports'
import {
  fetchTeamResults, generateResultAiSummary, submitMeetResult,
  parseMeetManagerPdf, confirmResult,
  type MeetResult, type HighlightRow, type ParsedMeet,
} from '@/api/results'
import { cn } from '@/lib/utils'


function schoolShort(name: string) {
  return name.replace(' High School', '').replace(' Academy', '')
}

const STATUS_BADGE = {
  published:            { label: 'Published',             cls: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20'  },
  pending_commissioner: { label: 'Awaiting commissioner', cls: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'      },
  pending_opponent:     { label: 'Awaiting confirmation', cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'  },
} satisfies Record<MeetResult['status'], { label: string; cls: string }>

function ResultCard({
  result,
  mySchoolId,
  onConfirm,
  confirming,
}: {
  result: MeetResult
  mySchoolId: number
  onConfirm?: () => void
  confirming?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [disputed, setDisputed] = useState(false)
  const homeWins  = result.home_score > result.away_score
  const myTeamWon = (result.home_school_id === mySchoolId && homeWins) ||
                    (result.away_school_id === mySchoolId && !homeWins)
  const needsMyConfirmation =
    result.status === 'pending_opponent' && result.away_school_id === mySchoolId
  const badge = STATUS_BADGE[result.status]

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      result.cross_division && 'border-amber-500/30',
      needsMyConfirmation && 'border-amber-500/50 shadow-sm',
    )}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className={cn(
          'w-2 h-2 rounded-full flex-none',
          result.status !== 'published' ? 'bg-muted-foreground/30' :
          myTeamWon ? 'bg-green-500' : 'bg-red-400'
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-medium', homeWins ? 'text-foreground' : 'text-muted-foreground')}>
              {schoolShort(result.home_school)}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-sm">
              <span className={cn('font-bold', homeWins ? 'text-foreground' : 'text-muted-foreground')}>
                {result.home_score}
              </span>
              <span className="text-muted-foreground/50">–</span>
              <span className={cn('font-bold', !homeWins ? 'text-foreground' : 'text-muted-foreground')}>
                {result.away_score}
              </span>
            </div>
            <span className={cn('text-sm font-medium', !homeWins ? 'text-foreground' : 'text-muted-foreground')}>
              {schoolShort(result.away_school)}
            </span>
            {result.cross_division && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Cross-div</span>
            )}
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded border', badge.cls)}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(result.date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {result.venue}
            </span>
          </div>
        </div>

        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground flex-none transition-transform duration-150',
          expanded && 'rotate-180'
        )} />
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">

          {/* Confirmation banner — shown when this coach's team is the away team and hasn't confirmed */}
          {needsMyConfirmation && !disputed && (
            <div className="space-y-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-none mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Confirm this result</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uploaded by <strong>{result.uploaded_by}</strong> ({schoolShort(result.home_school)}).
                    Verify the final score matches your records.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); onConfirm?.() }}
                  disabled={confirming}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {confirming
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ShieldCheck className="w-3.5 h-3.5" />
                  }
                  Confirm Score
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDisputed(true) }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  Dispute
                </button>
              </div>
            </div>
          )}

          {disputed && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <MessageSquareWarning className="w-4 h-4 text-muted-foreground flex-none mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Dispute submitted. The commissioner has been notified and will review the score.
              </p>
            </div>
          )}

          {result.status === 'pending_commissioner' && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-500/5 border border-blue-500/20">
              <Clock className="w-3.5 h-3.5 text-blue-500 flex-none mt-0.5" />
              <p className="text-xs text-muted-foreground">Both teams confirmed. Waiting for commissioner approval to publish.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI Analysis
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.ai_summary}</p>
          </div>

          {result.ai_standouts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                Standouts
              </div>
              <ul className="space-y-1">
                {result.ai_standouts.map((s, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-none">·</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.ai_focus && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border/50">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground flex-none mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{result.ai_focus}</p>
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
                          {r.personal_best && (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 flex-none">PR</span>
                          )}
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


const EMPTY_HIGHLIGHT: HighlightRow = { athlete: '', event: '', time: '', pr: false }
type UploadMode  = 'manual' | 'pdf'
type ParseStatus = 'idle' | 'parsing' | 'done' | 'error'

function UploadDialog({
  sport,
  onClose,
  onSaved,
}: {
  sport: Sport
  onClose: () => void
  onSaved: (result: MeetResult) => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const [date, setDate]           = useState(today)
  const [opponent, setOpponent]   = useState('')
  const [venue, setVenue]         = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [highlights, setHighlights] = useState<HighlightRow[]>([
    { ...EMPTY_HIGHLIGHT }, { ...EMPTY_HIGHLIGHT }, { ...EMPTY_HIGHLIGHT },
  ])
  const [aiSummary, setAiSummary] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]         = useState(false)

  const [mode, setMode]           = useState<UploadMode>('pdf')
  const [parseStatus, setParseStatus] = useState<ParseStatus>('idle')
  const [parsedMeet, setParsedMeet]   = useState<ParsedMeet | null>(null)
  const [isDragging, setIsDragging]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updateHighlight(i: number, patch: Partial<HighlightRow>) {
    setHighlights(prev => prev.map((h, idx) => idx === i ? { ...h, ...patch } : h))
  }

  function switchMode(next: UploadMode) {
    setMode(next)
    setParseStatus('idle')
    setParsedMeet(null)
    setDate(today); setOpponent(''); setVenue('')
    setHomeScore(''); setAwayScore('')
    setHighlights([{ ...EMPTY_HIGHLIGHT }, { ...EMPTY_HIGHLIGHT }, { ...EMPTY_HIGHLIGHT }])
    setAiSummary('')
  }

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) return
    setParseStatus('parsing')
    setParsedMeet(null)
    setAiSummary('')
    try {
      const parsed = await parseMeetManagerPdf(file)
      setParsedMeet(parsed)
      setParseStatus('done')
      setDate(parsed.date)
      setOpponent(parsed.away_school)
      setVenue(parsed.venue)
      setHomeScore(String(parsed.home_score))
      setAwayScore(String(parsed.away_score))
      // Individual times aren't on the score sheet — coach fills highlights manually
    } catch {
      setParseStatus('error')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const canGenerate =
    opponent.trim() !== '' && venue.trim() !== '' &&
    homeScore !== '' && !isNaN(Number(homeScore)) &&
    awayScore !== '' && !isNaN(Number(awayScore))

  async function handleGenerate() {
    if (!canGenerate) return
    setGenerating(true); setAiSummary('')
    try {
      const summary = await generateResultAiSummary(
        sport.school_name, opponent, Number(homeScore), Number(awayScore), highlights,
      )
      setAiSummary(summary)
    } finally { setGenerating(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const result = await submitMeetResult({
        date, sport_id: sport.id,
        home_school: sport.school_name, home_school_id: sport.school_id,
        home_score: Number(homeScore),
        away_school: opponent, away_school_id: 0,
        away_score: Number(awayScore),
        venue, highlights, ai_summary: aiSummary,
      })
      onSaved(result)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background border rounded-xl shadow-xl flex flex-col max-h-[90vh]">

        <div className="flex items-start justify-between px-5 py-4 border-b flex-none">
          <div>
            <h2 className="text-base font-semibold">Upload Meet Results</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{sportDisplayName(sport)} · {sport.school_name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b flex-none">
          {(['pdf', 'manual'] as UploadMode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2',
                mode === m
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'pdf' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Upload PDF
                  <span className="text-[9px] px-1 py-px rounded bg-primary/10 text-primary font-bold">AI</span>
                </span>
              ) : 'Manual entry'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {mode === 'pdf' && (
            <>
              {/* Drop zone / parse status */}
              {parseStatus === 'idle' && (
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-lg py-10 px-4 flex flex-col items-center gap-3 cursor-pointer transition-colors',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  )}
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">Drop your Meet Manager PDF here</p>
                    <p className="text-xs text-muted-foreground">or click to browse · accepts .pdf</p>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Reads team names and final score from the Meet Manager score sheet
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  />
                </div>
              )}

              {parseStatus === 'parsing' && (
                <div className="border rounded-lg py-10 px-4 flex flex-col items-center gap-4">
                  <div className="relative">
                    <FileText className="w-10 h-10 text-muted-foreground/40" />
                    <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">Reading score sheet…</p>
                    <p className="text-xs text-muted-foreground">
                      Extracting team names and final score
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {parseStatus === 'error' && (
                <div className="border border-destructive/30 rounded-lg py-8 px-4 flex flex-col items-center gap-3 bg-destructive/5">
                  <TriangleAlert className="w-8 h-8 text-destructive/60" />
                  <p className="text-sm font-medium">Couldn't parse this PDF</p>
                  <p className="text-xs text-muted-foreground text-center">
                    Make sure it's a Meet Manager results export. You can also switch to manual entry.
                  </p>
                  <button
                    onClick={() => setParseStatus('idle')}
                    className="text-xs text-primary hover:underline"
                  >
                    Try another file
                  </button>
                </div>
              )}

              {parseStatus === 'done' && parsedMeet && (
                <div className="space-y-3">
                  {/* Parsed banner */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/10 border border-green-500/20 text-xs">
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-none" />
                    <span className="font-medium text-green-700 dark:text-green-300">Parsed:</span>
                    <span className="text-muted-foreground truncate">{parsedMeet.meet_name}</span>
                    <button
                      onClick={() => setParseStatus('idle')}
                      className="ml-auto text-muted-foreground hover:text-foreground flex-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Score sheet read — teams and final score auto-filled below.
                    Add any individual highlights from your own notes before generating the summary.
                  </p>
                </div>
              )}
            </>
          )}

          {(mode === 'manual' || parseStatus === 'done') && (
            <>
              {mode === 'manual' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Venue / Pool</label>
                    <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
                      placeholder="AHS Aquatic Center"
                      className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Opponent</label>
                    <input type="text" value={opponent} onChange={e => setOpponent(e.target.value)}
                      placeholder="Baldwin High School"
                      className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              )}

              {/* Score — editable in both modes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {mode === 'pdf' ? 'Score (auto-filled — edit if needed)' : 'Score'}
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground truncate">{schoolShort(sport.school_name)} (home)</p>
                    <input type="number" value={homeScore} onChange={e => setHomeScore(e.target.value)}
                      placeholder="0"
                      className="w-full h-10 px-3 text-center text-lg font-mono font-bold border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <span className="text-muted-foreground/50 text-lg mt-5">–</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground truncate">{opponent || 'Opponent'} (away)</p>
                    <input type="number" value={awayScore} onChange={e => setAwayScore(e.target.value)}
                      placeholder="0"
                      className="w-full h-10 px-3 text-center text-lg font-mono font-bold border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {mode === 'pdf'
                    ? 'Individual highlights (auto-filled — mark PRs)'
                    : 'Individual highlights (optional)'}
                </label>
                <div className="space-y-2">
                  {highlights.map((h, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_80px_auto] gap-2 items-center">
                      <input type="text" value={h.athlete} onChange={e => updateHighlight(i, { athlete: e.target.value })}
                        placeholder="Athlete name"
                        className="h-8 px-2.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="text" value={h.event} onChange={e => updateHighlight(i, { event: e.target.value })}
                        placeholder="Event"
                        className="h-8 px-2.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="text" value={h.time} onChange={e => updateHighlight(i, { time: e.target.value })}
                        placeholder="Time"
                        className="h-8 px-2.5 text-xs border rounded-md bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button
                        onClick={() => updateHighlight(i, { pr: !h.pr })}
                        title="Mark as personal record"
                        className={cn(
                          'h-8 w-8 rounded-md border text-xs font-bold flex items-center justify-center transition-colors',
                          h.pr
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'text-muted-foreground hover:border-primary hover:text-primary'
                        )}
                      >
                        PR
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate AI Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Summary
                  </label>
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate || generating}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors',
                      canGenerate && !generating
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {generating
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                      : <><Sparkles className="w-3 h-3" /> Generate</>}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="relative">
                    <textarea
                      value={aiSummary}
                      onChange={e => setAiSummary(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm border rounded-md bg-primary/5 border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                    />
                    <Check className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-primary" />
                  </div>
                ) : (
                  <div className={cn(
                    'h-24 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground',
                    !canGenerate && 'opacity-50'
                  )}>
                    {canGenerate
                      ? 'Click Generate to create an AI narrative summary'
                      : 'Fill in opponent, venue, and scores first'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t flex-none">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!aiSummary || saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm rounded-md font-medium transition-colors',
              aiSummary && !saving
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Results
          </button>
        </div>
      </div>
    </div>
  )
}


export default function TeamResults() {
  const { sportId } = useParams<{ sportId: string }>()
  const sportIdNum  = Number(sportId)
  const queryClient = useQueryClient()

  const [dialogOpen,    setDialogOpen]    = useState(false)
  const [localResults,  setLocalResults]  = useState<MeetResult[]>([])
  const [confirmedIds,  setConfirmedIds]  = useState<Set<number>>(new Set())
  const [confirmingId,  setConfirmingId]  = useState<number | null>(null)

  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn: fetchSports,
  })
  const sport = sports.find(s => s.id === sportIdNum)

  const { data: fetched = [], isLoading } = useQuery({
    queryKey: ['meet-results', sport?.school_id],
    queryFn:  () => fetchTeamResults(sport!.school_id),
    enabled:  !!sport,
  })

  const allResults = [...localResults, ...fetched]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const displayResults = allResults.map(r =>
    confirmedIds.has(r.id) ? { ...r, status: 'pending_commissioner' as const } : r
  )

  const publishedResults = displayResults.filter(r => r.status === 'published')
  const wins   = publishedResults.filter(r =>
    (r.home_school_id === sport?.school_id && r.home_score > r.away_score) ||
    (r.away_school_id === sport?.school_id && r.away_score > r.home_score)
  ).length
  const losses = publishedResults.length - wins

  function handleSaved(result: MeetResult) {
    setLocalResults(prev => [result, ...prev])
    queryClient.invalidateQueries({ queryKey: ['meet-results'] })
    setDialogOpen(false)
  }

  async function handleConfirm(id: number) {
    setConfirmingId(id)
    await confirmResult(id)
    setConfirmedIds(prev => new Set([...prev, id]))
    setConfirmingId(null)
  }

  return (
    <div className="px-10 py-8 max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{sport?.name ?? 'Team'} Results</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sport?.school_name}
            {publishedResults.length > 0 && (
              <span className="ml-2">
                · <span className="text-green-600 dark:text-green-400 font-medium">{wins}W</span>
                {' '}<span className="text-muted-foreground/60">/</span>{' '}
                <span className="text-red-500 font-medium">{losses}L</span>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex-none"
        >
          <Plus className="w-4 h-4" />
          Upload Results
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : allResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <p className="text-sm font-medium">No results yet</p>
          <p className="text-xs text-muted-foreground">
            Upload meet results after each home or away event.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayResults.map(result => (
            <ResultCard
              key={result.id}
              result={result}
              mySchoolId={sport?.school_id ?? 0}
              onConfirm={() => handleConfirm(result.id)}
              confirming={confirmingId === result.id}
            />
          ))}
        </div>
      )}

      {dialogOpen && sport && (
        <UploadDialog
          sport={sport}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
