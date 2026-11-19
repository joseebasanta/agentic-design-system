import { readFileSync, writeFileSync } from 'node:fs'

const source = new URL('../tokens/colors.tokens.json', import.meta.url)
const extension = 'design.agentic.figma'
const document = JSON.parse(readFileSync(source, 'utf8'))
const provenance = document.$extensions[extension]
const { collections } = provenance
const tokens = new Map()
const cssNames = new Set()
const figmaIds = new Set()

function slug(name) {
  return name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function collect(group, segments) {
  for (const [name, entry] of Object.entries(group)) {
    if (name.startsWith('$')) continue
    const path = [...segments, name]
    if (!Object.hasOwn(entry, '$value')) {
      collect(entry, path)
      continue
    }

    const key = path.join('.')
    const figma = entry.$extensions[extension]
    const collection = collections[figma.collection]
    const expectedName = path.slice(path[0] === 'reference' ? 2 : 1).join('/')
    const css = '--ads-color-' + slug(path.slice(path[0] === 'reference' ? 0 : 1).join('-'))
    if (cssNames.has(css) || figmaIds.has(figma.id) || figma.name !== expectedName) {
      throw new Error(`Duplicate name or ID, or invalid Figma path: ${key} (${css})`)
    }
    cssNames.add(css)
    figmaIds.add(figma.id)

    const values = { [collection.default]: entry.$value, ...figma.modes }
    const expectedModes = collection.modes.map((mode) => mode.id)
    if (Object.keys(values).length !== expectedModes.length ||
        expectedModes.some((id) => !Object.hasOwn(values, id))) {
      throw new Error(`Mode mismatch for ${key}`)
    }
    tokens.set(key, {
      key, layer: path[0], name: figma.name, css, id: figma.id,
      collection: figma.collection, node: figma.node ?? null,
      description: entry.$description ?? null,
      values: Object.fromEntries(expectedModes.map((id) => [id, values[id]])),
    })
  }
}
for (const layer of ['primitive', 'reference', 'semantic']) collect(document[layer], [layer])

function reference(value) {
  const key = typeof value === 'string' && value.match(/^\{([^{}]+)\}$/)?.[1]
  if (key && tokens.has(key)) return key
  if (typeof value === 'string') throw new Error(`Invalid color reference: ${value}`)
  return null
}

function cssColor(value) {
  const channel = (n) => Number.isFinite(n) && n >= 0 && n <= 1
  if (value.colorSpace !== 'srgb' || value.components?.length !== 3 ||
      !value.components.every(channel) || !channel(value.alpha)) {
    throw new Error(`Invalid sRGB token: ${JSON.stringify(value)}`)
  }
  return `color(srgb ${value.components.join(' ')} / ${value.alpha})`
}

function cssValue(value) {
  const target = reference(value)
  return target ? `var(${tokens.get(target).css})` : cssColor(value)
}

const axes = Object.entries(collections)
for (const [key, collection] of axes) {
  if (new Set(collection.modes.map((mode) => mode.key)).size !== collection.modes.length ||
      !collection.modes.some((mode) => mode.id === collection.default) ||
      (collection.modes.length > 1 && !collection.attribute)) {
    throw new Error(`Invalid mode configuration in ${key}`)
  }
}

const combinations = axes.reduce((all, [key, collection]) =>
  all.flatMap((modeIds) => collection.modes.map((mode) => ({ ...modeIds, [key]: mode.id }))), [{}])
for (const modeIds of combinations) {
  for (const token of tokens.values()) {
    const visited = new Set()
    let current = token
    while (current) {
      if (visited.has(current.key)) throw new Error(`Circular color reference at ${current.key}`)
      visited.add(current.key)
      const value = current.values[modeIds[current.collection]]
      const target = reference(value)
      if (!target) cssColor(value)
      current = target ? tokens.get(target) : null
    }
  }
}

const list = [...tokens.values()]
const declarations = (entries, modeFor) => entries.map((token) =>
  `  ${token.css}: ${cssValue(token.values[modeFor(token)])};`).join('\n')
const header = 'Generated from tokens/colors.tokens.json. Run npm run tokens:build.'
const rules = [
  `/* ${header} */`,
  `:root, [data-color-scope] {\n${declarations(list, (token) => collections[token.collection].default)}\n}`,
]
for (const [key, collection] of axes) {
  const members = list.filter((token) => token.collection === key)
  for (const mode of collection.modes) {
    if (mode.id === collection.default) continue
    const value = `[${collection.attribute}="${mode.key}"]`
    rules.push(`:root${value}, [data-color-scope]${value} {\n${declarations(members, () => mode.id)}\n}`)
  }
}

const catalog = JSON.stringify(provenance, null, 2)
const generated = new Map([
  ['colors.css', rules.join('\n\n') + '\n'],
  ['colors.tailwind.css', [
    `/* ${header} */`,
    '@theme inline {',
    ...list.filter((token) => token.layer === 'semantic').map((token) =>
      `  --color-ads-${token.css.slice('--ads-color-'.length)}: var(${token.css});`),
    '}',
    '',
  ].join('\n')],
  ['colors.generated.ts', [
    `// ${header}`,
    "import type { ColorProvenance, ColorToken } from './color-types'",
    '',
    `export const colorProvenance: ColorProvenance = ${catalog}`,
    '',
    'export const colorTokens: readonly ColorToken[] = [',
    ...list.map((token) => `  ${JSON.stringify(token)},`),
    ']',
    '',
  ].join('\n')],
])

const check = process.argv.includes('--check')
for (const [file, contents] of generated) {
  const url = new URL(`../src/tokens/${file}`, import.meta.url)
  if (!check) writeFileSync(url, contents)
  else if (readFileSync(url, 'utf8') !== contents) {
    throw new Error(`${file} is stale. Run npm run tokens:build.`)
  }
}

const counts = Object.fromEntries(axes.map(([key, collection]) => [
  key, {
    tokens: list.filter((token) => token.collection === key).length,
    modes: collection.modes.map((mode) => mode.name),
  },
]))
console.log(`${check ? 'Verified' : 'Generated'} ${list.length} tokens across ${combinations.length} mode combinations.`)
console.log(JSON.stringify(counts, null, 2))
