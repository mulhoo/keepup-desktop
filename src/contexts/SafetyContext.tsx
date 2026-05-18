import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { endSafetySession } from '@/api/safety'
import { clearSafetyToken } from '@/api/client'

const INACTIVITY_MS = 5 * 60 * 1000 // 5 minutes

export type AdminActionType =
  | 'alert_viewed'
  | 'parents_notified'
  | 'ad_notified'
  | 'district_notified'
  | 'view_request_approved'
  | 'view_request_denied'
  | 'data_destruction_requested'
  | 'message_deleted_everywhere'

export interface SafetyAuditEvent {
  id:          string
  type:        'session_start' | 'session_end' | 'chat_search' | AdminActionType
  occurred_at: string
  notes?:      string
  reason?:     'manual' | 'inactivity'
}

interface SafetyContextType {
  isSafetyAuthenticated: boolean
  sessionStartedAt:      Date | null
  safetyEvents:          SafetyAuditEvent[]
  enterSafetySession:    () => void
  exitSafetySession:     (reason: 'manual' | 'inactivity') => void
  logChatSearch:         (notes: string) => void
  logAdminAction:        (type: AdminActionType, notes: string) => void
  resetInactivity:       () => void
}

const SafetyContext = createContext<SafetyContextType | null>(null)

export function SafetyProvider({ children }: { children: ReactNode }) {
  const [isSafetyAuthenticated, setIsSafetyAuthenticated] = useState(false)
  const [sessionStartedAt, setSessionStartedAt]           = useState<Date | null>(null)
  const [safetyEvents, setSafetyEvents]                   = useState<SafetyAuditEvent[]>([])
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)


  const addEvent = useCallback((event: Omit<SafetyAuditEvent, 'id'>) => {
    setSafetyEvents(prev => [
      { ...event, id: crypto.randomUUID() },
      ...prev,
    ])
  }, [])

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
  }, [])

  const exitSafetySession = useCallback((reason: 'manual' | 'inactivity') => {
    clearInactivityTimer()
    clearSafetyToken()
    setIsSafetyAuthenticated(false)
    setSessionStartedAt(null)

    const now = new Date().toISOString()
    addEvent({ type: 'session_end', occurred_at: now, reason })
    endSafetySession(reason).catch(() => {}) // fire-and-forget
  }, [clearInactivityTimer, addEvent])

  const resetInactivity = useCallback(() => {
    if (!isSafetyAuthenticated) return
    clearInactivityTimer()
    inactivityTimer.current = setTimeout(() => {
      exitSafetySession('inactivity')
    }, INACTIVITY_MS)
  }, [isSafetyAuthenticated, clearInactivityTimer, exitSafetySession])

  const enterSafetySession = useCallback(() => {
    const now = new Date()
    setIsSafetyAuthenticated(true)
    setSessionStartedAt(now)
    addEvent({ type: 'session_start', occurred_at: now.toISOString() })
  }, [addEvent])

  const logChatSearch = useCallback((notes: string) => {
    addEvent({ type: 'chat_search', occurred_at: new Date().toISOString(), notes })
  }, [addEvent])

  const logAdminAction = useCallback((type: AdminActionType, notes: string) => {
    addEvent({ type, occurred_at: new Date().toISOString(), notes })
  }, [addEvent])

  useEffect(() => {
    if (isSafetyAuthenticated) {
      resetInactivity()
    } else {
      clearInactivityTimer()
    }
    return clearInactivityTimer
  }, [isSafetyAuthenticated, resetInactivity, clearInactivityTimer])

  return (
    <SafetyContext.Provider value={{
      isSafetyAuthenticated,
      sessionStartedAt,
      safetyEvents,
      enterSafetySession,
      exitSafetySession,
      logChatSearch,
      logAdminAction,
      resetInactivity,
    }}>
      {children}
    </SafetyContext.Provider>
  )
}

export function useSafety() {
  const ctx = useContext(SafetyContext)
  if (!ctx) throw new Error('useSafety must be used within SafetyProvider')
  return ctx
}
