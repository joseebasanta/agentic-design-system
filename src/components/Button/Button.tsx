import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
}

export function Button({
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={['ads-button', `ads-button--${variant}`, `ads-button--${size}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
