import { useState, useRef } from 'react'
import { Upload, Trophy, Users, CheckCircle2, X, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchSports } from '@/api/sports'
import { cn } from '@/lib/utils'

// ── Column definitions ────────────────────────────────────────────────────────

const ROSTER_IMPORT: { src: string; label: string }[] = [
  { src: 'StudentID',            label: 'Student ID' },
  { src: 'First Name',           label: 'First Name' },
  { src: 'Last Name',            label: 'Last Name' },
  { src: 'Preferred First Name', label: 'Preferred Name' },
  { src: 'Name Pronunciation',   label: 'Name Pronunciation' },
  { src: 'Grade',                label: 'Grade' },
  { src: 'Graduation Year',      label: 'Graduation Year' },
  { src: 'Teams',                label: 'Teams' },
  { src: 'Home Jersey',          label: 'Home Jersey #' },
  { src: 'Away Jersey',          label: 'Away Jersey #' },
  { src: 'Height',               label: 'Height' },
  { src: 'Weight',               label: 'Weight' },
  { src: 'Position 1',           label: 'Position 1' },
  { src: 'Position 2',           label: 'Position 2' },
  { src: 'Is Captain',           label: 'Captain' },
  { src: 'Is Manager',           label: 'Manager' },
  { src: 'Is Statistician',      label: 'Statistician' },
  { src: 'Lettered',             label: 'Lettered' },
  { src: 'Years Lettered',       label: 'Years Lettered' },
  { src: 'School Of Origin',     label: 'School of Origin' },
  { src: 'Awards',               label: 'Awards' },
  { src: 'Notes',                label: 'Notes' },
]

const ROSTER_SKIP: Record<string, string> = {
  'Cumulative GPA':                                    'Academic record — stays in Final Forms',
  'Registered On':                                     'Registration metadata',
  'Attended Preseason Meeting':                        'Compliance tracking — stays in Final Forms',
  "Attended Another Sport's Preseason Meeting":        'Compliance tracking — stays in Final Forms',
}

const BASIC_IMPORT: { src: string; label: string }[] = [
  { src: 'StudentID',              label: 'Student ID' },
  { src: 'School',                 label: 'School' },
  { src: 'First Name',             label: 'First Name' },
  { src: 'Last Name',              label: 'Last Name' },
  { src: 'Email',                  label: 'Email' },
  { src: 'Cell Phone',             label: 'Cell Phone' },
  { src: 'Is Eligible',            label: 'Eligible' },
  { src: 'Enrollment Status',      label: 'Enrollment Status' },
  { src: 'Cleared',                label: 'Cleared to Play' },
  { src: 'Transfer Student',       label: 'Transfer Student' },
  { src: 'Gender',                 label: 'Gender' },
  { src: 'Graduation Year',        label: 'Graduation Year' },
  { src: 'Grade',                  label: 'Grade' },
  { src: 'Parent 1 First Name',    label: 'Parent 1 First' },
  { src: 'Parent 1 Last Name',     label: 'Parent 1 Last' },
  { src: 'Parent 1 Email',         label: 'Parent 1 Email' },
  { src: 'Parent 1 Cell Phone',    label: 'Parent 1 Cell' },
  { src: 'Parent 2 First Name',    label: 'Parent 2 First' },
  { src: 'Parent 2 Last Name',     label: 'Parent 2 Last' },
  { src: 'Parent 2 Email',         label: 'Parent 2 Email' },
  { src: 'Parent 2 Cell Phone',    label: 'Parent 2 Cell' },
]

const BASIC_SKIP: Record<string, string> = {
  'Residential School':               'Not needed for sport management',
  'Street Address':                   'Home address not stored',
  'Unit Number':                      'Home address not stored',
  'City':                             'Home address not stored',
  'State':                            'Home address not stored',
  'Zip':                              'Home address not stored',
  'Home Phone':                       'Cell preferred for app notifications',
  'Race':                             'Demographic data not used by KeepUp',
  'Date of Birth':                    'Grade and graduation year used instead',
  'Physical Taken':                   'Medical records stay in Final Forms',
  'Physical Expiration':              'Medical records stay in Final Forms',
  'Physical Clearance':               'Medical records stay in Final Forms',
  'ImPACT Tested On':                 'Medical records stay in Final Forms',
  'ImPACT Expires On':                'Medical records stay in Final Forms',
  'ImPACT Test Notes':                'Medical records stay in Final Forms',
  'Sports':                           'Managed within KeepUp directly',
  'Sport Teams':                      'Managed within KeepUp directly',
  'Activities':                       'Not applicable to KeepUp',
  'Activity Teams':                   'Not applicable to KeepUp',
  'Groups':                           'Not applicable to KeepUp',
  'Payment Status':                   'Financial data stays in Final Forms',
  'Unpaid Fees Total':                'Financial data stays in Final Forms',
  'Are All Forms Completed':          'Compliance tracking stays in Final Forms',
  'Are All Forms Parent Signed':      'Compliance tracking stays in Final Forms',
  'Are All Forms Student Signed':     'Compliance tracking stays in Final Forms',
  'Parent 1 Home Phone':              'Cell preferred for app notifications',
  'Parent 1 Work Phone':              'Cell preferred for app notifications',
  'Parent 2 Home Phone':              'Cell preferred for app notifications',
  'Parent 2 Work Phone':              'Cell preferred for app notifications',
}

// ── CSV/TSV parser ────────────────────────────────────────────────────────────

interface ParsedFile { headers: string[]; rows: string[][] }

