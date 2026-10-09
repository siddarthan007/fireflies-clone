import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'

export default function NotFound() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-sm bg-brand px-4 font-display text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Back to Home
          </Link>
        }
      />
    </div>
  )
}
