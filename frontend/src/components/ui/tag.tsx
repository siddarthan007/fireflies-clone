import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const tones = {
  success: 'bg-success-soft text-success',
  neutral: 'bg-strong text-fg-muted',
  brand: 'bg-brand-soft text-fg-brand',
}

// A small label such as NEW or Soon.
export function Tag({
  tone = 'success',
  children,
}: {
  tone?: keyof typeof tones
  children: ReactNode
}) {
  return (
    <span className={cn('inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs', tones[tone])}>
      {children}
    </span>
  )
}
