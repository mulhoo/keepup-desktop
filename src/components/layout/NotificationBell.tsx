import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Shield, AlertTriangle, X, CheckCheck } from 'lucide-react'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, type AppNotification } from '@/api/notifications'
import { cn } from '@/lib/utils'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'safety_chat_access')
    return <Shield className="w-4 h-4 text-amber-500 flex-none mt-0.5" />
  return <AlertTriangle className="w-4 h-4 text-red-500 flex-none mt-0.5" />
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc  = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey:      ['notifications'],
    queryFn:       fetchNotifications,
    refetchInterval: 30_000,
  })

  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      qc.setQueryData<AppNotification[]>(['notifications'], prev =>
        prev?.map(n => n.id === updated.id ? updated : n) ?? []
      )
    },
  })

  const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.setQueryData<AppNotification[]>(['notifications'], prev =>
        prev?.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })) ?? []
      )
    },
  })

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-md transition-colors',
          open ? 'bg-white/20' : 'hover:bg-white/10',
        )}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-white/70" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-96 max-h-[480px] overflow-y-auto rounded-xl border bg-popover shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-0.5 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 flex gap-3 transition-colors group',
                    !n.read && 'bg-accent/20',
                  )}
                >
                  <NotifIcon type={n.notification_type} />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold leading-snug">{n.title}</p>
                      {!n.read ? (
                        <button
                          onClick={() => markRead(n.id)}
                          title="Mark as read"
                          className="flex-none w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 hover:scale-150 transition-transform"
                        />
                      ) : null}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{n.body}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
