import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

// Shared look for text fields: a quiet gray box that gets a purple border on focus.
export const fieldClass =
  'w-full rounded-sm border border-line bg-muted px-4 text-sm text-fg-secondary transition-colors placeholder:text-fg-hint focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-60'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode // a small icon inside the left edge
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-hint">
          {icon}
        </span>
      )}
      <input className={cn(fieldClass, 'h-10', icon && 'pl-10', className)} {...props} />
    </div>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, 'resize-y py-2.5', className)} {...props} />
}
