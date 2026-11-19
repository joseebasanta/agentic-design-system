import type { ColorToken, ColorValue } from './color-types'
import { colorProvenance, colorTokens } from './colors.generated'

export { colorProvenance, colorTokens }

export const colorTokensByKey = new Map(colorTokens.map((token) => [token.key, token]))

export type ColorModes = Readonly<Record<string, string>>

export function resolveColor(token: ColorToken, modes: ColorModes = {}) {
  const chain: ColorToken[] = []
  let current = token
  for (;;) {
    const collection = colorProvenance.collections[current.collection]
    const value = current.values[modes[current.collection] ?? collection.default]
    if (typeof value !== 'string') return { value, chain }
    // The generator validates the full graph for each mode combination.
    current = colorTokensByKey.get(value.slice(1, -1))!
    chain.push(current)
  }
}

export function formatHex({ components }: ColorValue) {
  return '#' + components.map((channel) =>
    Math.round(channel * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function formatColor(value: ColorValue) {
  const alpha = Math.round(value.alpha * 10_000) / 100
  return value.alpha === 1 ? formatHex(value) : `${formatHex(value)} at ${alpha}%`
}
