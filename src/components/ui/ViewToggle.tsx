import { List, Grid3X3, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'week' | 'grid'

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { mode: ViewMode; icon: React.ReactNode; title: string }[] = [
    { mode: 'list', icon: <List className="w-4 h-4" />,         title: 'List view'  },
    { mode: 'week', icon: <CalendarDays className="w-4 h-4" />, title: 'Week view'  },
    { mode: 'grid', icon: <Grid3X3 className="w-4 h-4" />,      title: 'Month view' },
  ]

  return (
    <div className="flex items-center border rounded-md overflow-hidden">
      {options.map(({ mode, icon, title }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          title={title}
          className={cn(
            'w-8 h-8 flex items-center justify-center transition-colors',
            value === mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
