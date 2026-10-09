import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

const variants = {
  ghost: 'text-fg-icon hover:bg-fg/5',
  outline: 'border border-line bg-layer text-fg-icon shadow-card hover:bg-muted',
  primary: 'bg-brand text-white hover:bg-brand-hover disabled:bg-brand-disabled',
}

// On phones the buttons grow to a 44px tap target (the icon stays the same size).
const sizes = {
  sm: 'size-6 p-1 max-md:size-11', // 16px icon
  md: 'size-8 p-1.5 max-md:size-11', // 20px icon
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string // spoken by screen readers and shown as the tooltip
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
