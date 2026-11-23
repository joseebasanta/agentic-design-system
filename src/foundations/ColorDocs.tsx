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
const roles = ['primary', 'static', 'bg', 'text', 'stroke', 'icon', 'state', 'illustration', 'overlay', 'social']
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
      <p>{palette.length} sRGB colors in 06-Foundations, which has one mode. The hex labels round channels to eight bits. The CSS uses the exact Figma channels and opacity.</p>
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
  state: 'Use the named status family. The Figma badges use the base color over the lighter background, while lighter alerts use strong text. Check the contrast before choosing a label color.',
  illustration: 'Use for neutral illustration fills. These variables reference Gray directly in both appearance modes.',
  overlay: 'Use for scrims over content. The resulting color depends on the surface behind it.',
  social: 'Use the color for the named brand mark.',
}

function intendedUse(token: ColorToken) {
  if (token.layer === 'reference') return 'Neutral scale step for the selected palette.'
  const [role, variant, shade] = token.name.split('/')
  if (role === 'state') return `${shade} color for the ${variant} status.`
  if (role === 'overlay') return `${variant.replace('overlay-', '')} scrim over content.`
  if (role === 'social') return `Brand mark for ${variant}.`
  if (role === 'static') return `Fixed ${variant.replace('static-', '')} across Light and Dark.`
  if (token.collection === 'brand') {
    if (token.name.startsWith('primary-alpha-')) return 'Translucent brand tint.'
    return `${token.name.replace('primary-', '')} brand accent.`
  }
  const purpose = variant.replace(/-\d+$/, '')
  const subject = ({ bg: 'surface', text: 'text', stroke: 'border', icon: 'icon', illustration: 'illustration fill' })[role as 'bg' | 'text' | 'stroke' | 'icon' | 'illustration']
  return purpose === 'white' && role !== 'bg' ? `Inverse ${subject}.` : `${purpose} ${subject}.`
}

type ContrastResult = ReturnType<typeof contrastResults>[number]

function Preview({ token }: { token: ColorToken }) {
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
  if (role === 'bg' || role === 'illustration') {
    return <span className="color-docs__preview color-docs__surface" style={{ backgroundColor: color }} aria-hidden="true" />
  }
  if (role === 'overlay') {
    return (
      <span className="color-docs__preview color-docs__surface" style={{ backgroundColor: white }} aria-hidden="true">
        <span className="color-docs__outline" style={{ backgroundColor: color, border: 0 }} />
      </span>
    )
  }
  return <Swatch token={token} />
}

function formatChain(token: ColorToken) {
  return token.layer === 'reference' ? `02-Neutral / ${token.name}` : token.name
}

