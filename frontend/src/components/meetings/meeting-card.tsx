'use client'

import {
  ChevronRight,
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { exportUrl } from '@/lib/api/meetings'
import type { MeetingListItem } from '@/lib/types'
import { formatDay, formatDuration, formatTime } from '@/lib/utils/format'
import { DeleteMeetingModal } from './delete-meeting-modal'
import { MeetingDetailsModal } from './meeting-details-modal'

// The small square on the left of a meeting: a video icon, since meetings have no thumbnails here.
export function MeetingThumb({ size = 'lg' }: { size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-sm bg-brand-soft text-fg-brand ${size === 'lg' ? 'size-10' : 'size-8'}`}
    >
      <Video size={size === 'lg' ? 20 : 16} />
    </span>
  )
}

function people(names: string[]) {
  return names.length > 3
    ? `${names.slice(0, 3).join(', ')} +${names.length - 3}`
    : names.join(', ')
}

// A library row. The card opens the meeting; the buttons on hover edit or export it.
export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const download = (format: 'markdown' | 'txt') =>
    window.location.assign(exportUrl(meeting.id, format))

  return (
    <div className="group relative flex items-center gap-4 rounded-xl border border-line-subtle bg-layer px-5 py-4 transition-colors hover:bg-muted">
      <Link
        href={`/meetings/${meeting.id}`}
        aria-label={meeting.title}
        className="absolute inset-0 rounded-xl"
      />
      <MeetingThumb />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-medium text-fg">
          <span className="truncate">{meeting.title}</span>
          <ChevronRight size={16} className="shrink-0" />
        </p>
        <p className="truncate text-sm text-fg-muted">
          {formatDay(meeting.meeting_at)} · {formatTime(meeting.meeting_at)} ·{' '}
          {formatDuration(meeting.duration_seconds)} · {people(meeting.participants)}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 transition-opacity max-md:hidden md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <Menu
          trigger={
            <IconButton label="More actions" variant="outline" className="size-9">
              <MoreHorizontal size={20} />
            </IconButton>
          }
        >
          <MenuItem icon={<Pencil size={16} />} onSelect={() => setDetailsOpen(true)}>
            Edit details
          </MenuItem>
          <MenuItem icon={<Download size={16} />} onSelect={() => download('markdown')}>
            Export as Markdown
          </MenuItem>
          <MenuItem icon={<FileText size={16} />} onSelect={() => download('txt')}>
            Export as text
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={16} />} onSelect={() => setDeleteOpen(true)}>
            Delete
          </MenuItem>
        </Menu>
        <Button className="h-9 pr-3 pl-4" onClick={() => setDetailsOpen(true)}>
          Details <ChevronRight size={16} />
        </Button>
      </div>

      <MeetingDetailsModal
        meeting={meeting}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
      <DeleteMeetingModal
        meeting={meeting}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  )
}
