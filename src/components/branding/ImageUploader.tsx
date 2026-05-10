import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { presignUpload, type ResourceType } from '@/api/uploads'

interface Props {
  label: string
  hint?: string
  shape: 'square' | 'banner'
  value: string | null
  onChange: (url: string | null) => void
  resourceType?: ResourceType
  resourceId?: number
}

export default function ImageUploader({ label, hint, shape, value, onChange, resourceType, resourceId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (resourceType && resourceId != null) {
      setUploading(true)
      setError(null)
      try {
        const url = await presignUpload(resourceType, resourceId, file)
        onChange(url)
      } catch {
        setError('Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    } else {
      onChange(URL.createObjectURL(file))
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {value && !uploading && (
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
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'relative rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors overflow-hidden bg-muted/30',
          uploading ? 'cursor-wait' : 'cursor-pointer hover:border-muted-foreground/50',
          shape === 'square' ? 'w-20 h-20' : 'w-full h-28',
        )}
      >
        {uploading ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Upload className="w-4 h-4" />
            <span className="text-xs">{shape === 'square' ? 'Upload' : 'Click to upload'}</span>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