function parseFile(text: string): ParsedFile {
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

// ── Page ──────────────────────────────────────────────────────────────────────

type ImportType = 'roster_full' | 'basic_student'
type Step = 'type' | 'upload' | 'preview' | 'done'

export default function Import() {
  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn: () => fetchSports(),
  })

  const [step, setStep]             = useState<Step>('type')
  const [importType, setImportType] = useState<ImportType | null>(null)
  const [sportId, setSportId]       = useState<number | null>(null)
  const [parsed, setParsed]         = useState<ParsedFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Both ADs and head coaches are scoped to their own school (school_id 1 = LWHS in demo)
  const activeSports = sports.filter(s => s.status === 'active' && s.school_id === 1)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      setParsed(parseFile(e.target?.result as string))
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function reset() {
    setStep('type'); setImportType(null); setSportId(null); setParsed(null)
  }

  const colDefs  = importType === 'roster_full' ? ROSTER_IMPORT : BASIC_IMPORT
  const skipDefs = importType === 'roster_full' ? ROSTER_SKIP   : BASIC_SKIP

  const matched        = parsed ? colDefs.filter(c => parsed.headers.includes(c.src)) : []
  const skipped        = parsed ? parsed.headers.filter(h => skipDefs[h]).map(h => ({ src: h, reason: skipDefs[h] })) : []
  const matchedIndices = parsed ? matched.map(c => parsed.headers.indexOf(c.src)) : []

  // ── Type selection ─────────────────────────────────────────────────────────
  if (step === 'type') return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import from Final Forms</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose which export to import.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setImportType('roster_full'); setStep('upload') }}
          className="text-left rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-muted/30 p-5 transition-all group"
        >
          <Trophy className="w-7 h-7 text-primary mb-3" />
          <p className="font-semibold text-sm mb-1">Roster Full</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sport-specific roster with positions, jersey numbers, height, weight, and awards. One sport at a time.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Select <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        <button
          onClick={() => { setImportType('basic_student'); setStep('upload') }}
          className="text-left rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-muted/30 p-5 transition-all group"
        >
          <Users className="w-7 h-7 text-primary mb-3" />
          <p className="font-semibold text-sm mb-1">Basic Student CSV</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            School-wide student records with contact info, eligibility, and parent emails for account linking.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Select <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>
    </div>
  )

  // ── Upload ─────────────────────────────────────────────────────────────────
  if (step === 'upload') return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1">
          ←
        </button>
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

      {importType === 'roster_full' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Which sport is this roster for?</label>
          <select
            value={sportId ?? ''}
            onChange={e => setSportId(Number(e.target.value) || null)}
            className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a sport…</option>
            {activeSports.map(s => (
              <option key={s.id} value={s.id}>{s.name} · {s.school_name} · {s.school_year}</option>
            ))}
          </select>
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-14 flex flex-col items-center gap-3 cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
        )}
      >
        <Upload className={cn('w-8 h-8 transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        <div className="text-center">
          <p className="text-sm font-medium">Drop your CSV or TSV here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
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

  // ── Preview ────────────────────────────────────────────────────────────────
  if (step === 'preview' && parsed) {
    const previewRows = parsed.rows.slice(0, 5)
    const selectedSport = activeSports.find(s => s.id === sportId)

    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Review import</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {parsed.rows.length} row{parsed.rows.length !== 1 ? 's' : ''} ·{' '}
              {matched.length} of {parsed.headers.length} columns imported ·{' '}
              {skipped.length} skipped
              {selectedSport && ` · ${selectedSport.name}`}
            </p>
          </div>
          <button
            onClick={() => setStep('upload')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex-none"
          >
            ← Change file
          </button>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          {/* Data preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview — first {Math.min(5, parsed.rows.length)} of {parsed.rows.length} rows
            </p>
            <div className="rounded-lg border overflow-x-auto">
              <table className="text-xs w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {matched.map(c => (
                      <th key={c.src} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      {matchedIndices.map((idx, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap max-w-[160px] truncate">
                          {row[idx] || <span className="text-muted-foreground/30">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column mapping */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Importing ({matched.length})
              </p>
              {matched.map(c => (
                <div key={c.src} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-none" />
                  <span className="text-muted-foreground min-w-0 truncate">{c.src}</span>
                  <span className="text-muted-foreground/30 flex-none">→</span>
                  <span className="font-medium flex-none">{c.label}</span>
                </div>
              ))}
            </div>

            {skipped.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Not imported ({skipped.length})
                </p>
                {skipped.map(c => (
                  <div key={c.src} className="text-xs">
                    <div className="flex items-center gap-2">
                      <X className="w-3.5 h-3.5 text-muted-foreground/30 flex-none" />
                      <span className="text-muted-foreground/50">{c.src}</span>
                    </div>
                    <p className="pl-5 text-[10px] text-muted-foreground/40 leading-tight mt-0.5">{c.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t">
          <button
            onClick={() => setStep('done')}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Import {parsed.rows.length} record{parsed.rows.length !== 1 ? 's' : ''}
          </button>
          <button onClick={reset} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="rounded-xl border bg-card p-12 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">Import complete</p>
          <p className="text-sm text-muted-foreground">
            {parsed?.rows.length ?? 0} record{(parsed?.rows.length ?? 0) !== 1 ? 's' : ''} imported from Final Forms.
          </p>
        </div>
        <button
          onClick={reset}
          className="mt-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          Import another file
        </button>
      </div>
    </div>
  )
}
