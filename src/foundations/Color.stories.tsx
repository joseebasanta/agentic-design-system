import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { formatColor, resolveColor } from '../tokens/colors'
import type { ColorModes } from '../tokens/colors'
import { SemanticInventory } from './ColorDocs'
import { semanticToken } from './contrast'

const meta = {
  title: 'Foundations/Colors/Semantic',
  component: SemanticInventory,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SemanticInventory>

export default meta
type Story = StoryObj<typeof meta>

function cssColor(name: string, modes: ColorModes) {
  const { value } = resolveColor(semanticToken(name), modes)
  const sample = document.createElement('span')
  sample.style.color = `color(srgb ${value.components.join(' ')} / ${value.alpha})`
  return sample.style.color
}

export const ThemeAndContrast: Story = {
  name: 'Theme and contrast',
  play: async ({ canvas, userEvent }) => {
    const surface = canvas.getByText('Main surface', { exact: true }).parentElement!
    const brand = surface.querySelector('.bg-ads-primary-base')!
    const initial = getComputedStyle(surface).backgroundColor
    const initialBrand = getComputedStyle(brand).backgroundColor
    await expect(initial).toBe(cssColor('bg/white-0', {}))
    await expect(initialBrand).toBe(cssColor('primary-base', {}))

    try {
      await userEvent.selectOptions(canvas.getByLabelText('Appearance'), '109:1')
      const grayDark = getComputedStyle(surface).backgroundColor
      await expect(grayDark).toBe(cssColor('bg/white-0', { appearance: '109:1' }))
      await expect(grayDark).not.toBe(initial)

      await userEvent.selectOptions(canvas.getByLabelText('Brand'), '247:0')
      await expect(getComputedStyle(brand).backgroundColor).toBe(cssColor('primary-base', { brand: '247:0' }))
      await expect(getComputedStyle(brand).backgroundColor).not.toBe(initialBrand)
      const primaryPair = canvas.getByRole('row', { name: /Filled primary button/ })
      await expect(primaryPair).toHaveTextContent('Below AA')

      await userEvent.selectOptions(canvas.getByLabelText('Neutral palette'), '164602:1')
      const modes = { appearance: '109:1', brand: '247:0', neutral: '164602:1' }
      await expect(getComputedStyle(surface).backgroundColor).toBe(cssColor('bg/white-0', modes))
      await expect(getComputedStyle(surface).backgroundColor).not.toBe(grayDark)
      const surfaceRow = canvas.getByRole('rowheader', { name: /^bg\/white-0/ }).closest('tr')
      await expect(surfaceRow).toHaveTextContent(formatColor(resolveColor(semanticToken('bg/white-0'), modes).value))
    } finally {
      await userEvent.selectOptions(canvas.getByLabelText('Appearance'), '109:0')
      await userEvent.selectOptions(canvas.getByLabelText('Brand'), '113:0')
      await userEvent.selectOptions(canvas.getByLabelText('Neutral palette'), '164602:0')
    }
  },
}
