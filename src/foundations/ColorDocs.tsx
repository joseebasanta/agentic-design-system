import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { ColorToken } from '../tokens/color-types'
import { colorProvenance, colorTokens, formatColor, resolveColor } from '../tokens/colors'
import type { ColorModes } from '../tokens/colors'
import { allModeSelections, contrastResults, modeAxes, semanticToken } from './contrast'
import './color-docs.css'

const palette = colorTokens.filter((token) => token.layer === 'primitive')
const semantics = colorTokens.filter((token) => token.layer === 'semantic')
const intermediate = colorTokens.filter((token) => token.layer === 'reference')
const byFamily = groupTokens([...palette].sort((a, b) => palettePosition(a) - palettePosition(b)),
  (token) => token.name.slice(0, token.name.lastIndexOf('/')))
const category = (token: ColorToken) => token.collection === 'brand' ? 'primary' : token.name.split('/')[0]
const byRole = groupTokens(semantics, category)
const roles = ['primary', 'static', 'bg', 'text', 'stroke', 'icon', 'state', 'overlay', 'social']
const allContrast = allModeSelections.flatMap(contrastResults)

function groupTokens(tokens: readonly ColorToken[], groupName: (token: ColorToken) => string) {
  const groups: Record<string, ColorToken[]> = {}
  for (const token of tokens) (groups[groupName(token)] ??= []).push(token)
  return groups
}

function palettePosition(token: ColorToken) {
  return token.node ? Number(token.node.split(':')[1]) : Number.MAX_SAFE_INTEGER
}

function figmaLink(node: string) {
  const { fileKey, fileName } = colorProvenance
  return `https://www.figma.com/design/${fileKey}/${fileName}?node-id=${node.replace(':', '-')}`
}

function provenanceLink(token: ColorToken) {
  return token.node ? <a href={figmaLink(token.node)}>Figma swatch</a> : <span>Figma variable collection</span>
}

function cssVar(token: ColorToken) {
  return `var(${token.css})`
}

function Swatch({ token }: { token: ColorToken }) {
  return (
    <span className="color-docs__checker" aria-hidden="true">
      <span className="color-docs__sample" style={{ backgroundColor: cssVar(token) }} />
    </span>
  )
}

