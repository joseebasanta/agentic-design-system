export interface ColorValue {
  colorSpace: 'srgb'
  components: readonly [number, number, number]
  alpha: number
}

export interface ColorToken {
  key: string
  layer: 'primitive' | 'reference' | 'semantic'
  name: string
  css: string
  id: string
  collection: string
  node: string | null
  description: string | null
  values: Readonly<Record<string, ColorValue | string>>
}

export interface ColorCollection {
  name: string
  id: string
  default: string
  label?: string
  attribute?: string
  modes: readonly { id: string; name: string; key: string }[]
}

export interface ColorProvenance {
  fileKey: string
  fileName: string
  colorProfile: string
  frames: { primitive: string; semantic: string }
  collections: Readonly<Record<string, ColorCollection>>
  groupDescriptions: Readonly<Record<string, { description: string; node: string }>>
  discrepancies: readonly {
    node: string
    context: string
    label: string
    token?: string
    bound: string
    actual?: string
  }[]
}
