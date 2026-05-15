import { useState, useRef } from 'react'
import { Upload, AlertCircle, AlertTriangle, UserPlus, Mail, ChevronDown, Trophy, Users } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { fetchSeasons, importRoster, type MappedRow, type ImportResult } from '@/api/roster'
import { fetchSports, sportDisplayName } from '@/api/sports'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'


type ImportType = 'roster_full' | 'basic_student'

interface ParsedFile {
  headers: string[]
  rows: string[][]
}

function parseCSV(text: string): ParsedFile {
  const lines = text.trim().split('\n').map(l => l.trimEnd())
  if (lines.length === 0) return { headers: [], rows: [] }
  const delim = lines[0].includes('\t') ? '\t' : ','
  const unquote = (s: string) => s.trim().replace(/^"|"$/g, '')
  const headers = lines[0].split(delim).map(unquote)
  const rows = lines.slice(1)
    .map(l => l.split(delim).map(unquote))
    .filter(r => r.some(c => c.length > 0))
  return { headers, rows }
}

function isTruthy(val: string | undefined): boolean {
  if (!val) return false
  return ['yes', 'true', '1'].includes(val.toLowerCase().trim())
}

interface MappingResult {
  rows: MappedRow[]
  noEmailCount: number
}

function mapRosterFull(parsed: ParsedFile): MappingResult {
  let noEmailCount = 0
  const rows = parsed.rows.map((row, i) => {
    const get = (...cols: string[]) => {
      for (const col of cols) {
        const v = row[parsed.headers.indexOf(col)]?.trim()
        if (v) return v
      }
      return ''
    }
    const email = get('Email', 'Student Email')
    if (!email) noEmailCount++
    const rawLevel = get('Level', 'Team').toLowerCase()
    const level = rawLevel.includes('varsity') ? 'varsity' : rawLevel.includes('jv') || rawLevel.includes('junior') ? 'jv' : rawLevel || undefined
    return {
      line:          i + 2,
      email,
      role:          'student' as const,
      first_name:    get('First Name', 'Preferred First Name'),
      last_name:     get('Last Name'),
      is_captain:    isTruthy(get('Is Captain', 'Captain')),
      dob:           get('DOB', 'Date of Birth', 'Birthdate') || undefined,
      jersey_number: get('Jersey', 'Jersey #', 'Jersey Number') || undefined,
      grade:         get('Grade', 'Grade Level') || undefined,
      level:         level || undefined,
      position:      get('Position', 'Sport Position') || undefined,
    }
  })
  return { rows, noEmailCount }
}

function mapBasicStudentCsv(parsed: ParsedFile): MappingResult {
  let noEmailCount = 0
  const rows: MappedRow[] = []

  parsed.rows.forEach((row, i) => {
    const get = (col: string) => row[parsed.headers.indexOf(col)]?.trim() ?? ''
    const lineNum = i + 2

    const studentEmail = get('Email')
    if (!studentEmail) noEmailCount++
    rows.push({
      line:       lineNum,
      email:      studentEmail,
      role:       'student',
      first_name: get('First Name'),
      last_name:  get('Last Name'),
      is_captain: false,
    })

    const p1Email = get('Parent 1 Email')
    if (p1Email) {
      rows.push({
        line:       lineNum,
        email:      p1Email,
        role:       'parent',
        first_name: get('Parent 1 First Name'),
        last_name:  get('Parent 1 Last Name'),
        is_captain: false,
      })
    }

    const p2Email = get('Parent 2 Email')
    if (p2Email) {
      rows.push({
        line:       lineNum,
        email:      p2Email,
        role:       'parent',
        first_name: get('Parent 2 First Name'),
        last_name:  get('Parent 2 Last Name'),
        is_captain: false,
      })
    }
  })

  return { rows, noEmailCount }
}

function buildMappedRows(type: ImportType, parsed: ParsedFile): MappingResult {
  return type === 'roster_full' ? mapRosterFull(parsed) : mapBasicStudentCsv(parsed)
}


type Step = 'type' | 'upload' | 'preview' | 'results'


