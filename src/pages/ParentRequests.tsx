import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Clock, Check, X } from 'lucide-react'
import {
  fetchAdViewRequests, approveViewRequest, denyViewRequest,
  type AdViewRequest,
} from '@/api/family'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function RequestRow({ req }: { req: AdViewRequest }) {
  const queryClient = useQueryClient()

  const approve = useMutation({
    mutationFn: () => approveViewRequest(req.id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['adViewRequests'] }),
  })
  const deny = useMutation({
    mutationFn: () => denyViewRequest(req.id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['adViewRequests'] }),
  })

  const busy = approve.isPending || deny.isPending

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">{req.parent_name}</p>
          <p className="text-xs text-muted-foreground">
            Requesting access to <span className="font-medium text-foreground">{req.child_name}</span>'s peer messages
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-none">
          <Clock className="w-3 h-3" />
          {timeAgo(req.created_at)}
        </div>
      </div>

      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-xs text-muted-foreground mb-0.5 font-medium">Reason</p>
        <p className="text-sm">{req.reason}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => approve.mutate()}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Approve — 48h access
        </button>
        <button
          onClick={() => deny.mutate()}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 disabled:opacity-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Deny
        </button>
      </div>
    </div>
  )
}

export default function ParentRequests() {
  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ['adViewRequests'],
    queryFn:  fetchAdViewRequests,
  })

  return (
    <div className="px-10 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parent Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parents requesting temporary access to their child's peer message history. Approval grants 48 hours of read-only access.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border p-6 text-sm text-destructive">
          Failed to load requests.
        </div>
      )}

      {requests && requests.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No pending requests.
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map(req => (
            <RequestRow key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  )
}
