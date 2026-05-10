import { useState } from 'react'
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

type Variant = 'dark' | 'light'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ThemeEditor({ open, onClose }: Props) {
  const [variant, setVariant] = useState<Variant>('dark')
  const [name, setName]       = useState('')
  const [colors, setColors]   = useState<Record<string, string>>(DARK_DEFAULTS)

  function handleVariantChange(v: Variant) {
    setVariant(v)
    setColors(v === 'dark' ? DARK_DEFAULTS : LIGHT_DEFAULTS)
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
        </div>

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
