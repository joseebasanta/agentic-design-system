import type { ComponentPropsWithRef, CSSProperties } from 'react'
import type { IconName } from './catalog.generated'
import { iconAssets } from './assets'
import './Icon.css'

export type IconProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
  name: IconName
  /** 24 is the Figma canvas size. 20 and 16 match the existing button slots. */
  size?: 16 | 20 | 24
  /** Omit for decorative icons. Name actions on their containing button. */
  label?: string
}

export function Icon({ name, size = 24, label, className, style, ...props }: IconProps) {
  const asset = iconAssets[`./svg/${name}.svg`]
  const iconStyle: CSSProperties = {
    width: size,
    height: size,
    maskImage: `url("${asset}")`,
    ...style,
  }

  return (
    <span
      {...props}
      className={['ads-icon', className].filter(Boolean).join(' ')}
      style={iconStyle}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