export default function Import() {
  const { effectiveRole } = useAuth()
  const { sportId } = useParams<{ sportId?: string }>()
  const scopedSportId = sportId ? Number(sportId) : null

  const [step, setStep]             = useState<Step>('type')
  const [importType, setImportType] = useState<ImportType | null>(null)
  const [seasonId, setSeasonId]     = useState<number | null>(null)
  const [parsed, setParsed]         = useState<ParsedFile | null>(null)
  const [mapped, setMapped]         = useState<MappingResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [results, setResults]       = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn:  fetchSports,
    enabled:  !!scopedSportId,
  })
  const scopedSport = scopedSportId ? sports.find(s => s.id === scopedSportId) : null

  const { data: allSeasons = [] } = useQuery({
    queryKey: ['admin-seasons'],
    queryFn: fetchSeasons,
  })
  const seasons = scopedSport
    ? allSeasons.filter(s => s.sport_name === scopedSport.name)
    : effectiveRole === 'athletic_director'
      ? allSeasons.filter(s => s.school_name === 'Alfred High School')
      : allSeasons

  const importMutation = useMutation({
    mutationFn: () => importRoster(seasonId!, mapped!.rows),
    onSuccess: (data) => {
      setResults(data)
      setStep('results')
    },
  })

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const p = parseCSV(e.target?.result as string)
      const m = buildMappedRows(importType!, p)
      setParsed(p)
      setMapped(m)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function reset() {
    setStep('type')
    setImportType(null)
    setSeasonId(null)
    setParsed(null)
    setMapped(null)
    setResults(null)
    importMutation.reset()
  }

  if (step === 'type') return (
    <div className="px-10 py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Roster</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {scopedSport
            ? `Importing for ${sportDisplayName(scopedSport)}. Choose which Final Forms export you're importing.`
            : "Choose which Final Forms export you're importing."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setImportType('roster_full'); setStep('upload') }}
          className="text-left rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-muted/30 p-5 transition-all group"
        >
          <Trophy className="w-7 h-7 text-primary mb-3" />
          <p className="font-semibold text-sm mb-1">Roster Full</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sport-specific roster with positions, jersey numbers, and captain flags. Students only.
          </p>
          <p className="mt-2 text-[11px] text-amber-500 leading-tight">
            Email not included — missing records will be noted in results.
          </p>
        </button>

        <button
          onClick={() => { setImportType('basic_student'); setStep('upload') }}
          className="text-left rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-muted/30 p-5 transition-all group"
        >
          <Users className="w-7 h-7 text-primary mb-3" />
          <p className="font-semibold text-sm mb-1">Basic Student CSV</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            School-wide records with emails and parent contact info. Invites both students and parents.
          </p>
        </button>
      </div>
    </div>
  )

  if (step === 'upload') return (
    <div className="px-10 py-8 max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1">←</button>
        <div>
          <h1 className="text-2xl font-bold">
            {importType === 'roster_full' ? 'Roster Full' : 'Basic Student CSV'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {importType === 'roster_full'
              ? 'In Final Forms: Reports → Roster Full → Export CSV'
              : 'In Final Forms: Reports → Basic Student CSV → Export CSV'}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Season</label>
        <div className="relative">
          <select
            value={seasonId ?? ''}
            onChange={e => setSeasonId(Number(e.target.value) || null)}
            className="w-full appearance-none text-sm border rounded-md px-3 py-2 pr-8 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a season…</option>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>
                {s.sport_name} — {s.name} ({s.school_year}) · {s.school_name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          if (!seasonId) return
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        onClick={() => { if (seasonId) fileRef.current?.click() }}
        className={cn(
          'border-2 border-dashed rounded-xl p-14 flex flex-col items-center gap-3 transition-colors',
          seasonId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
        )}
      >
        <Upload className={cn('w-8 h-8 transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        <div className="text-center">
          <p className="text-sm font-medium">Drop your CSV or TSV here</p>
          <p className="text-xs text-muted-foreground mt-1">
            {seasonId ? 'or click to browse' : 'Select a season first'}
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>
    </div>
  )

  if (step === 'preview' && parsed && mapped) {
    const students = mapped.rows.filter(r => r.role === 'student')
    const parents  = mapped.rows.filter(r => r.role === 'parent')
    const preview  = mapped.rows.slice(0, 5)

    return (
      <div className="px-10 py-8 max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Review import</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {parsed.rows.length} source row{parsed.rows.length !== 1 ? 's' : ''} →{' '}
              {mapped.rows.length} record{mapped.rows.length !== 1 ? 's' : ''} to process
            </p>
          </div>
          <button onClick={() => setStep('upload')} className="text-sm text-muted-foreground hover:text-foreground">
            ← Change file
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{students.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Students</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{parents.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Parents</p>
          </div>
          <div className={cn('rounded-lg border p-3 text-center', mapped.noEmailCount > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'bg-card')}>
            <p className={cn('text-2xl font-bold', mapped.noEmailCount > 0 && 'text-amber-500')}>{mapped.noEmailCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Missing email</p>
          </div>
        </div>

        {mapped.noEmailCount > 0 && (
          <div className="flex items-start gap-2 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-none" />
            <span>
              {mapped.noEmailCount} record{mapped.noEmailCount !== 1 ? 's are' : ' is'} missing an email address and won't be invited. They'll be noted in the results.
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview — first {Math.min(5, mapped.rows.length)} records
          </p>
          <div className="rounded-lg border overflow-x-auto">
            <table className="text-xs w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {['Role', 'Email', 'First name', 'Last name', 'Captain'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <span className={cn('capitalize rounded px-1.5 py-0.5', row.role === 'student' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[180px] truncate">
                      {row.email || <span className="text-amber-500">— missing</span>}
                    </td>
                    <td className="px-3 py-2">{row.first_name || <span className="text-muted-foreground/30">—</span>}</td>
                    <td className="px-3 py-2">{row.last_name  || <span className="text-muted-foreground/30">—</span>}</td>
                    <td className="px-3 py-2">{row.is_captain ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {importMutation.isError && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
            <span>{(importMutation.error as Error).message}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t">
          <button
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importMutation.isPending ? 'Importing…' : `Import ${mapped.rows.length} record${mapped.rows.length !== 1 ? 's' : ''}`}
          </button>
          <button onClick={reset} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (step === 'results' && results) {
    const missingEmail = results.errors.filter(e => e.reason === 'Missing email')
    const otherErrors  = results.errors.filter(e => e.reason !== 'Missing email')

    return (
      <div className="px-10 py-8 max-w-2xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import complete</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {results.added.length + results.invited.length} processed
              {otherErrors.length > 0 && ` · ${otherErrors.length} error${otherErrors.length !== 1 ? 's' : ''}`}
              {missingEmail.length > 0 && ` · ${missingEmail.length} skipped (no email)`}
            </p>
          </div>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border rounded-md"
          >
            Import another
          </button>
        </div>

        {results.added.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-semibold">{results.added.length} added to season</p>
            </div>
            <div className="rounded-lg border divide-y">
              {results.added.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground ml-2">{r.email}</span>
                  </div>
                  <span className="text-xs capitalize text-muted-foreground bg-muted rounded px-1.5 py-0.5">{r.role}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {results.invited.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">{results.invited.length} invited via email</p>
            </div>
            <div className="rounded-lg border divide-y">
              {results.invited.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{r.email}</span>
                  <span className="text-xs capitalize text-muted-foreground bg-muted rounded px-1.5 py-0.5">{r.role}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {missingEmail.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold">{missingEmail.length} skipped — no email address</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 px-3 py-2.5 text-sm text-muted-foreground">
              These rows had no email and couldn't be added or invited.
              Use the <strong>Basic Student CSV</strong> export from Final Forms to include email addresses.
            </div>
          </section>
        )}

        {otherErrors.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm font-semibold">{otherErrors.length} error{otherErrors.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="rounded-lg border border-destructive/20 divide-y">
              {otherErrors.map((e, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 text-sm">
                  <span className="text-xs text-muted-foreground w-12 flex-none">Row {e.line}</span>
                  <div>
                    {e.email && <span className="text-muted-foreground block">{e.email}</span>}
                    <span className="text-destructive text-xs">{e.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return null
}
