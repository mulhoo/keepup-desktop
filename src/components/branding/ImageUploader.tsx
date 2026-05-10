import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  hint?: string
  shape: 'square' | 'banner'
  value: string | null
  onChange: (url: string | null) => void
}

export default function ImageUploader({ label, hint, shape, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onChange(URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors overflow-hidden bg-muted/30',
          shape === 'square' ? 'w-20 h-20' : 'w-full h-28',
        )}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Upload className="w-4 h-4" />
            <span className="text-xs">{shape === 'square' ? 'Upload' : 'Click to upload'}</span>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
