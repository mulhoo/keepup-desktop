import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Cpu, Server, ArrowRight, Send, RotateCcw,
  ShieldCheck, ShieldAlert, ShieldX, Smartphone, Sparkles,
  X, CheckCircle, Clock, Archive, Bell, Flag, ThumbsUp, Zap, AlertTriangle, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchDemoChannels, sendDemoMessage, moderateOnDevice, type DemoChannel, type DemoMessageResult } from '@/api/activities'


type Tier  = 'clear' | 'questionable' | 'severe'
type Phase = 'idle' | 'analyzing' | 'transmitting' | 'done' | 'error'

interface LocalResult {
  score:  number
  tier:   Tier
  source: 'gemma4' | 'keyword_fallback'
}

interface ServerEvent {
  id:           number
  message:      string
  score:        number
  tier:         Tier
  flagAction:   string | null
  sport:        string
  channel:      string
  notified:     Array<{ role: string; name: string }>
  receivedAt:   string
}


const FALLBACK_SEVERE = [
  /\b(kill|hurt|attack|threaten|violence|weapon|gun|knife|destroy|harm)\b/i,
  /\b(hate you|i hate|you suck|go die|drop dead)\b/i,
]
const FALLBACK_QUESTIONABLE = [
  /\b(stupid|dumb|idiot|loser|ugly|pathetic|worthless|shut up)\b/i,
  /\b(whatever|don.t care|who cares|boring|lame)\b/i,
]

function fallbackScore(text: string): LocalResult {
  if (FALLBACK_SEVERE.some(p => p.test(text)))
    return { score: 0.75 + Math.random() * 0.20, tier: 'severe',       source: 'keyword_fallback' }
  if (FALLBACK_QUESTIONABLE.some(p => p.test(text)))
    return { score: 0.40 + Math.random() * 0.30, tier: 'questionable', source: 'keyword_fallback' }
  return { score: 0.05 + Math.random() * 0.28,   tier: 'clear',        source: 'keyword_fallback' }
}

function tierFromResult(result: DemoMessageResult): Tier {
  const t = result.moderation.tier
  if (t === 'severe') return 'severe'
  if (t === 'questionable') return 'questionable'
  return 'clear'
}


const PRESETS = [
  { label: 'Normal',       text: 'Good practice today everyone, great effort out there!' },
  { label: 'Questionable', text: "That was stupid, you should have just shut up already"  },
  { label: 'Severe',       text: "I hate you, you're going to regret this"                },
  { label: 'Grooming',     text: "Meet me alone after practice, don't tell the other swimmers" },
]

const TIER_CONFIG: Record<Tier, {
  label:       string
  color:       string
  barColor:    string
  bgBorder:    string
  Icon:        React.ElementType
  ServerIcon:  React.ElementType
  serverLabel: string
  serverDesc:  string
}> = {
  clear: {
    label:       'Clear',
    color:       'text-green-600 dark:text-green-400',
    barColor:    'bg-green-500',
    bgBorder:    'border-green-500/30 bg-green-500/5',
    Icon:        ShieldCheck,
    ServerIcon:  CheckCircle,
    serverLabel: 'Delivered',
    serverDesc:  'Stored and delivered to the channel normally',
  },
  questionable: {
    label:       'Questionable',
    color:       'text-amber-600 dark:text-amber-400',
    barColor:    'bg-amber-500',
    bgBorder:    'border-amber-500/30 bg-amber-500/5',
    Icon:        ShieldAlert,
    ServerIcon:  Clock,
    serverLabel: 'Held for review',
    serverDesc:  'Stored but not delivered — coach has been notified',
  },
  severe: {
    label:       'Severe',
    color:       'text-red-600 dark:text-red-400',
    barColor:    'bg-red-500',
    bgBorder:    'border-red-500/30 bg-red-500/5',
    Icon:        ShieldX,
    ServerIcon:  Archive,
    serverLabel: 'Blocked — stored as evidence',
    serverDesc:  'Not delivered. Stored for admin review and pattern detection. Coach and AD notified.',
  },
}


