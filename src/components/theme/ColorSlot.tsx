import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { hexToRgb, rgbToHex, isValidHex, type RGB } from '@/lib/color'

interface Props {
  label: string
  value: string
  onChange: (hex: string) => void
}

export default function ColorSlot({ label, value, onChange }: Props) {
  const [hexInput, setHexInput]   = useState(value)
  const [rgb, setRgb]             = useState<RGB>(() => hexToRgb(value))

  useEffect(() => {
    setHexInput(value)
    setRgb(hexToRgb(value))
  }, [value])

  function handlePickerChange(hex: string) {
    onChange(hex)
  }

  function handleHexInput(raw: string) {
    setHexInput(raw)
    const normalised = raw.startsWith('#') ? raw : `#${raw}`
    if (isValidHex(normalised)) onChange(normalised)
  }

  function handleRgbChannel(channel: keyof RGB, raw: string) {
    const n = parseInt(raw, 10)
    const next = { ...rgb, [channel]: isNaN(n) ? 0 : n }
    setRgb(next)
    onChange(rgbToHex(next))
  }

  return (
    <div className="flex items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="w-7 h-7 rounded-full border-2 border-border shadow-sm flex-none transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            style={{ background: value }}
            aria-label={`Pick color for ${label}`}
          />
        </PopoverTrigger>
        <PopoverContent className="p-3 w-auto space-y-3">
          <HexColorPicker color={value} onChange={handlePickerChange} />

          {/* HEX input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">HEX</span>
            <input
              className="flex-1 rounded border bg-transparent px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              value={hexInput}
              onChange={e => handleHexInput(e.target.value)}
              spellCheck={false}
              maxLength={7}
            />
          </div>

          {/* RGB inputs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">RGB</span>
            <div className="flex gap-1.5 flex-1">
              {(['r', 'g', 'b'] as const).map(ch => (
                <div key={ch} className="flex-1 text-center">
                  <input
                    className="w-full rounded border bg-transparent px-1 py-1 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    value={rgb[ch]}
                    onChange={e => handleRgbChannel(ch, e.target.value)}
                    min={0}
                    max={255}
                    type="number"
                  />
                  <span className="text-[10px] text-muted-foreground uppercase">{ch}</span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-sm flex-1">{label}</span>
      <span className="text-xs font-mono text-muted-foreground">{value.toUpperCase()}</span>
    </div>
  )
}
