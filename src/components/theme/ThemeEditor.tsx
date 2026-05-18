import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { DARK_DEFAULTS, LIGHT_DEFAULTS, COLOR_SLOT_LABELS, COLOR_SLOT_KEYS } from '@/lib/color'
import ColorSlot from './ColorSlot'
import ThemePreview from './ThemePreview'
import { generateTheme, type GenerateThemeResult } from '@/api/themes'

type Variant = 'dark' | 'light'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ThemeEditor({ open, onClose }: Props) {
  const [variant, setVariant] = useState<Variant>('dark')
  const [name, setName]       = useState('')
  const [colors, setColors]   = useState<Record<string, string>>(DARK_DEFAULTS)
  const [schoolColors,  setSchoolColors]  = useState('')
  const [generated,     setGenerated]     = useState<GenerateThemeResult | null>(null)
  const [generateOpen,  setGenerateOpen]  = useState(false)

  const { mutate: doGenerate, isPending: generating, error: generateError } = useMutation({
    mutationFn: () => generateTheme(schoolColors),
    onSuccess: (result) => {
      setGenerated(result)
      // Apply the current variant's palette immediately
      setColors(variant === 'dark' ? result.dark as unknown as Record<string,string> : result.light as unknown as Record<string,string>)
    },
  })

  function handleVariantChange(v: Variant) {
    setVariant(v)
    if (generated) {
      setColors(v === 'dark' ? generated.dark as unknown as Record<string,string> : generated.light as unknown as Record<string,string>)
    } else {
      setColors(v === 'dark' ? DARK_DEFAULTS : LIGHT_DEFAULTS)
    }
  }

  function handleColorChange(slot: string, hex: string) {
    setColors(prev => ({ ...prev, [slot]: hex }))
  }

  function handleSave() {
    // TODO: POST to /themes or GraphQL mutation
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="w-[880px] max-w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-none">
          <DialogTitle>School Theme</DialogTitle>
          <DialogDescription>
            Customize your school's colors for the mobile app. You can set one dark theme and one light theme.
          </DialogDescription>
        </DialogHeader>

        {/* Name + variant row */}
        <div className="px-6 py-4 border-b flex-none flex items-end gap-6">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="theme-name">Theme name</Label>
            <Input
              id="theme-name"
              placeholder={variant === 'dark' ? 'e.g. Kangs Dark' : 'e.g. Kangs Light'}
              value={name}
              onChange={e => setName(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Variant</Label>
            <div className="flex rounded-md border p-0.5 gap-0.5">
              {(['dark', 'light'] as Variant[]).map(v => (
                <button
                  key={v}
                  onClick={() => handleVariantChange(v)}
                  className={cn(
                    'px-4 py-1.5 rounded text-sm font-medium capitalize transition-colors',
                    variant === v
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setGenerateOpen(v => !v)}
            title="Generate with Gemma"
            className={cn(
              'w-9 h-9 rounded-lg border flex items-center justify-center transition-colors mb-0.5',
              generateOpen
                ? 'bg-violet-100 border-violet-300 text-violet-600 dark:bg-violet-950/40 dark:border-violet-700 dark:text-violet-400'
                : 'bg-background border-border text-muted-foreground hover:text-violet-500 hover:border-violet-300',
            )}
          >
            {generating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Sparkles className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Gemma generation panel — revealed by sparkle icon */}
        {generateOpen && (
          <div className="px-6 py-4 border-b flex-none bg-violet-50/60 dark:bg-violet-950/20">
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder='Describe your school colors, e.g. "purple and white"'
                value={schoolColors}
                onChange={e => setSchoolColors(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && schoolColors.trim() && !generating) doGenerate() }}
                className="flex-1 text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-violet-400/40 placeholder:text-muted-foreground"
              />
              <button
                onClick={() => doGenerate()}
                disabled={!schoolColors.trim() || generating}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {generating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
                  : <><Sparkles className="w-3.5 h-3.5" />Generate</>
                }
              </button>
            </div>
            {generated && (
              <div className={cn(
                'mt-3 rounded-lg px-3 py-2.5 flex items-center gap-3',
                generated.source === 'gemma'
                  ? 'bg-pink-50 border border-pink-200 dark:bg-pink-950/30 dark:border-pink-800'
                  : 'bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
              )}>
                <Sparkles className={cn(
                  'w-4 h-4 flex-none',
                  generated.source === 'gemma' ? 'text-pink-500' : 'text-blue-400',
                )} />
                <div>
                  <p className={cn(
                    'text-xs font-semibold',
                    generated.source === 'gemma' ? 'text-pink-700 dark:text-pink-400' : 'text-blue-700 dark:text-blue-400',
                  )}>
                    {generated.source === 'gemma' ? 'Generated by Gemma 4' : 'Generated by color matching'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {generated.source === 'gemma'
                      ? 'AI-designed palette — switch variant to preview both.'
                      : 'Gemma unavailable — colors derived from your input. Switch variant to preview both.'}
                  </p>
                </div>
              </div>
            )}
            {generateError && (
              <p className="text-xs text-destructive mt-2">Generation failed. Please try again.</p>
            )}
          </div>
        )}

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Color slots */}
          <div className="w-72 flex-none border-r px-6 py-4 overflow-y-auto space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color slots</p>
            {COLOR_SLOT_KEYS.map(slot => (
              <ColorSlot
                key={slot}
                label={COLOR_SLOT_LABELS[slot]}
                value={colors[slot]}
                onChange={hex => handleColorChange(slot, hex)}
              />
            ))}
          </div>

          {/* Preview */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Preview</p>
            <ThemePreview colors={colors} />
          </div>
        </div>

        <DialogFooter className="border-t flex-none">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save theme</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