function SemanticRows({ tokens, modes }: {
  tokens: readonly ColorToken[]
  modes: ColorModes
}) {
  const collectionKey = tokens[0].collection
  const collection = colorProvenance.collections[collectionKey]

  return (
    <div className="color-docs__table-scroll">
      <table>
        <thead><tr>
          <th scope="col">Token</th><th scope="col">Use</th>
          {collection.modes.map((mode) => <th key={mode.id} scope="col">{mode.name}</th>)}
          <th scope="col">Selected preview</th>
        </tr></thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.key}>
              <th scope="row">
                <code>{token.name}</code><br />
                <small>{provenanceLink(token)}</small>
                {token.description && <div>{token.description}</div>}
              </th>
              <td>{intendedUse(token)}</td>
              {collection.modes.map((mode) => {
                const { value, chain } = resolveColor(token, { ...modes, [collectionKey]: mode.id })
                return (
                  <td key={mode.id}>
                    <strong>{formatColor(value)}</strong>
                    <small className="color-docs__chain">{chain.length ? chain.map(formatChain).join(' → ') : 'Direct value'}</small>
                  </td>
                )
              })}
              <td><Preview token={token} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PairPreview({ pair }: { pair: ContrastResult }) {
  const color = cssVar(semanticToken(pair.foreground))
  const backgroundColor = cssVar(semanticToken(pair.background))
  const isIcon = pair.foreground.startsWith('icon/')
  const isStroke = pair.foreground.startsWith('stroke/')
  return (
    <span className="color-docs__pair-surface bg-ads-bg-white-0">
      <span className="color-docs__preview" style={{ backgroundColor, color }} aria-hidden="true">
        {isStroke ? <span className="color-docs__outline" /> : isIcon || !pair.passes
          ? <span className="color-docs__dot" />
          : <span style={pair.minimum === 3 ? { fontSize: '24px' } : undefined}>Aa</span>}
      </span>
    </span>
  )
}

function ContrastAudit({ current }: { current: readonly ContrastResult[] }) {
  const failures = allContrast.filter((result) => !result.passes)
  return (
    <section className="color-docs__audit">
      <h2>Contrast audit</h2>
      <p>{failures.length} of {allContrast.length} checks fall below WCAG AA across {allModeSelections.length} combinations. The table shows the selected combination. Rows with a Figma link use a verified binding. The other rows evaluate candidate pairings.</p>
      <p>Normal text uses 4.5:1. The large heading sample assumes at least 24 CSS px and uses 3:1. Icons and borders use 3:1 when they convey information or identify controls. For transparency, each background is composited over <code>bg/white-0</code>, then the foreground over that result. Disabled controls and palette swatches are outside this audit.</p>
      <p><a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html">WCAG text contrast</a> · <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html">WCAG non-text contrast</a></p>
      <div className="color-docs__table-scroll">
        <table>
          <thead><tr><th scope="col">Example</th><th scope="col">Foreground / background</th><th scope="col">Sample</th><th scope="col">Ratio</th><th scope="col">AA target</th><th scope="col">Result</th></tr></thead>
          <tbody>{current.map((result) => (
            <tr key={result.label}>
              <th scope="row">{result.label}{result.source && <small className="color-docs__chain"><a href={figmaLink(result.source)}>Figma example</a></small>}</th>
              <td><code>{result.foreground}</code> / <code>{result.background}</code></td>
              <td><PairPreview pair={result} /></td>
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
  const contrast = contrastResults(modes)

  return (
    <div className="color-docs" data-color-scope="" {...attributes}>
      <p>{semantics.length} semantic colors. Pick a neutral palette to resolve the Light and Dark columns. The swatches and contrast audit follow the selected appearance, brand, and neutral palette.</p>
      <fieldset className="color-docs__controls">
        <legend>Figma modes</legend>
        {modeAxes.map(([key, collection]) => (
          <label key={key}>
            {collection.label}
            <select value={modes[key] ?? collection.default} onChange={(event) => {
              const mode = event.target.value
              setModes((previous) => ({ ...previous, [key]: mode }))
            }}>
              {collection.modes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
            </select>
          </label>
        ))}
      </fieldset>
      <div className="color-docs__example bg-ads-bg-white-0 text-ads-text-strong-950 border-ads-stroke-sub-300">
        <strong>Main surface</strong>
        <span className="text-ads-text-sub-600">Supporting text</span>
        <span className="color-docs__brand bg-ads-primary-base" aria-hidden="true" />
      </div>
      <ContrastAudit current={contrast} />
      {roles.filter((role) => byRole[role]?.length).map((role) => {
        const source = colorProvenance.groupDescriptions[role]
        return (
          <section key={role}>
            <h2>{({ bg: 'Background', state: 'State' } as Record<string, string>)[role] ?? role[0].toUpperCase() + role.slice(1)}</h2>
            {source && <p>{source.description} <a href={figmaLink(source.node)}>Figma description</a></p>}
            <p>{guidance[role]}</p>
            <SemanticRows tokens={byRole[role]} modes={modes} />
          </section>
        )
      })}
      <details>
        <summary>Neutral alias layer ({intermediate.length} variables)</summary>
        <SemanticRows tokens={intermediate} modes={modes} />
      </details>
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
