import { contrast, withLightness } from './colorMath'

const DARK_SURFACE = '#17171b'
const WHITE = '#ffffff'
const TEXT_CONTRAST = 4.5
const SHAPE_CONTRAST = 3
const STEPS = 20

type Passes = (color: string) => boolean

const readableOnSurface: Passes = (color) => contrast(color, DARK_SURFACE) >= TEXT_CONTRAST
const visibleOnSurface: Passes = (color) => contrast(color, DARK_SURFACE) >= SHAPE_CONTRAST
const holdsWhiteText: Passes = (color) => contrast(WHITE, color) >= TEXT_CONTRAST

function darkestPassing(color: string, passes: Passes): string {
  let [low, high] = [0, 1]
  for (let step = 0; step < STEPS; step++) {
    const middle = (low + high) / 2
    if (passes(withLightness(color, middle))) high = middle
    else low = middle
  }
  return withLightness(color, high)
}

function lightestPassing(color: string, passes: Passes): string {
  let [low, high] = [0, 1]
  for (let step = 0; step < STEPS; step++) {
    const middle = (low + high) / 2
    if (passes(withLightness(color, middle))) low = middle
    else high = middle
  }
  return withLightness(color, low)
}

export function darkAccent(color: string): string {
  return readableOnSurface(color) ? color : darkestPassing(color, readableOnSurface)
}

export function darkFill(color: string): string {
  return holdsWhiteText(color) && visibleOnSurface(color)
    ? color
    : lightestPassing(color, holdsWhiteText)
}
