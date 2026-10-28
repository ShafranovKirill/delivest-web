import { palette, updatePrimaryPalette } from '@primeuix/themes'
import { darkAccent, darkFill } from './brandTones'

const DARK_STYLE_ID = 'brand-dark-palette'

type Scale = Record<number, string>

function darkOverrides(color: string): string {
  const accent = darkAccent(color)
  const fill = darkFill(color)

  return `:root.dark {
  --color-primary: ${accent};
  --color-primary-strong: color-mix(in srgb, ${accent} 80%, white);
  --color-primary-soft: color-mix(in srgb, ${accent} 18%, transparent);
  --color-primary-fill: ${fill};
  --p-primary-500: ${accent};
  --p-primary-600: ${accent};
  --p-primary-700: color-mix(in srgb, ${accent} 80%, white);
  --p-primary-800: color-mix(in srgb, ${accent} 60%, white);
  --p-primary-color: ${fill};
  --p-primary-hover-color: color-mix(in srgb, ${fill} 88%, white);
  --p-primary-active-color: color-mix(in srgb, ${fill} 80%, white);
  --p-primary-contrast-color: #ffffff;
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

export function applyBrandColor(color: string, darkColor: string | null) {
  updatePrimaryPalette(palette(color) as Scale)
  darkStyleElement().textContent = darkOverrides(darkColor ?? color)
}
