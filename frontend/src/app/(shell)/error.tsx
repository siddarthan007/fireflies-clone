'use client'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      className="h-full justify-center"
      title="Something went wrong"
      description="The page could not be shown. Try again, and check that the API is running."
      action={<Button onClick={reset}>Try again</Button>}
    />
  )
}
