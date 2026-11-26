import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Icon, iconCatalog } from '../icons'
import type { IconProps } from '../icons'
import { Button } from '../components/Button/Button'
import './iconography-docs.css'

const categories = [...new Set(iconCatalog.map((icon) => icon.category))].sort()
const pageSize = 96

function Gallery() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [variant, setVariant] = useState('')
  const [size, setSize] = useState<IconProps['size']>(24)
  const [page, setPage] = useState(0)
  const matches = iconCatalog.filter((icon) =>
    icon.name.includes(search.trim().toLowerCase()) &&
    (!category || icon.category === category) &&
    (!variant || icon.variant === variant))
  const pages = Math.max(1, Math.ceil(matches.length / pageSize))

  return (
    <div className="iconography-docs">
      <div className="iconography-docs__controls">
        <label>Search icons<input type="search" value={search} onChange={(event) => {
          setSearch(event.target.value)
          setPage(0)
        }} /></label>
        <label>Category<select value={category} onChange={(event) => {
          setCategory(event.target.value)
          setPage(0)
        }}>
          <option value="">All categories</option>
          {categories.map((name) => <option key={name}>{name}</option>)}
        </select></label>
        <label>Variant<select value={variant} onChange={(event) => {
          setVariant(event.target.value)
          setPage(0)
        }}>
          <option value="">All variants</option>
          <option value="line">Line</option><option value="fill">Fill</option><option value="other">Other names</option>
        </select></label>
        <label>Size<select value={size} onChange={(event) => setSize(Number(event.target.value) as IconProps['size'])}>
          <option value={16}>16 px</option><option value={20}>20 px</option><option value={24}>24 px</option>
        </select></label>
      </div>
      <p role="status">{matches.length} icons · Page {page + 1} of {pages}</p>
      <ul className="iconography-docs__gallery">
        {matches.slice(page * pageSize, (page + 1) * pageSize).map((icon) => (
          <li key={icon.name}>
            <Icon name={icon.name} size={size} />
            <code>{icon.name}</code>
            <small>{icon.variant} · {icon.viewBox}</small>
            <a href={`https://www.figma.com/design/jc3iyvFl45ESgrCMzprckl/Agentic-Design-System--1.1-?node-id=${icon.node.replace(':', '-')}`}>Figma component</a>
          </li>
        ))}
      </ul>
      {matches.length === 0 && <p>No icons match these filters.</p>}
      <nav className="iconography-docs__pagination" aria-label="Icon gallery pages">
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous page</button>
        <button disabled={page + 1 === pages} onClick={() => setPage(page + 1)}>Next page</button>
      </nav>
    </div>
  )
}

const meta = { title: 'Foundations/Iconography', parameters: { layout: 'padded' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const IconGallery: Story = {
  render: () => <Gallery />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('3057 icons')
    await userEvent.type(canvas.getByLabelText('Search icons'), 'home-2-')
    await expect(canvas.getByRole('status')).toHaveTextContent('2 icons')
    await userEvent.selectOptions(canvas.getByLabelText('Variant'), 'fill')
    await expect(canvas.getByRole('status')).toHaveTextContent('1 icons')
    await userEvent.selectOptions(canvas.getByLabelText('Size'), '16')
    const sample = canvas.getByText('home-2-fill', { exact: true }).parentElement!.querySelector('.ads-icon')!
    await expect(sample.getBoundingClientRect().width).toBe(16)
    await expect(getComputedStyle(sample).maskImage).toContain('home-2-fill')
    await userEvent.clear(canvas.getByLabelText('Search icons'))
    await userEvent.selectOptions(canvas.getByLabelText('Variant'), '')
    await userEvent.selectOptions(canvas.getByLabelText('Size'), '24')
  },
}

export const Usage: Story = {
  render: () => (
    <div className="iconography-docs__examples text-ads-icon-strong-950">
      <p><Icon name="information-line" size={20} /> Your changes are saved automatically.</p>
      <Button><Icon name="add-line" size={20} /> Add member</Button>
      <Button aria-label="Copy link"><Icon name="file-copy-line" size={20} /></Button>
      <div className="iconography-docs__sizes text-ads-state-success-base">
        {([16, 20, 24] as const).map((size) => <span key={size}><Icon name="verified-line" size={size} /> {size} px</span>)}
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Copy link' })).toBeVisible()
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument()
  },
}