export function PaletteInventory() {
  return (
    <div className="color-docs">
      <p>{palette.length} palette colors in the sRGB color space. The hex labels round channels to eight bits. The CSS uses the exact Figma channels and opacity.</p>
      <p><a href={figmaLink(colorProvenance.frames.primitive)}>Palette frame in Figma</a></p>
      {Object.entries(byFamily).map(([family, tokens]) => (
        <section key={family}>
          <h2>{family.replaceAll('/', ' / ')}</h2>
          <ul className="color-docs__swatches">
            {tokens?.map((token) => (
              <li key={token.key}>
                <Swatch token={token} />
                <span className="color-docs__step">Step {token.name.split('/').at(-1)?.replace('alpha-', '')}</span>
                <code>{token.name}</code>
                <span>{formatColor(resolveColor(token).value)}</span>
                {provenanceLink(token)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

const guidance: Record<string, string> = {
  primary: 'Use the solid variants for brand emphasis and the alpha variants for translucent brand accents.',
  static: 'Use for dark or light artwork that stays fixed when appearance switches. The neutral selection still determines the underlying palette.',
  bg: 'Use to fill page surfaces, cards, and inverse sections.',
  text: 'Use for text hierarchy, disabled text, and text on inverse surfaces. Check the contrast of the pair.',
  stroke: 'Use for dividers and outlines. Check contrast when a border identifies a control.',
  icon: 'Use for icon hierarchy and inverse or disabled icons. Check contrast for meaningful icons.',
  state: 'Use each state family to convey its named status. The contrast examples evaluate the dark variant over the lighter variant.',
  overlay: 'Use for scrims over content. The resulting color depends on the surface behind it.',
  social: 'Use the color for the named brand mark.',
}

function intendedUse(token: ColorToken) {
  if (token.layer === 'reference') return 'Neutral scale step for the selected palette.'
  const [role, variant, shade] = token.name.split('/')
  if (role === 'state') return `${shade} color for the ${variant} status.`
  if (role === 'overlay') return 'Gray scrim over content.'
  if (role === 'social') return `Brand mark for ${variant}.`
  if (role === 'static') return `Fixed ${variant.replace('static-', '')} across Light and Dark.`
  if (token.collection === 'brand') {
    if (token.name.startsWith('primary-alpha-')) return 'Translucent brand tint.'
    return `${token.name.replace('primary-', '')} brand accent.`
  }
  const purpose = variant.replace(/-\d+$/, '')
  const subject = ({ bg: 'surface', text: 'text', stroke: 'border', icon: 'icon' })[role as 'bg' | 'text' | 'stroke' | 'icon']
  return purpose === 'white' && role !== 'bg' ? `Inverse ${subject}.` : `${purpose} ${subject}.`
}

type ContrastResult = ReturnType<typeof contrastResults>[number]

function Preview({ token, contrast }: { token: ColorToken; contrast: readonly ContrastResult[] }) {
  const role = category(token)
  const color = cssVar(token)
  const white = cssVar(semanticToken('bg/white-0'))
  const inverse = cssVar(semanticToken('bg/strong-950'))
  const inverseForeground = token.name.endsWith('/white-0')
  const backgroundColor = inverseForeground ? inverse : white

  if (role === 'icon' || role === 'stroke') {
    const style: CSSProperties = role === 'icon' ? { color } : { borderColor: color }
    return (
      <span className="color-docs__preview" style={{ backgroundColor }} aria-hidden="true">
        {role === 'icon'
          ? <span style={style}>◆</span>
          : <span className="color-docs__outline" style={style} />}
      </span>
    )
  }
  if (role === 'text') {
    const pair = contrast.find((result) => result.foreground === token.name)
    if (!pair || !pair.passes) return <Swatch token={token} />
    return <span className="color-docs__preview" style={{ backgroundColor, color }}>Text sample</span>
  }
  if (role === 'bg') {
    return <span className="color-docs__preview color-docs__surface" style={{ backgroundColor: color }} aria-hidden="true" />
  }
  if (role === 'state') {
    const pair = contrast.find((result) => result.foreground === token.name && result.passes)
    if (pair) return (
      <span className="color-docs__preview" style={{ backgroundColor: white }}>
        <span className="color-docs__preview" style={{ backgroundColor: cssVar(semanticToken(pair.background)), color }}>
          {token.name.split('/')[1]}
        </span>
      </span>
    )
  }
  return <Swatch token={token} />
}

function formatChain(token: ColorToken) {
  return token.layer === 'reference' ? `02-Neutral / ${token.name}` : token.name
}

function SemanticRows({ tokens, modes, contrast }: {
  tokens: readonly ColorToken[]
  modes: ColorModes
  contrast: readonly ContrastResult[]
}) {
  return (
    <div className="color-docs__table-scroll">
      <table>
        <thead><tr><th scope="col">Token</th><th scope="col">Use (inferred)</th><th scope="col">Reference chain</th><th scope="col">Resolved value</th><th scope="col">Preview</th></tr></thead>
        <tbody>
          {tokens.map((token) => {
            const { value, chain } = resolveColor(token, modes)
            return (
              <tr key={token.key}>
                <th scope="row">
                  <code>{token.name}</code><br />
                  <small>{provenanceLink(token)}</small>
                  {token.description && <div>Figma description: {token.description}</div>}
                </th>
                <td>{intendedUse(token)}</td>
                <td>{chain.length ? chain.map(formatChain).join(' → ') : 'Direct Figma value'}</td>
                <td>{formatColor(value)}</td>
                <td><Preview token={token} contrast={contrast} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ContrastAudit({ current }: { current: readonly ContrastResult[] }) {
  const failures = allContrast.filter((result) => !result.passes)
  return (
    <section className="color-docs__audit">
      <h2>Contrast audit</h2>
      <p>{failures.length} of {allContrast.length} checks fall below WCAG AA across {allModeSelections.length} combinations. The table updates with the selected modes and includes all checked pairs.</p>
      <p>Normal text uses 4.5:1. The large heading sample assumes at least 24 CSS px and uses 3:1. Icons and borders use 3:1 when they convey information or identify controls. For transparency, each background is composited over <code>bg/white-0</code>, then the foreground over that result. Disabled controls and palette swatches are outside this audit.</p>
      <p><a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html">WCAG text contrast</a> · <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html">WCAG non-text contrast</a></p>
      <div className="color-docs__table-scroll">
        <table>
          <thead><tr><th scope="col">Example</th><th scope="col">Foreground / background</th><th scope="col">Ratio</th><th scope="col">AA target</th><th scope="col">Result</th></tr></thead>
          <tbody>{current.map((result) => (
            <tr key={result.label}>
              <th scope="row">{result.label}</th>
              <td><code>{result.foreground}</code> / <code>{result.background}</code></td>
              <td>{result.ratio.toFixed(2)}:1</td>
              <td>{result.minimum}:1</td>
              <td>{result.passes ? 'Pass' : 'Below AA'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  )
}

export function SemanticInventory() {
  const [modes, setModes] = useState<ColorModes>({})
  const attributes = Object.fromEntries(modeAxes.map(([key, collection]) => [
    collection.attribute,
    collection.modes.find((mode) => mode.id === (modes[key] ?? collection.default))?.key,
  ]))
  const brand = semanticToken('primary-base')
  const brandForeground = semanticToken('static/static-white')
  const contrast = contrastResults(modes)
  const brandPasses = contrast.find((pair) => pair.foreground === brandForeground.name)?.passes

  return (
    <div className="color-docs" data-color-scope="" {...attributes}>
      <p>{semantics.length} semantic colors. Select Figma modes to update both the values and the rendered previews. Mode controls apply to this documentation preview.</p>
      <p><a href={figmaLink(colorProvenance.frames.semantic)}>Token System frame in Figma</a></p>
      <fieldset className="color-docs__controls">
        <legend>Figma modes</legend>
        {modeAxes.map(([key, collection]) => (
          <label key={key}>
            {collection.label}
            <select value={modes[key] ?? collection.default} onChange={(event) =>
              setModes({ ...modes, [key]: event.target.value })}>
              {collection.modes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
            </select>
          </label>
        ))}
      </fieldset>
      <div className="color-docs__example bg-ads-bg-white-0 text-ads-text-strong-950 border-ads-stroke-sub-300">
        <strong>Surface and brand preview</strong>
        <span className="text-ads-text-sub-600">Supporting text on the main surface</span>
        {brandPasses
          ? <span className="color-docs__preview" style={{ backgroundColor: cssVar(brand), color: cssVar(brandForeground) }}>Brand label</span>
          : <span><Swatch token={brand} /> White label on primary is below AA in this mode.</span>}
      </div>
      {roles.filter((role) => byRole[role]?.length).map((role) => {
        const source = colorProvenance.groupDescriptions[role]
        return (
          <section key={role}>
            <h2>{({ bg: 'Background', state: 'State' } as Record<string, string>)[role] ?? role[0].toUpperCase() + role.slice(1)}</h2>
            {source && <p>{source.description} <a href={figmaLink(source.node)}>Figma description</a></p>}
            <p><strong>Usage guidance (inferred)</strong> {guidance[role]}</p>
            <SemanticRows tokens={byRole[role] ?? []} modes={modes} contrast={contrast} />
          </section>
        )
      })}
      <details>
        <summary>Neutral alias layer ({intermediate.length} variables)</summary>
        <SemanticRows tokens={intermediate} modes={modes} contrast={contrast} />
      </details>
      <ContrastAudit current={contrast} />
      <details>
        <summary>Figma labels and swatch discrepancies</summary>
        <ul>
          {colorProvenance.discrepancies.map((issue) => (
            <li key={issue.node}>
              <a href={figmaLink(issue.node)}>{issue.context} swatch</a>
              {' '} labeled <code>{issue.label}</code> is bound to <code>{issue.bound}</code>.
              {issue.token && <> The <code>{issue.token}</code> variable references <code>{issue.actual?.match(/^\d+$/) ? `02-Neutral / ${issue.actual}` : issue.actual}</code> in this mode.</>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
