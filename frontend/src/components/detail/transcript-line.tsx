'use client'

import { MessageCircle, Star, X } from 'lucide-react'
import { useState } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Highlight } from '@/components/ui/highlight'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAddComment, useDeleteComment, useSetHighlight } from '@/lib/api/segments'
import type { Segment } from '@/lib/types'
import { cn } from '@/lib/utils/cn'
import { formatClock, formatDay } from '@/lib/utils/format'

function CommentForm({
  meetingId,
  segmentId,
  onDone,
}: {
  meetingId: number
  segmentId: number
  onDone: () => void
}) {
  const toast = useToast()
  const add = useAddComment(meetingId)
  const [text, setText] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    add.mutate(
      { segmentId, text: text.trim() },
      {
        onSuccess: () => {
          toast('Comment added')
          onDone()
        },
        onError: () => toast('Could not add the comment', 'error'),
      },
    )
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => event.key === 'Escape' && onDone()}
      className="flex items-center gap-2 pt-2 pl-[25px]"
    >
      <div className="min-w-0 flex-1">
        <Input
          autoFocus
          aria-label="Comment"
          placeholder="Add a comment"
          maxLength={500}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="h-9"
        />
      </div>
      <Button type="submit" variant="primary" disabled={!text.trim() || add.isPending}>
        Post
      </Button>
      <Button onClick={onDone}>Cancel</Button>
    </form>
  )
}

// One speaker turn: who, when, what, plus the highlight star and the comments on it.
export function TranscriptLine({
  segment,
  meetingId,
  active,
  matched,
  term,
  onSeek,
  lineRef,
}: {
  segment: Segment
  meetingId: number
  active: boolean // being spoken at the playhead
  matched: boolean // the match the find box is on
  term: string
  onSeek: () => void
  lineRef: (element: HTMLElement | null) => void
}) {
  const toast = useToast()
  const setHighlight = useSetHighlight(meetingId)
  const deleteComment = useDeleteComment(meetingId)
  const [commenting, setCommenting] = useState(false)

  return (
    <article
      ref={lineRef}
      className={cn(
        'group my-1.5 rounded-sm border-l-2 py-1.5 pr-2 pl-1 transition-colors',
        active ? 'border-brand bg-brand-soft' : 'border-transparent',
        matched && 'bg-highlight/50',
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Avatar name={segment.speaker} />
        <span className="font-medium text-fg-secondary">{segment.speaker}</span>
        <span aria-hidden className="text-fg-hint">
          ·
        </span>
        <button
          type="button"
          onClick={onSeek}
          title="Play from here"
          className="rounded-sm text-fg-link underline underline-offset-[3px]"
        >
          {formatClock(segment.start_ms)}
        </button>
        <div
          className={cn(
            'ml-auto flex items-center transition-opacity',
            !segment.highlighted &&
              'md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100',
          )}
        >
          <IconButton
            label={segment.highlighted ? 'Remove highlight' : 'Highlight this line'}
            size="sm"
            aria-pressed={segment.highlighted}
            onClick={() =>
              setHighlight.mutate(
                { segmentId: segment.id, highlighted: !segment.highlighted },
                { onError: () => toast('Could not update the highlight', 'error') },
              )
            }
          >
            <Star
              size={16}
              className={cn(segment.highlighted && 'fill-accent-yellow text-accent-yellow')}
            />
          </IconButton>
          <IconButton label="Comment on this line" size="sm" onClick={() => setCommenting(true)}>
            <MessageCircle size={16} />
          </IconButton>
        </div>
      </div>

      <p className="pt-1 pl-[25px] text-[15px] leading-[27.75px] tracking-[0.11px] text-fg-secondary">
        <Highlight text={segment.text} query={term} />
      </p>

      {segment.comments.length > 0 && (
        <ul className="space-y-1.5 pt-2 pl-[25px]">
          {segment.comments.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start gap-2 rounded-sm bg-muted py-1.5 pr-1 pl-3 text-sm text-fg-secondary"
            >
              <span className="min-w-0 flex-1 break-words">{comment.text}</span>
              <span className="shrink-0 pt-0.5 text-xs text-fg-hint">
                {formatDay(comment.created_at)}
              </span>
              <IconButton
                label="Delete comment"
                size="sm"
                onClick={() =>
                  deleteComment.mutate(comment.id, {
                    onError: () => toast('Could not delete the comment', 'error'),
                  })
                }
              >
                <X size={14} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {commenting && (
        <CommentForm
          meetingId={meetingId}
          segmentId={segment.id}
          onDone={() => setCommenting(false)}
        />
      )}
    </article>
  )
}
