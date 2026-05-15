import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCog, X } from 'lucide-react'
import { setCommissioner, removeCommissioner, type Sport } from '@/api/sports'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'


interface CommissionerSectionProps {
  representativeSportId: number
  commissioner: Sport['commissioner']
  canManage: boolean
}

export function CommissionerSection({ representativeSportId, commissioner, canManage }: CommissionerSectionProps) {
  const queryClient = useQueryClient()
  const [editing,         setEditing]         = useState(false)
  const [email,           setEmail]           = useState('')
  const [confirmRemove,   setConfirmRemove]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const assignMutation = useMutation({
    mutationFn: (e: string) => setCommissioner(representativeSportId, e),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sports'] }); setEditing(false); setEmail('') },
  })

  const removeMutation = useMutation({
    mutationFn: () => removeCommissioner(representativeSportId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sports'] }) },
  })

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) assignMutation.mutate(email.trim())
  }

  return (
    <>
      <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <UserCog className="w-3.5 h-3.5" />
            Commissioner
          </div>
          {canManage && !editing && (
            <button
              onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50) }}
              className="text-xs text-primary hover:underline"
            >
              {commissioner ? 'Change' : 'Assign'}
            </button>
          )}
        </div>

        {commissioner ? (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{commissioner.first_name} {commissioner.last_name}</p>
              <p className="text-xs text-muted-foreground">{commissioner.email}</p>
            </div>
            {canManage && !editing && (
              <button
                onClick={() => setConfirmRemove(true)}
                disabled={removeMutation.isPending}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                title="Remove commissioner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          !editing && <p className="text-xs text-muted-foreground">No commissioner assigned.</p>
        )}

        {editing && (
          <form onSubmit={handleAssign} className="flex gap-2">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Commissioner's email…"
              className="flex-1 text-xs border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!email.trim() || assignMutation.isPending}
              className="text-xs px-2.5 py-1.5 bg-primary text-primary-foreground rounded disabled:opacity-40"
            >
              {assignMutation.isPending ? '…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </form>
        )}

        {(assignMutation.isError || removeMutation.isError) && (
          <p className="text-xs text-destructive">{((assignMutation.error || removeMutation.error) as Error).message}</p>
        )}
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove commissioner?</AlertDialogTitle>
            <AlertDialogDescription>
              {commissioner?.first_name} {commissioner?.last_name} will no longer oversee this sport.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setConfirmRemove(false); removeMutation.mutate() }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
