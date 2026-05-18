import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Bell, UserCheck, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { notifyParents, notifyAD, notifyDistrictAdmin, deleteMessageEverywhere, type Activity } from '@/api/activities'
import { toast } from '@/lib/toast'
import { useSafety } from '@/contexts/SafetyContext'

interface Props {
  activity: Activity
  canNotifyParents: boolean
  canNotifyAD: boolean
  canNotifyDistrictAdmin: boolean
  canDelete: boolean
  defaultOpen?: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 flex-none text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function ActivityCard({ activity, canNotifyParents, canNotifyAD, canNotifyDistrictAdmin, canDelete, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const qc = useQueryClient()
  const { logAdminAction } = useSafety()

  // Re-open if focusedId changes while component is already mounted (user already on Alerts page)
  useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['activities'] })
  }

  const parentsMutation = useMutation({
    mutationFn: () => notifyParents(activity.id),
    onSuccess: () => { invalidate(); toast.success('Parents notified.'); logAdminAction('parents_notified', `Parents notified — ${activity.summary}`) },
    onError:   (e: Error) => toast.error(e.message ?? 'Failed to notify parents.'),
  })

  const adMutation = useMutation({
    mutationFn: () => notifyAD(activity.id),
    onSuccess: () => { invalidate(); toast.success('Athletic director notified.'); logAdminAction('ad_notified', `Athletic director notified — ${activity.summary}`) },
    onError:   (e: Error) => toast.error(e.message ?? 'Failed to notify athletic director.'),
  })

  const districtMutation = useMutation({
    mutationFn: () => notifyDistrictAdmin(activity.id),
    onSuccess: () => { invalidate(); toast.success('District admin notified.'); logAdminAction('district_notified', `District admin notified — ${activity.summary}`) },
    onError:   (e: Error) => toast.error(e.message ?? 'Failed to notify district admin.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMessageEverywhere(activity.id),
    onSuccess: (res) => {
      invalidate()
      setConfirmDelete(false)
      toast.success(`Message deleted from ${res.deleted_count} channel${res.deleted_count !== 1 ? 's' : ''}.`)
      logAdminAction('message_deleted_everywhere', `Message deleted from ${res.deleted_count} channel${res.deleted_count !== 1 ? 's' : ''} — ${activity.summary}`)
    },
    onError: (e: Error) => { setConfirmDelete(false); toast.error(e.message ?? 'Failed to delete message.') },
  })

  const isSevere        = activity.tier === 'severe'
  const isAccessed      = activity.event_type === 'data_accessed'
  const isParentConcern = activity.event_type === 'parent_coach_concern'

  const dotColor = isParentConcern ? 'bg-purple-400' : isAccessed ? 'bg-blue-400' : isSevere ? 'bg-red-500' : 'bg-yellow-400'
  const label    = isParentConcern ? 'Parent'        : isAccessed ? 'Data Access' : isSevere  ? 'Severe'     : 'Flagged'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => { setOpen(true); logAdminAction('alert_viewed', `Viewed alert — ${activity.summary}`) }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-card text-left hover:bg-muted/50 transition-colors group"
      >
        <span className={cn('w-2 h-2 rounded-full flex-none', dotColor)} />
        <span className="text-xs font-medium text-muted-foreground w-16 flex-none">{label}</span>
        <span className="text-sm flex-1 truncate">{activity.summary}</span>
        <div className="flex items-center gap-1.5 flex-none">
          {activity.sport && (
            <span className="text-xs px-1.5 py-0.5 rounded border bg-muted/50 text-muted-foreground font-medium">
              {activity.sport}
            </span>
          )}
          {activity.school_name && (
            <span className="text-xs px-1.5 py-0.5 rounded border bg-muted/50 text-muted-foreground font-medium">
              {activity.school_name}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex-none">{formatTime(activity.occurred_at)}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('w-2 h-2 rounded-full flex-none', dotColor)} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          </div>
          <DialogTitle className="text-base leading-snug">{activity.summary}</DialogTitle>
          <DialogDescription>{formatTime(activity.occurred_at)}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 space-y-2 border-y">
          <DetailRow label="Sport"    value={activity.sport} />
          <DetailRow label="School"   value={activity.school_name} />
          <DetailRow label="Season"   value={activity.season} />
          <DetailRow label="Channel"  value={activity.channel ? `#${activity.channel}` : null} />
          <DetailRow label="Sent by"  value={activity.actor?.name} />
          <DetailRow label="Action"    value={activity.flag_action} />
          <DetailRow label="Reason"    value={activity.flag_reason} />
          <DetailRow label="User note" value={activity.report_notes} />
          <DetailRow label="Accessed"  value={activity.accessed_user_name} />
        </div>

        {(canNotifyParents || canNotifyAD || canNotifyDistrictAdmin || canDelete) && (
          <DialogFooter className="flex-col items-start gap-2 sm:flex-col">
            <div className="flex flex-wrap gap-2 w-full">
              {canNotifyParents && (
                <Button
                  size="sm"
                  variant={activity.parents_notified_at ? 'secondary' : 'outline'}
                  disabled={!!activity.parents_notified_at || parentsMutation.isPending}
                  onClick={() => parentsMutation.mutate()}
                  className="gap-1.5"
                >
                  {activity.parents_notified_at
                    ? <><Check className="w-3.5 h-3.5" /> Parents Notified</>
                    : <><Bell className="w-3.5 h-3.5" /> Notify Parents</>}
                </Button>
              )}
              {canNotifyAD && (
                <Button
                  size="sm"
                  variant={activity.ad_notified_at ? 'secondary' : 'outline'}
                  disabled={!!activity.ad_notified_at || adMutation.isPending}
                  onClick={() => adMutation.mutate()}
                  className="gap-1.5"
                >
                  {activity.ad_notified_at
                    ? <><Check className="w-3.5 h-3.5" /> AD Notified</>
                    : <><UserCheck className="w-3.5 h-3.5" /> Notify AD</>}
                </Button>
              )}
              {canNotifyDistrictAdmin && (
                <Button
                  size="sm"
                  variant={activity.district_notified_at ? 'secondary' : 'outline'}
                  disabled={!!activity.district_notified_at || districtMutation.isPending}
                  onClick={() => districtMutation.mutate()}
                  className="gap-1.5"
                >
                  {activity.district_notified_at
                    ? <><Check className="w-3.5 h-3.5" /> District Admin Notified</>
                    : <><UserCheck className="w-3.5 h-3.5" /> Alert District Admin</>}
                </Button>
              )}
            </div>

            {/* Confirmation notes */}
            {activity.parents_notified_at && (
              <p className="text-xs text-muted-foreground">
                Parents notified {formatTime(activity.parents_notified_at)}
              </p>
            )}
            {activity.ad_notified_at && activity.ad_notified_name && (
              <p className="text-xs text-muted-foreground">
                {activity.ad_notified_name} notified {formatTime(activity.ad_notified_at)}
              </p>
            )}
            {activity.district_notified_at && (
              <p className="text-xs text-muted-foreground">
                District Admin alerted {formatTime(activity.district_notified_at)}
                {activity.peer_notified_name && (
                  <> — {activity.peer_notified_name} was also notified</>
                )}
              </p>
            )}

            {/* Delete everywhere */}
            {canDelete && (
              <div className="w-full border-t pt-3 mt-1">
                {activity.deleted_everywhere_at ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-destructive" />
                    Deleted from {activity.deleted_everywhere_count ?? '?'} channel{activity.deleted_everywhere_count !== 1 ? 's' : ''} · {formatTime(activity.deleted_everywhere_at)}
                  </p>
                ) : !confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors font-medium disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete from all channels
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-destructive flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-none mt-0.5" />
                      This will delete this message from every channel the sender posted it in. This cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                        className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:bg-destructive/90 transition-colors font-medium disabled:opacity-40"
                      >
                        {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete everywhere'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
