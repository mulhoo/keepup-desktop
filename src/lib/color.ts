export interface RGB { r: number; g: number; b: number }

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
}

export function isValidHex(hex: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)
}

export const DARK_DEFAULTS: Record<string, string> = {
  color_background:      '#0F1117',
  color_surface:         '#1A1D2E',
  color_surface_variant: '#252840',
  color_border:          '#2E3250',
  color_primary:         '#06B6D4',
  color_accent:          '#0E7490',
  color_text_primary:    '#F8FAFC',
  color_text_secondary:  '#94A3B8',
  color_text_on_primary: '#0F1117',
  color_text_on_accent:  '#F8FAFC',
}

export const LIGHT_DEFAULTS: Record<string, string> = {
  color_background:      '#F8FAFC',
  color_surface:         '#FFFFFF',
  color_surface_variant: '#F1F5F9',
  color_border:          '#E2E8F0',
  color_primary:         '#0891B2',
  color_accent:          '#06B6D4',
  color_text_primary:    '#0F172A',
  color_text_secondary:  '#64748B',
  color_text_on_primary: '#FFFFFF',
  color_text_on_accent:  '#FFFFFF',
}

export const COLOR_SLOT_LABELS: Record<string, string> = {
  color_background:      'Background',
  color_surface:         'Surface',
  color_surface_variant: 'Surface Variant',
  color_border:          'Border',
  color_primary:         'Primary',
  color_accent:          'Accent',
  color_text_primary:    'Text Primary',
  color_text_secondary:  'Text Secondary',
  color_text_on_primary: 'On Primary',
  color_text_on_accent:  'On Accent',
}

export const COLOR_SLOT_KEYS = Object.keys(COLOR_SLOT_LABELS)

export function hexToHsl(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
      case gn: h = ((bn - rn) / d + 2) / 6; break
      case bn: h = ((rn - gn) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

// Maps each color slot to the CSS vars it should drive
const SLOT_TO_VARS: Record<string, string[]> = {
  color_background:      ['--background'],
  color_surface:         ['--card', '--popover'],
  color_surface_variant: ['--muted', '--secondary'],
  color_border:          ['--border', '--input'],
  color_primary:         ['--primary'],
  color_accent:          ['--accent', '--ring'],
  color_text_primary:    ['--foreground', '--card-foreground', '--popover-foreground'],
  color_text_secondary:  ['--muted-foreground', '--secondary-foreground'],
  color_text_on_primary: ['--primary-foreground'],
  color_text_on_accent:  ['--accent-foreground'],
}

export const ALL_SCHOOL_VARS = Object.values(SLOT_TO_VARS).flat()

export function applySchoolTheme(colors: Record<string, string>) {
  const root = document.documentElement
  for (const [slot, vars] of Object.entries(SLOT_TO_VARS)) {
    const hex = colors[slot]
    if (!hex) continue
    const hsl = hexToHsl(hex)
    for (const v of vars) root.style.setProperty(v, hsl)
  }
}

export function clearSchoolTheme() {
  const root = document.documentElement
  for (const v of ALL_SCHOOL_VARS) root.style.removeProperty(v)
}
