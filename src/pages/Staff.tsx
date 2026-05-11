import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/useAuth'
import { fetchSchools } from '@/api/schools'
import {
  fetchStaff, createStaffMember, updateStaffMember, removeStaffMember,
  ROLE_LABELS, CREATABLE_BY,
  type StaffMember, type StaffRole,
} from '@/api/staff'
import { cn } from '@/lib/utils'

// ── Email domain banner ───────────────────────────────────────────────────────

function DomainSuffix({ domain }: { domain: string | null }) {
  if (!domain) return null
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
      @{domain}
    </span>
  )
}

// ── Staff form modal ──────────────────────────────────────────────────────────

interface StaffFormProps {
  open: boolean
  onClose: () => void
  existing?: StaffMember
  emailDomain: string | null
  creatableRoles: StaffRole[]
  demoRole: string | null
}

function StaffFormModal({ open, onClose, existing, emailDomain, creatableRoles, demoRole }: StaffFormProps) {
  const qc = useQueryClient()
  const { data: schools = [] } = useQuery({ queryKey: ['schools'], queryFn: fetchSchools })

  const [firstName, setFirstName] = useState(existing?.first_name ?? '')
  const [lastName,  setLastName]  = useState(existing?.last_name ?? '')
  const [emailPrefix, setEmailPrefix] = useState(() => {
    if (!existing?.email) return ''
    return emailDomain ? existing.email.replace(`@${emailDomain}`, '') : existing.email
  })
  const [role,     setRole]     = useState<StaffRole>(existing?.role ?? creatableRoles[0])
  const [schoolId, setSchoolId] = useState<string>(existing?.school_id?.toString() ?? '')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)
  const [error,  setError]      = useState<string | null>(null)

  const email = emailDomain ? `${emailPrefix}@${emailDomain}` : emailPrefix

  const createMutation = useMutation({
    mutationFn: createStaffMember,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setTempPassword((created as any)._temp_password ?? null)
    },
    onError: (e: any) => setError(e.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateStaffMember>[1] }) =>
      updateStaffMember(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); onClose() },
    onError: (e: any) => setError(e.message),
  })

  function handleSubmit() {
    setError(null)
    if (existing) {
      updateMutation.mutate({ id: existing.id, data: { first_name: firstName, last_name: lastName, email } })
    } else {
      createMutation.mutate({
        first_name: firstName,
        last_name:  lastName,
        email,
        role,
        school_id: schoolId ? Number(schoolId) : undefined,
      })
    }
  }

  function handleCopy() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isDistrictAdmin = demoRole === 'district_admin'
  const busy = createMutation.isPending || updateMutation.isPending

  if (tempPassword) {
    return (
      <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Staff member created</DialogTitle>
            <DialogDescription>
              Share this temporary password with {firstName}. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
            <code className="flex-1 text-sm font-mono">{tempPassword}</code>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit staff member' : 'Add staff member'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="relative">
              <Input
                value={emailPrefix}
                onChange={e => setEmailPrefix(e.target.value.replace(/@.*/, ''))}
                placeholder={emailDomain ? 'jsmith' : 'jsmith@lwsd.org'}
                className={cn(emailDomain && 'pr-28')}
              />
              <DomainSuffix domain={emailDomain} />
            </div>
          </div>

          {!existing && (
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={v => setRole(v as StaffRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {creatableRoles.map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!existing && isDistrictAdmin && (
            <div className="space-y-1.5">
              <Label>School</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy || !firstName || !lastName || !emailPrefix}>
            {existing ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Staff() {
  const { demoRole } = useAuth()
  const qc = useQueryClient()

  const creatableRoles = CREATABLE_BY[demoRole ?? ''] ?? []

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn:  fetchStaff,
  })

  const removeMutation = useMutation({
    mutationFn: removeStaffMember,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })

  const [formOpen,    setFormOpen]    = useState(false)
  const [editing,     setEditing]     = useState<StaffMember | undefined>()
  const [removing,    setRemoving]    = useState<StaffMember | null>(null)

  // Group by school
  const grouped = staffList.reduce<Record<string, StaffMember[]>>((acc, s) => {
    const key = s.school_name ?? 'District Level'
    acc[key] = [...(acc[key] ?? []), s]
    return acc
  }, {})

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage coaches and administrators.
          </p>
        </div>
        {creatableRoles.length > 0 && (
          <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Add staff
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : staffList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No staff members yet.</p>
      ) : (
        Object.entries(grouped).map(([school, members]) => (
          <div key={school} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{school}</h2>
            <div className="border rounded-lg divide-y">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{member.first_name} {member.last_name}</p>
                    <p className="text-xs text-muted-foreground">{member.email} · {ROLE_LABELS[member.role]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditing(member); setFormOpen(true) }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRemoving(member)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {formOpen && (
        <StaffFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(undefined) }}
          existing={editing}
          emailDomain={null}
          creatableRoles={creatableRoles}
          demoRole={demoRole}
        />
      )}

      <AlertDialog open={!!removing} onOpenChange={v => { if (!v) setRemoving(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.first_name} {removing?.last_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate their account. They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (removing) removeMutation.mutate(removing.id); setRemoving(null) }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
