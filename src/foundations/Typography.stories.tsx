import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import typography from '../../tokens/typography.tokens.json'
import './typography-docs.css'

const groups = {
  Title: 'Establish the visual hierarchy of pages and sections.',
  Label: 'Identify controls and interface elements with Medium weight.',
  Paragraph: 'Set introductions, body copy, and supporting text in Regular weight.',
  Subheading: 'Group related content or introduce a section with an uppercase line.',
  Docs: 'Set documentation labels and prose with a roomier 32 px line height.',
}

const samples: Record<string, { text: string; use: string }> = {
  'Title/H1 Title': { text: 'Project overview', use: 'Page title' },
  'Title/H2 Title': { text: 'Workspace settings', use: 'Major section' },
  'Title/H3 Title': { text: 'Shipping preferences', use: 'Section within a settings page' },
  'Title/H4 Title': { text: 'Billing details', use: 'Heading for a compact section' },
  'Title/H5 Title': { text: 'Payment methods', use: 'Heading for a panel' },
  'Title/H6 Title': { text: 'Recent invoices', use: 'Heading for a small card' },
  'Label/X Large': { text: 'Account owner', use: 'Prominent label for a key detail' },
  'Label/Large': { text: 'Delivery address', use: 'Prominent field label' },
  'Label/Medium': { text: 'Email address', use: 'Standard form label' },
  'Label/Small': { text: 'Save changes', use: 'Button label' },
  'Label/X Small': { text: 'Draft', use: 'Compact status label' },
  'Paragraph/X Large': { text: 'Set up a shared workspace for your team.', use: 'Page introduction' },
  'Paragraph/Large': { text: 'Invite teammates and choose how they access this workspace.', use: 'Introductory paragraph' },
  'Paragraph/Medium': { text: 'Changes to your settings apply to everyone in this workspace.', use: 'Default body copy' },
  'Paragraph/Small': { text: 'Use the email address associated with your account.', use: 'Help text beneath a field' },
  'Paragraph/X Small': { text: 'Updated 3 days ago', use: 'Secondary metadata' },
  'Subheading/Medium': { text: 'Getting started', use: 'Category above an introduction' },
  'Subheading/Small': { text: 'Workspace preferences', use: 'Section kicker' },
  'Subheading/X Small': { text: 'Account access', use: 'Compact group heading' },
  'Subheading/2X Small': { text: 'Security', use: 'Small section label' },
  'Docs/Label': { text: 'Step 3 · Review access', use: 'Label in a documentation guide' },
  'Docs/Paragraph': { text: 'Select a role before inviting a new person to the workspace.', use: 'Instructional documentation copy' },
}

function figmaSample(node: string) {
  const url = new URL(typography.figma.overview)
  url.searchParams.set('node-id', node.replace(':', '-'))
  return url.href
}

function SpecimenCatalog() {
  return (
    <div className="typography-docs">
      {Object.entries(groups).map(([group, description]) => (
        <section className="typography-docs__group" key={group}>
          <h2>{group}</h2>
          <p>{description}</p>
          <ul className="typography-docs__list">
            {typography.styles.filter((style) => style.name.startsWith(group + '/')).map((style) => {
              const sample = samples[style.name]
              const trackingPx = Number((style.fontSize * style.letterSpacingPercent / 100).toFixed(3))
              return (
                <li className="typography-docs__item" key={style.id}>
                  <div className="typography-docs__meta">
                    <h3><a href={figmaSample(style.node)}>{style.name}</a></h3>
                    <code>{style.cssClass}</code>
                  </div>
                  <p className={`typography-docs__specimen ${style.cssClass}`} data-specimen={style.cssClass}>
                    {sample.text}
                  </p>
                  <dl className="typography-docs__metrics">
                    <div><dt>Family</dt><dd>{style.fontFamily}</dd></div>
                    <div><dt>Weight</dt><dd>{style.fontWeight}</dd></div>
                    <div><dt>Size</dt><dd>{style.fontSize} px</dd></div>
                    <div><dt>Line height</dt><dd>{style.lineHeight} px</dd></div>
                    <div><dt>Letter spacing</dt><dd>{style.letterSpacingPercent}% ({trackingPx} px)</dd></div>
                  </dl>
                  <p className="typography-docs__usage">{sample.use}</p>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

const meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Specimens: Story = {
  render: () => <SpecimenCatalog />,
  play: async ({ canvasElement }) => {
    const { documentElement, fonts } = canvasElement.ownerDocument
    const rootScale = Number.parseFloat(getComputedStyle(documentElement).fontSize) / 16
    for (const style of typography.styles) {
      const specimen = canvasElement.querySelector<HTMLElement>(`[data-specimen="${style.cssClass}"]`)!
      const family = `ADS ${style.fontFamily}`
      const faces = await fonts.load(`${style.fontWeight} ${style.fontSize}px "${family}"`, specimen.textContent)
      await expect(faces.some((face) => face.status === 'loaded' && face.weight === String(style.fontWeight))).toBe(true)

      const computed = getComputedStyle(specimen)
      const firstFamily = computed.fontFamily.split(',')[0].replaceAll(/["']/g, '')
      await expect(firstFamily).toBe(family)
      await expect(computed.fontWeight).toBe(String(style.fontWeight))
      await expect(Number.parseFloat(computed.fontSize)).toBeCloseTo(style.fontSize * rootScale, 3)
      await expect(Number.parseFloat(computed.lineHeight)).toBeCloseTo(style.lineHeight * rootScale, 3)
      const letterSpacing = computed.letterSpacing === 'normal' ? 0 : Number.parseFloat(computed.letterSpacing)
      await expect(letterSpacing).toBeCloseTo(
        style.letterSpacingPercent * style.fontSize * rootScale / 100, 3,
      )
      await expect(computed.textTransform).toBe(style.textTransform)
    }
  },
}

export const InContext: Story = {
  render: () => (
    <section className="typography-docs__context bg-ads-bg-white-0 text-ads-text-strong-950">
      <p className="ads-type-subheading-xs text-ads-text-sub-600">Workspace</p>
      <h2 className="ads-type-title-h4">Notification settings</h2>
      <p className="ads-type-paragraph-md">Choose where we send updates about your workspace.</p>
      <label className="ads-type-label-sm" htmlFor="typography-email">Email address</label>
      <input id="typography-email" className="ads-type-paragraph-sm" type="email" placeholder="you@example.com" />
    </section>
  ),
}
