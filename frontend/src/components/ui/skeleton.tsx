import { cn } from '@/lib/utils/cn'

// A gray shimmering block shown while data loads. Give it a size with className.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-sm', className)} />
}
