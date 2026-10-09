import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { MeetingListItem } from '@/lib/types'
import { groupByDay } from '@/lib/utils/format'
import { MeetingCard } from './meeting-card'

// The library: meetings grouped under a heading per day, with loading, error and empty states.
export function MeetingList({
  meetings,
  loading,
  failed,
  onRetry,
  empty,
}: {
  meetings: MeetingListItem[] | undefined
  loading: boolean
  failed: boolean
  onRetry: () => void
  empty: ReactNode
}) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-[78px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (failed || !meetings) {
    return (
      <EmptyState
        title="Could not load your meetings"
        description="Check that the API is running, then try again."
        action={<Button onClick={onRetry}>Try again</Button>}
      />
    )
  }

  if (meetings.length === 0) return <>{empty}</>

  return (
    <div className="space-y-6">
      {groupByDay(meetings, (meeting) => meeting.meeting_at).map((group) => (
        <section key={group.heading} aria-label={group.heading} className="space-y-5">
          <h2 className="text-sm text-fg-muted">{group.heading}</h2>
          <div className="space-y-3">
            {group.items.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
