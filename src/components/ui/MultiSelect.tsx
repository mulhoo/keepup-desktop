import { ChevronDown, Check } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options:    string[]
  selected:   Set<string>
  onChange:   (next: Set<string>) => void
  placeholder: string
  className?: string
}

export function MultiSelect({ options, selected, onChange, placeholder, className }: MultiSelectProps) {
  const allSelected = selected.size === 0

  function toggle(value: string) {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(next)
  }

  const label = allSelected
    ? placeholder
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} selected`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-9 w-44 items-center justify-between gap-2 rounded-full border border-input bg-background px-4 text-sm',
            'text-left ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            !allSelected && 'border-primary text-foreground',
            allSelected && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="w-3.5 h-3.5 flex-none opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 min-w-48">
        <button
          onClick={() => onChange(selected.size === options.length ? new Set() : new Set(options))}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted text-left"
        >
          <span className={cn(
            'flex h-4 w-4 flex-none items-center justify-center rounded border',
            selected.size === options.length
              ? 'bg-primary border-primary text-primary-foreground'
              : selected.size > 0
              ? 'bg-primary/30 border-primary'
              : 'border-input'
          )}>
            {selected.size === options.length && <Check className="w-2.5 h-2.5" />}
            {selected.size > 0 && selected.size < options.length && <span className="w-2 h-0.5 bg-primary rounded-full" />}
          </span>
          <span className="font-medium">Select all</span>
        </button>
        <div className="my-1 h-px bg-border" />
        {options.map(opt => {
          const checked = selected.has(opt)
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted text-left"
            >
              <span className={cn(
                'flex h-4 w-4 flex-none items-center justify-center rounded border',
                checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
              )}>
                {checked && <Check className="w-2.5 h-2.5" />}
              </span>
              {opt}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
