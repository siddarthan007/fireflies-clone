import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

// What a list or panel shows when there is nothing to show yet.
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      {icon && <div className="text-fg-disabled">{icon}</div>}
      <div className="space-y-1">
        <h2 className="text-base font-medium text-fg-secondary">{title}</h2>
        {description && <p className="max-w-sm text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
