import { api } from './client'

export interface ThemePalette {
  color_background:      string
  color_surface:         string
  color_surface_variant: string
  color_border:          string
  color_primary:         string
  color_accent:          string
  color_text_primary:    string
  color_text_secondary:  string
  color_text_on_primary: string
  color_text_on_accent:  string
}

export interface GenerateThemeResult {
  dark:   ThemePalette
  light:  ThemePalette
  source: 'gemma' | 'fallback'
}

export const generateTheme = (school_colors: string, school_name?: string) =>
  api.post<GenerateThemeResult>('/demo/themes/generate', { school_colors, school_name })
