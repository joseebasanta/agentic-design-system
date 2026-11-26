import { readFileSync, writeFileSync } from 'node:fs'

const source = new URL('../tokens/typography.tokens.json', import.meta.url)
const output = new URL('../src/tokens/typography.css', import.meta.url)
const { styles, specimenFeatures } = JSON.parse(readFileSync(source, 'utf8'))
const families = {
  Inter: { variable: '--ads-font-inter', weights: [400, 500] },
  'Inter Display': { variable: '--ads-font-inter-display', weights: [500] },
}
const ids = new Set()
const classes = new Set()
const rem = (px) => `${px / 16}rem`
const em = (percent) => `${Number((percent / 100).toFixed(5))}em`

const rules = styles.map((style) => {
  const { id, cssClass, fontFamily, fontWeight, fontSize, lineHeight, letterSpacingPercent, textTransform } = style
  const family = families[fontFamily]
  if (!id || ids.has(id) || !/^ads-type-[a-z0-9-]+$/.test(cssClass) || classes.has(cssClass) ||
      !family?.weights.includes(fontWeight) || ![fontSize, lineHeight].every((px) => Number.isFinite(px) && px > 0) ||
      !Number.isFinite(letterSpacingPercent) || !['none', 'uppercase'].includes(textTransform)) {
    throw new Error(`Invalid typography style: ${style.name}`)
  }
  ids.add(id)
  classes.add(cssClass)

  const features = Object.entries({ ...specimenFeatures, ...style.specimenFeatures }).map(([tag, enabled]) => {
    if (!/^[a-z0-9]{4}$/.test(tag) || typeof enabled !== 'boolean') {
      throw new Error(`Invalid OpenType feature: ${style.name} / ${tag}`)
    }
    return `'${tag}' ${Number(enabled)}`
  })

  return `.${cssClass} {
  font-family: var(${family.variable});
  font-feature-settings: ${features.join(', ')};
  font-style: normal;
  font-weight: ${fontWeight};
  font-size: ${rem(fontSize)};
  line-height: ${rem(lineHeight)};
  letter-spacing: ${em(letterSpacingPercent)};
  text-transform: ${textTransform};
}`
})

const css = [
  '/* Generated from tokens/typography.tokens.json. Run npm run tokens:build. */',
  ...rules,
].join('\n\n') + '\n'

if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== css) {
    throw new Error('typography.css is stale. Run npm run tokens:build.')
  }
  console.log(`Verified ${styles.length} typography styles.`)
} else {
  writeFileSync(output, css)
  console.log(`Generated ${styles.length} typography styles.`)
}
