import type { MemberRole, SportDetail } from '@/api/sports'
import { cn } from '@/lib/utils'

export const SEASONS = ['fall', 'winter', 'spring'] as const

export const SEASON_LABEL: Record<string, string> = {
  fall: 'Fall', winter: 'Winter', spring: 'Spring',
}

export const SEASON_COLOR: Record<string, string> = {
  fall:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  winter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  spring: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export const ROLE_LABEL_PLURAL: Record<MemberRole, string> = {
  head_coach:      'Head Coaches',
  assistant_coach: 'Asst. Coaches',
  student_captain: 'Captains',
  student:         'Athletes',
}

export const ROLE_ORDER: MemberRole[] = ['head_coach', 'assistant_coach', 'student_captain', 'student']

export function Avatar({ first, last }: { first: string; last: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-none">
      {first[0]}{last[0]}
    </div>
  )
}

export function SeasonBadge({ season }: { season: string }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex-none', SEASON_COLOR[season])}>
      {SEASON_LABEL[season]}
    </span>
  )
}

export function MemberGroup({ role, members }: { role: MemberRole; members: SportDetail['members'] }) {
  const inRole = members.filter(m => m.role === role)
  if (inRole.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {ROLE_LABEL_PLURAL[role]}{inRole.length > 1 ? ` (${inRole.length})` : ''}
      </p>
      {inRole.map(m => (
        <div key={m.user_id} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors', m.graduated && 'opacity-60')}>
          <Avatar first={m.first_name} last={m.last_name} />
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
}
