import { cn } from '@/lib/utils/cn'
import { avatarClass, initial } from '@/lib/utils/speaker'

const sizes = {
  sm: 'size-5 text-xs', // 20px, in transcripts
  md: 'size-7 text-sm', // 28px
  lg: 'size-8 text-sm', // 32px, in the app bar
}

// The person's initial on a color picked from their name. Decorative: the name is always beside it.
export function Avatar({
  name,
  size = 'sm',
  className,
}: {
  name: string
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm font-medium text-white',
        avatarClass(name),
        sizes[size],
        className,
      )}
    >
      {initial(name)}
    </span>
  )
}
