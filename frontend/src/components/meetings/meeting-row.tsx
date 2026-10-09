import Link from 'next/link'

import type { MeetingListItem } from '@/lib/types'
import { formatDay, formatTime } from '@/lib/utils/format'
import { MeetingThumb } from './meeting-card'

// A compact meeting line, used in the Home page lists.
export function MeetingRow({ meeting }: { meeting: MeetingListItem }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="flex items-center gap-4 rounded-lg px-4 py-2 transition-colors hover:bg-muted"
    >
      <MeetingThumb size="md" />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-fg-secondary">{meeting.title}</span>
        <span className="text-sm text-fg-hint">
          {formatDay(meeting.meeting_at, true)} · {formatTime(meeting.meeting_at)}
        </span>
      </span>
    </Link>
  )
}
