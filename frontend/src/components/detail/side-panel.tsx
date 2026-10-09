'use client'

import { MessageCircle, Star, X } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { IconButton } from '@/components/ui/icon-button'
import { useTranscript } from '@/lib/api/meetings'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatClock } from '@/lib/utils/format'
import type { PanelId } from './tool-rail'

const COPY = {
  highlights: {
    title: 'Highlights',
    icon: Star,
    empty: 'No highlights yet',
    hint: 'Star a line in the transcript to keep it here.',
  },
  comments: {
    title: 'Comments',
    icon: MessageCircle,
    empty: 'No comments yet',
    hint: 'Comment on a transcript line to start a discussion.',
  },
}

// The lines you highlighted, or the lines people commented on. Click one to play from there.
export function SidePanel({
  panel,
  meetingId,
  onSeek,
  onClose,
}: {
  panel: PanelId
  meetingId: number
  onSeek: (ms: number) => void
  onClose: () => void
}) {
  const { data: segments = [], isLoading, isError, refetch } = useTranscript(meetingId)
  const { title, icon: Icon, empty, hint } = COPY[panel]
  const lines = segments.filter((s) => (panel === 'highlights' ? s.highlighted : s.comments.length))

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line-subtle pr-2 pl-4">
        <h2 className="text-sm font-medium text-fg-secondary">{title}</h2>
        <IconButton label="Close panel" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </div>

      {isLoading ? (
        <div className="space-y-4 p-4" aria-busy>
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Could not load the transcript"
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      ) : lines.length === 0 ? (
        <EmptyState
          className="flex-1 justify-center"
          icon={<Icon size={32} />}
          title={empty}
          description={hint}
        />
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-line-subtle overflow-y-auto">
          {lines.map((segment) => (
            <li key={segment.id}>
              <button
                type="button"
                onClick={() => onSeek(segment.start_ms)}
                className="w-full space-y-1.5 px-4 py-3 text-left transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Avatar name={segment.speaker} />
                  <span className="font-medium text-fg-secondary">{segment.speaker}</span>
                  <span className="text-fg-link">{formatClock(segment.start_ms)}</span>
                </span>
                <span className="line-clamp-3 block text-sm text-fg-secondary">{segment.text}</span>
                {panel === 'comments' &&
                  segment.comments.map((comment) => (
                    <span
                      key={comment.id}
                      className="block rounded-sm bg-muted px-3 py-1.5 text-sm text-fg-secondary"
                    >
                      {comment.text}
                    </span>
                  ))}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
