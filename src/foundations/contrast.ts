import type { ColorValue } from '../tokens/color-types'
import { colorProvenance, colorTokens, colorTokensByKey, resolveColor } from '../tokens/colors'
import type { ColorModes } from '../tokens/colors'

interface Pair {
  label: string
  foreground: string
  background: string
  minimum: number
}

const white = 'bg/white-0'
const strong = 'bg/strong-950'
const normal = [
  { label: 'Strong text on the main surface', foreground: 'text/strong-950', background: white },
  { label: 'Supporting text on the main surface', foreground: 'text/sub-600', background: white },
  { label: 'Soft text on the main surface', foreground: 'text/soft-400', background: white },
  { label: 'Inverse text on an inverse surface', foreground: 'text/white-0', background: strong },
  { label: 'White label on primary', foreground: 'static/static-white', background: 'primary-base' },
  { label: 'Strong text over a brand tint', foreground: 'text/strong-950', background: 'primary-alpha-16' },
  ...colorTokens.filter((token) => token.layer === 'semantic' &&
    token.name.startsWith('state/') && token.name.endsWith('/dark')).map((token) => ({
    label: token.name.split('/')[1] + ' status label on its lighter background',
    foreground: token.name,
    background: token.name.replace(/\/dark$/, '/lighter'),
  })),
]

export const contrastPairs: readonly Pair[] = [
  ...normal.map((pair) => ({ ...pair, minimum: 4.5 })),
  { label: 'Large primary heading on the main surface', foreground: 'primary-base', background: white, minimum: 3 },
  { label: 'Soft icon on the main surface', foreground: 'icon/soft-400', background: white, minimum: 3 },
  { label: 'Soft border on the main surface', foreground: 'stroke/soft-200', background: white, minimum: 3 },
]

type RGB = ColorValue['components']

function composite(color: ColorValue, background: RGB): RGB {
  const [r, g, b] = color.components.map((channel, i) =>
    channel * color.alpha + background[i] * (1 - color.alpha))
  return [r, g, b]
}

function luminance(rgb: RGB) {
  const [r, g, b] = rgb.map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function semanticToken(name: string) {
  const token = colorTokensByKey.get('semantic.' + name.replaceAll('/', '.'))
  if (!token) throw new Error(`Unknown semantic color: ${name}`)
  return token
}

export function contrastResults(modes: ColorModes) {
  const surface = resolveColor(semanticToken(white), modes).value
  return contrastPairs.map((pair) => {
    const fg = resolveColor(semanticToken(pair.foreground), modes).value
    const bg = resolveColor(semanticToken(pair.background), modes).value
    const background = composite(bg, surface.components)
    const foreground = composite(fg, background)
    const [a, b] = [luminance(foreground), luminance(background)]
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    return { ...pair, ratio, passes: ratio >= pair.minimum }
  })
}

export const modeAxes = Object.entries(colorProvenance.collections)
  .filter(([, collection]) => collection.attribute)

export const allModeSelections = modeAxes.reduce<ColorModes[]>((all, [key, collection]) =>
  all.flatMap((modes) => collection.modes.map((mode) => ({ ...modes, [key]: mode.id }))), [{}])
