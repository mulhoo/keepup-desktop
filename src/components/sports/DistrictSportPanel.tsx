import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, ChevronRight, Users, Loader2 } from 'lucide-react'
import { fetchSportDetail, type Sport } from '@/api/sports'
import { type School } from '@/api/schools'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ROLE_LABEL_PLURAL, ROLE_ORDER, SEASON_LABEL } from './SportBadges'
import { cn } from '@/lib/utils'


function SchoolRosterDialog({ sport, onClose }: { sport: Sport; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sport', sport.id],
    queryFn:  () => fetchSportDetail(sport.id),
  })

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="w-[480px] max-w-[95vw] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle>{sport.school_name}</DialogTitle>
          <DialogDescription>
            {sport.name} · {SEASON_LABEL[sport.season]} · {sport.school_year} · {sport.athlete_count} athletes
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


function SchoolSportCard({ sport, school, onClick }: { sport: Sport; school?: School; onClick: () => void }) {
  const headCoach = sport.coaches.find(c => c.role === 'head_coach')
  const ad        = school?.athletic_director
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4 space-y-3 group"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{sport.school_name}</p>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-none" />
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {ad && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground/70 w-24 flex-none">AD</span>
            <span>{ad.first_name} {ad.last_name}</span>
          </div>
        )}
        {headCoach && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground/70 w-24 flex-none">Head Coach</span>
            <span>{headCoach.first_name} {headCoach.last_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground/70 w-24 flex-none">Athletes</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{sport.athlete_count}</span>
        </div>
      </div>
    </button>
  )
}


interface DistrictSportPanelProps {
  sportName:             string
  season:                string
  instances:             Sport[]
  schools:               School[]
  showYear?:             string
  onClose:               () => void
}

export function DistrictSportPanel({ sportName, season, instances, schools, showYear, onClose }: DistrictSportPanelProps) {
  const [rosterSport, setRosterSport] = useState<Sport | null>(null)
  const schoolMap      = Object.fromEntries(schools.map(s => [s.id, s]))
  const totalAthletes  = instances.reduce((sum, s) => sum + s.athlete_count, 0)
  const representative = instances[0]

  return (
    <>
      <Sheet open onOpenChange={v => { if (!v) onClose() }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary flex-none" />
              {sportName}
            </SheetTitle>
            <SheetDescription>
              {showYear ? `${showYear} · ` : ''}{SEASON_LABEL[season]} · {instances.length} school{instances.length !== 1 ? 's' : ''} · {totalAthletes} athletes
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="space-y-3">
              {instances.map(sport => (
                <SchoolSportCard
                  key={sport.id}
                  sport={sport}
                  school={schoolMap[sport.school_id]}
                  onClick={() => setRosterSport(sport)}
                />
              ))}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {rosterSport && (
        <SchoolRosterDialog sport={rosterSport} onClose={() => setRosterSport(null)} />
      )}
    </>
  )
}
