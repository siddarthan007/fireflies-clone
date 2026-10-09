import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

// A real <input type="checkbox">, so keyboard and screen readers work. The look is in globals.css.
export function Checkbox({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="checkbox" className={cn('checkbox', className)} {...props} />
}
