import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthNavProps {
  label:   string
  onPrev:  () => void
  onNext:  () => void
}

export function MonthNav({ label, onPrev, onNext }: MonthNavProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onPrev}
        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium min-w-[148px] text-center">{label}</span>
      <button
        onClick={onNext}
        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
