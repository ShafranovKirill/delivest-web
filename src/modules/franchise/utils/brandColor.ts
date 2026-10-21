import { palette, updatePrimaryPalette } from '@primeuix/themes'

const DARK_STYLE_ID = 'brand-dark-palette'

type Scale = Record<number, string>

function darkOverrides(scale: Scale): string {
  return `html.dark {
  --p-primary-500: ${scale[400]};
  --p-primary-600: ${scale[400]};
  --p-primary-700: ${scale[300]};
  --p-primary-800: ${scale[200]};
}`
}

function darkStyleElement(): HTMLStyleElement {
  const existing = document.getElementById(DARK_STYLE_ID)
  if (existing instanceof HTMLStyleElement) return existing

  const element = document.createElement('style')
  element.id = DARK_STYLE_ID
  document.head.appendChild(element)
  return element
}

export function applyBrandColor(color: string) {
  const scale = palette(color) as Scale
  updatePrimaryPalette(scale)
  darkStyleElement().textContent = darkOverrides(scale)
}
