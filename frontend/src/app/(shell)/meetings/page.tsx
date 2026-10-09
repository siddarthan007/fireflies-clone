'use client'

import { ListChecks, Sparkle, Target } from 'lucide-react'
import { useState } from 'react'

import { AskFredRail } from '@/components/askfred/askfred-rail'
import {
  NO_FILTERS,
  countFilters,
  type LibraryFilters,
} from '@/components/meetings/filters-popover'
import { MeetingList } from '@/components/meetings/meeting-list'
import { MeetingsToolbar, type Scope } from '@/components/meetings/meetings-toolbar'
import { NewMeetingModal } from '@/components/meetings/new-meeting-modal'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useMeetings } from '@/lib/api/meetings'
import { useHiGreeting } from '@/lib/api/user'
import { useDebounce } from '@/lib/hooks/use-debounce'

const PAGE_SIZE = 20

const SUGGESTIONS = [
  { icon: <ListChecks size={16} className="text-accent-green" />, text: 'My action items' },
  { icon: <Target size={16} className="text-accent-red" />, text: 'Key decisions' },
  {
    icon: <Sparkle size={16} className="fill-accent-yellow text-accent-yellow" />,
    text: 'Summarize my last meeting',
  },
]

export default function MeetingsPage() {
  const hi = useHiGreeting()
  const [scope, setScope] = useState<Scope>(null)
  const [filters, setFilters] = useState<LibraryFilters>(NO_FILTERS)
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [uploadOpen, setUploadOpen] = useState(false)
  const q = useDebounce(query.trim())

  const meetings = useMeetings({
    q,
    participants: filters.participants,
    tags: filters.tags,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sort,
    limit,
  })

  // Sharing is not built, so nothing is ever shared with you.
  const shared = scope === 'shared'
  const items = shared ? [] : meetings.data?.items
  const total = shared ? 0 : (meetings.data?.total ?? 0)
  const filtering = q !== '' || countFilters(filters) > 0

  let empty
  if (shared) {
    empty = (
      <EmptyState
        title="Nothing shared with you yet"
        description="Sharing meetings with teammates is coming soon."
      />
    )
  } else if (filtering) {
    empty = (
      <EmptyState
        title="No meetings match"
        description="Try a different title, person or date range."
        action={
          <Button
            onClick={() => {
              setFilters(NO_FILTERS)
              setQuery('')
            }}
          >
            Clear filters
          </Button>
        }
      />
    )
  } else {
    empty = (
      <EmptyState
        title="No meetings yet"
        description="Upload a transcript to see notes, action items and search."
        action={
          <Button variant="primary" onClick={() => setUploadOpen(true)}>
            Upload transcript
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex h-full">
      <section className="flex min-w-0 flex-1 flex-col">
        <MeetingsToolbar
          scope={scope}
          onScope={setScope}
          filters={filters}
          onFilters={setFilters}
          sort={sort}
          onSort={setSort}
          query={query}
          onQuery={setQuery}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[760px] px-6 py-6 max-sm:px-4">
            <MeetingList
              meetings={items}
              loading={!shared && meetings.isLoading}
              failed={!shared && meetings.isError}
              onRetry={() => meetings.refetch()}
              empty={empty}
            />
            {items && items.length > 0 && (
              <div className="py-6 text-center">
                {items.length < total ? (
                  <Button onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                    Show more
                  </Button>
                ) : (
                  <p className="text-xs text-fg-muted">
                    You have reached the end of your meetings.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <AskFredRail
        label="Ask Fred"
        className="w-[372.4px]"
        greeting={[hi, 'Get ready for your meeting']}
        suggestions={SUGGESTIONS}
        scope="My Meetings"
      />
      <NewMeetingModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
