export const iconAssets = import.meta.glob<string>('./svg/*.svg', {
  eager: true,
  query: '?url&no-inline',
  import: 'default',
})
