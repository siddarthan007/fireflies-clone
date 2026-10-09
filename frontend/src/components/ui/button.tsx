import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-hover disabled:bg-brand-disabled',
  outline:
    'border border-line bg-layer text-fg-icon shadow-card hover:bg-muted disabled:text-fg-disabled',
  ghost: 'text-fg-icon hover:bg-fg/5 disabled:text-fg-disabled',
  soft: 'bg-brand-soft text-fg-brand hover:bg-brand-soft-hover',
  danger: 'bg-danger-strong text-white hover:opacity-90',
  text: 'text-fg-icon hover:text-fg', // plain words with no box, like "Feedback" or "Manage"
}

// On phones buttons grow to a comfortable 44px tap target.
const sizes = {
  md: 'h-8 text-sm max-md:h-11',
  lg: 'h-10 px-4 text-sm max-md:h-11',
  inline: 'h-5 px-0 text-sm max-md:h-9', // as tall as one line of text
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  icon?: ReactNode // shown before the label; the button gets less padding on that side
}

export function Button({
  variant = 'outline',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1 rounded-sm font-display font-medium transition-colors duration-200',
        variants[variant],
        sizes[size],
        size === 'md' && (icon ? 'pr-3 pl-2' : 'px-2'),
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