function ScoreBar({ score, tier, visible }: { score: number; tier: Tier; visible: boolean }) {
  const { barColor } = TIER_CONFIG[tier]
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>On-device score</span>
        <span className="font-mono font-medium tabular-nums">{visible ? score.toFixed(3) : '—'}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: visible ? `${Math.round(score * 100)}%` : '0%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground/50">
        <span>0.0 clear</span>
        <span>0.40 questionable</span>
        <span>0.75 severe</span>
      </div>
    </div>
  )
}

function DataFlowArrow({ active, tier }: { active: boolean; tier: Tier | null }) {
  const arrowColor = tier === 'severe' ? 'text-red-500' : tier === 'questionable' ? 'text-amber-500' : 'text-green-500'
  return (
    <>
      {/* Desktop: horizontal arrow column */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-4 px-2 min-w-[130px]">
        <div className={cn('flex flex-col items-center gap-1.5 transition-opacity duration-500', active ? 'opacity-100' : 'opacity-20')}>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">To KeepUp server</p>
          <ArrowRight className={cn('w-6 h-6 transition-colors duration-300', active ? arrowColor : 'text-muted-foreground')} />
          <div className="text-center space-y-0.5">
            <p className="text-xs font-mono text-muted-foreground">message</p>
            <p className="text-xs font-mono text-muted-foreground">score</p>
            <p className="text-xs font-mono text-muted-foreground">tier</p>
          </div>
        </div>
        <div className="w-px h-4 bg-border/40" />
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Never sent to</p>
          <div className="relative">
            <div className="px-2 py-1 rounded border border-border/40 bg-muted/30 text-xs text-muted-foreground/60 text-center font-medium">
              External AI API
              <br />
              <span className="text-[9px]">(OpenAI, Google, etc.)</span>
            </div>
            <X className="w-5 h-5 text-red-500 absolute -top-2 -right-2 bg-background rounded-full" />
          </div>
          <p className="text-[9px] text-muted-foreground/50 text-center leading-tight">
            Content never leaves<br />the KeepUp system
          </p>
        </div>
      </div>
      {/* Mobile: compact horizontal strip between the two panels */}
      <div className={cn('lg:hidden flex items-center justify-center gap-3 py-2 transition-opacity duration-500', active ? 'opacity-100' : 'opacity-30')}>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">To KeepUp server</span>
        <ArrowRight className={cn('w-4 h-4 transition-colors duration-300 flex-none', active ? arrowColor : 'text-muted-foreground')} />
        <span className="text-[9px] text-muted-foreground font-mono">score · tier</span>
      </div>
    </>
  )
}

function ServerEventCard({ event }: { event: ServerEvent }) {
  const { color, ServerIcon, serverLabel, serverDesc } = TIER_CONFIG[event.tier]
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ServerIcon className={cn('w-3.5 h-3.5', color)} />
          <span className={cn('text-xs font-semibold', color)}>{serverLabel}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{event.receivedAt}</span>
      </div>

      <div className="text-xs bg-muted/40 rounded px-2.5 py-2 border italic text-muted-foreground">
        "{event.message}"
      </div>

      <div className="font-mono text-xs text-muted-foreground space-y-0.5">
        <p><span className="text-foreground/60">score:</span>   {event.score.toFixed(3)}</p>
        <p><span className="text-foreground/60">tier:</span>    {event.tier}</p>
        <p><span className="text-foreground/60">action:</span>  {event.flagAction ?? 'delivered'}</p>
        <p><span className="text-foreground/60">sport:</span>   {event.sport}</p>
        <p><span className="text-foreground/60">channel:</span> {event.channel}</p>
      </div>

      <p className="text-xs text-muted-foreground/60 leading-tight">{serverDesc}</p>

      {event.notified.length > 0 && (
        <div className="flex items-start gap-1.5 pt-0.5">
          <Bell className="w-3 h-3 text-primary flex-none mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Notified: {event.notified.map(n => `${n.name} (${n.role.replace('_', ' ')})`).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}


const CHAT_HISTORY = [
  { self: false, text: "See you at practice!" },
  { self: true,  text: "Can't wait, working on my flip turn 🏊" },
]

type RecipientAction = 'none' | 'dismissed' | 'reported'

function RecipientView({ tier, message, visible }: { tier: Tier; message: string; visible: boolean }) {
  const [action, setAction] = useState<RecipientAction>('none')

  useEffect(() => { setAction('none') }, [tier, message])

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-opacity duration-500', visible ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
        <Smartphone className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Recipient's Chat</span>
        <span className="text-xs text-muted-foreground">— what the other student sees</span>
      </div>

      <div className="p-4 space-y-2 min-h-[140px]">
        {/* Existing chat history for context */}
        {CHAT_HISTORY.map((m, i) => (
          <div key={i} className={cn('flex', m.self ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[72%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
              m.self ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
            )}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Clear — delivered normally with a private report option */}
        {tier === 'clear' && (
          <div className="space-y-1">
            <div className="flex justify-start items-end gap-1.5">
              <div className="max-w-[72%] px-3 py-2 rounded-2xl text-xs leading-relaxed bg-muted text-foreground">
                {message}
              </div>
            </div>
            {action === 'none' && (
              <button
                onClick={() => setAction('reported')}
                className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors pl-1"
              >
                <Flag className="w-2.5 h-2.5" />
                Report privately
              </button>
            )}
            {action === 'reported' && (
              <p className="text-xs text-primary pl-1 flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" />
                Reported privately — your coach has been notified
              </p>
            )}
          </div>
        )}

        {/* Questionable — message is visible but marked as under review */}
        {tier === 'questionable' && (
          <div className="space-y-2">
            <div className="flex justify-start items-start gap-1.5">
              <div className="max-w-[72%] px-3 py-2 rounded-2xl text-xs leading-relaxed bg-muted text-foreground relative">
                {message}
                {/* Review badge on the bubble */}
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
            </div>

            {action === 'none' && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 space-y-2">
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                  KeepUp flagged this message for review. Does it concern you?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAction('dismissed')}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-background border hover:bg-muted transition-colors text-foreground"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Looks fine to me
                  </button>
                  <button
                    onClick={() => setAction('reported')}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-red-700 dark:text-red-400"
                  >
                    <Flag className="w-3 h-3" />
                    This concerns me
                  </button>
                </div>
              </div>
            )}

            {action === 'dismissed' && (
              <p className="text-xs text-muted-foreground pl-1 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Thanks — your feedback helps the system learn what's normal for your team
              </p>
            )}

            {action === 'reported' && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <Flag className="w-3 h-3 flex-none" />
                  Reported privately — your coach and athletic director have been notified
                </p>
              </div>
            )}
          </div>
        )}

        {/* Severe — blocked entirely, safety notice only */}
        {tier === 'severe' && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2.5">
            <ShieldX className="w-4 h-4 text-red-500 flex-none mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Message blocked by KeepUp Safety</p>
              <p className="text-xs text-muted-foreground leading-snug">
                A message that violated KeepUp's safety policy was not delivered. Your coach and athletic director have been notified.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


let eventCounter = 0

export default function GemmaDemo() {
  const queryClient = useQueryClient()

  const [message,      setMessage]      = useState('')
  const [phase,        setPhase]        = useState<Phase>('idle')
  const [localResult,  setLocalResult]  = useState<LocalResult | null>(null)
  const [serverEvents, setServerEvents] = useState<ServerEvent[]>([])
  const [gemmaStatus,  setGemmaStatus]  = useState<'unknown' | 'gemma4' | 'fallback'>('unknown')
  const [channel,      setChannel]      = useState<DemoChannel | null>(null)
  const [,             setLastResult]   = useState<{tier: Tier; score: number; flagAction: string | null} | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resetTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch the general channel on mount so we have somewhere to post
  useEffect(() => {
    fetchDemoChannels()
      .then(channels => {
        const general = channels.find(c => c.name.toLowerCase() === 'general') ?? channels[0] ?? null
        setChannel(general)
      })
      .catch(() => {/* no channel available — demo runs locally only */})
  }, [])

  async function handleSend() {
    const text = message.trim()
    if (!text || phase !== 'idle') return

    setPhase('analyzing')
    setLocalResult(null)
    const [, onDevice] = await Promise.all([
      new Promise(r => setTimeout(r, 1600)),
      moderateOnDevice(text).then(r => ({ score: r.score, tier: r.tier, source: r.source } as LocalResult))
                            .catch(() => fallbackScore(text)),
    ])
    setLocalResult(onDevice)
    setGemmaStatus(onDevice.source === 'gemma4' ? 'gemma4' : 'fallback')

    setPhase('transmitting')
    await new Promise(r => setTimeout(r, 700))

    try {
      if (!channel) throw new Error('no channel')

      const result: DemoMessageResult = await sendDemoMessage(channel.id, text)
      const tier = tierFromResult(result)

      const event: ServerEvent = {
        id:         ++eventCounter,
        message:    text,
        score:      result.moderation.score,
        tier,
        flagAction: result.moderation.flag_action,
        sport:      channel.sport,
        channel:    channel.name,
        notified:   result.moderation.notifications_sent_to,
        receivedAt: new Date().toLocaleTimeString(),
      }
      setServerEvents(prev => [event, ...prev])
      setLastResult({ tier, score: result.moderation.score, flagAction: result.moderation.flag_action })

      // Invalidate activities so coach/AD overview picks up the new record
      queryClient.invalidateQueries({ queryKey: ['activities'] })

      if (tier === 'clear') {
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(() => {
          setMessage(''); setLocalResult(null); setLastResult(null); setPhase('idle')
        }, 3500)
      }

    } catch {
      // Backend unavailable — fall back to local result for visual
      const event: ServerEvent = {
        id:         ++eventCounter,
        message:    text,
        score:      onDevice.score,
        tier:       onDevice.tier,
        flagAction: onDevice.tier === 'severe' ? 'blocked' : onDevice.tier === 'questionable' ? 'held' : null,
        sport:      channel?.sport ?? 'Girls Swimming',
        channel:    channel?.name ?? 'general',
        notified:   [],
        receivedAt: new Date().toLocaleTimeString(),
      }
      setServerEvents(prev => [event, ...prev])
      setLastResult({ tier: onDevice.tier, score: onDevice.score, flagAction: onDevice.tier === 'severe' ? 'blocked' : onDevice.tier === 'questionable' ? 'held' : null })

      if (onDevice.tier === 'clear') {
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(() => {
          setMessage(''); setLocalResult(null); setLastResult(null); setPhase('idle')
        }, 3500)
      }
    }

    setPhase('done')
  }

  function handleReset() {
    if (resetTimer.current) { clearTimeout(resetTimer.current); resetTimer.current = null }
    setMessage('')
    setPhase('idle')
    setLocalResult(null)
    setLastResult(null)
    setGemmaStatus('unknown')
  }

  const isAnalyzing    = phase === 'analyzing'
  const isTransmitting = phase === 'transmitting'
  const isDone         = phase === 'done'
  const arrowActive    = isTransmitting || isDone
  const displayTier    = localResult?.tier ?? 'clear'

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 space-y-6 min-h-full">

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Gemma 4 — Live Demo</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gemma 4 E4B runs on the student's device as a constant monitor. Content is analyzed locally and only ever travels to the KeepUp server — it never leaves the KeepUp system into a third-party service.
          </p>
        </div>
        {(localResult || serverEvents.length > 0) && (
          <button
            onClick={() => { handleReset(); setServerEvents([]) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border hover:bg-muted transition-colors text-muted-foreground flex-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] gap-0 items-start">

        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Student's Device</span>
            <div className="ml-auto flex items-center gap-2">
              {gemmaStatus !== 'unknown' && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold',
                  gemmaStatus === 'gemma4'
                    ? 'bg-violet-500/10 border-violet-400/30 text-violet-600 dark:text-violet-400'
                    : 'bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-500'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', gemmaStatus === 'gemma4' ? 'bg-violet-500' : 'bg-amber-500')} />
                  {gemmaStatus === 'gemma4' ? 'Gemma live' : 'Fallback active'}
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-primary">Gemma 4 E4B — on device</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try a scenario</p>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setMessage(p.text); setPhase('idle'); setLocalResult(null); textareaRef.current?.focus() }}
                    disabled={isAnalyzing || isTransmitting}
                    className="text-xs px-2.5 py-1 rounded-md border hover:bg-muted hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Message {channel && <span className="font-normal normal-case">→ #{channel.name} · {channel.sport}</span>}
              </p>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => { setMessage(e.target.value); if (phase === 'done') setPhase('idle'); setLocalResult(null) }}
                disabled={isAnalyzing || isTransmitting}
                placeholder="Type any message to analyze…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isAnalyzing || isTransmitting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors',
                  message.trim() && phase === 'idle'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {isAnalyzing    && <><Loader2 className="w-4 h-4 animate-spin" />Gemma 4 analyzing on device…</>}
                {isTransmitting && <><Loader2 className="w-4 h-4 animate-spin" />Sending to KeepUp server…</>}
                {!isAnalyzing && !isTransmitting && <><Send className="w-4 h-4" />Send</>}
              </button>
            </div>

            <div className={cn('space-y-4 transition-opacity duration-300', !localResult && !isAnalyzing && 'opacity-0 pointer-events-none')}>
              <ScoreBar score={localResult?.score ?? 0} tier={displayTier} visible={!!localResult} />

              {localResult && (
                <div className={cn('rounded-lg border p-3 space-y-2', TIER_CONFIG[displayTier].bgBorder)}>
                  {(() => {
                    const { label, color, Icon, serverLabel, serverDesc } = TIER_CONFIG[displayTier]
                    const isGemma = localResult.source === 'gemma4'
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-4 h-4', color)} />
                          <span className={cn('text-sm font-semibold', color)}>{label}</span>
                        </div>
                        {/* Source badge — prominent so it reads clearly in a demo */}
                        <div className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold w-fit',
                          isGemma
                            ? 'bg-violet-500/10 border-violet-400/30 text-violet-600 dark:text-violet-400'
                            : 'bg-amber-500/10 border-amber-400/30 text-amber-700 dark:text-amber-400'
                        )}>
                          {isGemma
                            ? <><Zap className="w-3 h-3" />Gemma 4 — on device</>
                            : <><AlertTriangle className="w-3 h-3" />Keyword fallback — Gemma unavailable</>
                          }
                        </div>
                        <p className={cn('text-xs font-medium', color)}>→ {serverLabel}</p>
                        <p className="text-xs text-muted-foreground">{serverDesc}</p>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <DataFlowArrow active={arrowActive} tier={localResult?.tier ?? null} />

        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">KeepUp Server</span>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-500" title="Online" />
          </div>

          <div className="p-4 space-y-4">
            {/* Live inbound payload */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inbound payload</p>
              <div className={cn(
                'font-mono text-xs rounded-lg border p-3 space-y-0.5 transition-all duration-300',
                arrowActive && localResult ? 'bg-background border-border' : 'bg-muted/30 border-border/40 opacity-40'
              )}>
                {localResult ? (
                  <>
                    <p><span className="text-muted-foreground">message:</span>  <span className="italic">"{message.slice(0, 36)}{message.length > 36 ? '…' : ''}"</span></p>
                    <p><span className="text-muted-foreground">score:</span>    {localResult.score.toFixed(3)}</p>
                    <p><span className="text-muted-foreground">tier:</span>     {localResult.tier}</p>
                    <p><span className="text-muted-foreground">season_id:</span> {channel?.id ?? '—'}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground/50">Waiting for message…</p>
                )}
              </div>
            </div>

            {/* Message log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message log</p>
                {serverEvents.some(e => e.notified.length > 0) && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Bell className="w-3 h-3" />
                    Notifications sent — check coach/AD profile
                  </div>
                )}
              </div>
              {serverEvents.length === 0 ? (
                <div className="border border-dashed rounded-lg py-8 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Messages will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {serverEvents.map(e => <ServerEventCard key={e.id} event={e} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recipient's view */}
      <RecipientView tier={displayTier} message={message} visible={isDone} />

      {/* Architecture note */}
      <div className="border rounded-lg p-4 bg-muted/20 space-y-1">
        <p className="text-xs font-semibold">How the privacy protection works</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Student content moves within the KeepUp system only — from the device to the KeepUp server — and never exits that boundary.
          Traditional AI moderation sends every message to an external API (OpenAI, Google, etc.) for classification.
          KeepUp runs Gemma 4 E4B directly on the student's device as a constant monitor, so the AI analysis happens
          entirely inside the KeepUp system before the message is transmitted.
          The KeepUp server receives the message and the moderation result together, stores it according to the tier,
          and never forwards content to any outside service.
          For severe content, the message is retained as evidence so administrators can identify patterns — but it is never delivered to the channel.
          Switch to a coach or athletic director profile to see the notification appear in their overview.
        </p>
      </div>
    </div>
  )
}
