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
