import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Trophy, Users, ChevronRight, ChevronDown, Loader2, Mail } from 'lucide-react'
import { fetchSchools, type School } from '@/api/schools'
import { fetchSports, fetchSportDetail, type Sport, type MemberRole } from '@/api/sports'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SEASON_LABEL: Record<string, string> = { fall: 'Fall', winter: 'Winter', spring: 'Spring' }

const ROLE_LABEL_PLURAL: Record<MemberRole, string> = {
  head_coach: 'Head Coaches', assistant_coach: 'Asst. Coaches',
  student_captain: 'Captains', student: 'Athletes',
}
const ROLE_ORDER: MemberRole[] = ['head_coach', 'assistant_coach', 'student_captain', 'student']


function PastSeasonDialog({ sport, onClose }: { sport: Sport; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sport', sport.id],
    queryFn: () => fetchSportDetail(sport.id),
  })

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="w-[440px] max-w-[95vw] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle>{sport.name} — {sport.school_year}</DialogTitle>
          <DialogDescription>
            {SEASON_LABEL[sport.season]} · {sport.athlete_count} athletes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {data && ROLE_ORDER.map(role => {
            const members = data.members.filter(m => m.role === role)
            if (members.length === 0) return null
            return (
              <div key={role} className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {ROLE_LABEL_PLURAL[role]}{members.length > 1 ? ` (${members.length})` : ''}
                </p>
                {members.map(m => (
                  <div key={m.user_id} className={cn('flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors', m.graduated && 'opacity-60')}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
                      {m.first_name[0]}{m.last_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium leading-none', m.graduated && 'italic')}>
                        {m.first_name} {m.last_name}
                        {m.graduated && (
                          <span className="ml-2 text-xs font-normal not-italic bg-muted text-muted-foreground px-1.5 py-0.5 rounded align-middle">
                            Graduated
                          </span>
                        )}
                      </p>
                      {m.grade && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Grade {m.grade}{m.jersey_number ? ` · #${m.jersey_number}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}


function SportBlurb({ current, past }: { current: Sport; past: Sport[] }) {
  const [pastDialog, setPastDialog] = useState<Sport | null>(null)
  const headCoach = current.coaches.find(c => c.role === 'head_coach')

  return (
    <>
      <div className="mt-2 pt-3 border-t border-border/60 space-y-2.5 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {headCoach && (
            <>
              <span className="font-medium text-foreground/70">Head Coach</span>
              <span>{headCoach.first_name} {headCoach.last_name}</span>
            </>
          )}
          <span className="font-medium text-foreground/70">Season</span>
          <span>{SEASON_LABEL[current.season]}</span>
          <span className="font-medium text-foreground/70">Athletes</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{current.athlete_count}</span>
        </div>

        {past.length > 0 && (
          <div className="space-y-1 pt-1">
            <p className="font-medium text-foreground/70">Past seasons</p>
            {past.sort((a, b) => b.school_year.localeCompare(a.school_year)).map(p => (
              <button
                key={p.id}
                onClick={() => setPastDialog(p)}
                className="w-full flex items-center justify-between pl-2 pr-1 py-1 rounded hover:bg-muted/60 transition-colors group text-muted-foreground"
              >
                <span className="group-hover:text-foreground transition-colors">{p.school_year}</span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.athlete_count}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {pastDialog && (
        <PastSeasonDialog sport={pastDialog} onClose={() => setPastDialog(null)} />
      )}
    </>
  )
}

function SportRow({ current, past }: { current: Sport; past: Sport[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('rounded-md border bg-card transition-colors', open && 'border-primary/30')}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <Trophy className="w-4 h-4 text-primary flex-none" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{current.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3" />{current.athlete_count} athletes
          </p>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-none" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-none" />
        }
      </button>

      {open && <div className="px-3 pb-3"><SportBlurb current={current} past={past} /></div>}
    </div>
  )
}

function SchoolPanel({ school, onClose }: { school: School; onClose: () => void }) {
  const { data: allSports, isLoading } = useQuery({
    queryKey: ['sports', school.id],
    queryFn: () => fetchSports(),
  })

  const schoolSports = allSports?.filter(s => s.school_id === school.id) ?? []

  const schoolYears = [...new Set(schoolSports.map(s => s.school_year))].sort().reverse()
  const currentYear = schoolYears[0] ?? ''

  const currentSports = schoolSports.filter(s => s.school_year === currentYear)
  const pastSports    = schoolSports.filter(s => s.school_year !== currentYear)

  return (
    <Sheet open onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary flex-none" />
            {school.name}
          </SheetTitle>
          <SheetDescription>
            {currentSports.length} sport{currentSports.length !== 1 ? 's' : ''} · {school.member_count} members
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {(school.principal || school.athletic_director) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">School Leadership</p>
              {[
                school.principal        && { person: school.principal,        label: 'Principal' },
                school.athletic_director && { person: school.athletic_director, label: 'Athletic Director' },
              ].filter((x): x is { person: NonNullable<typeof school.principal>; label: string } => Boolean(x)).map(({ person, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
                    {person.first_name[0]}{person.last_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{person.first_name} {person.last_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {person.email}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-none">{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sports {currentYear && <span className="normal-case font-normal">· {currentYear}</span>}
            </p>
            {isLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {!isLoading && currentSports.length === 0 && (
              <p className="text-sm text-muted-foreground">No sports this year.</p>
            )}
            {currentSports.map(s => (
              <SportRow
                key={s.id}
                current={s}
                past={pastSports.filter(p => p.name === s.name)}
              />
            ))}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function SchoolCard({ school, onClick }: { school: School; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-5 flex items-start gap-4 group"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-none">
        <Building2 className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold">{school.name}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            {school.sport_count} sport{school.sport_count !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {school.member_count} members
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none mt-1" />
    </button>
  )
}

export default function Schools() {
  const [activeSchool, setActiveSchool] = useState<School | null>(null)

  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: fetchSchools,
  })

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schools</h1>
        <p className="text-sm text-muted-foreground mt-1">All schools in your district.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading schools…</span>
        </div>
      )}

      {!isLoading && schools && (
        <div className="space-y-3">
          {schools.map(school => (
            <SchoolCard key={school.id} school={school} onClick={() => setActiveSchool(school)} />
          ))}
        </div>
      )}

      {activeSchool && (
        <SchoolPanel school={activeSchool} onClose={() => setActiveSchool(null)} />
      )}
    </div>
  )
}
