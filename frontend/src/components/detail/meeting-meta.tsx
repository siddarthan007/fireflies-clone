'use client'

import { Pencil, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useUpdateMeeting } from '@/lib/api/meetings'
import { useUser } from '@/lib/api/user'
import type { MeetingDetail } from '@/lib/types'
import { formatDuration, formatFullDate } from '@/lib/utils/format'

// The meeting title. Click it to rename: Enter or clicking away saves, Escape cancels.
export function TitleEditor({ meeting }: { meeting: MeetingDetail }) {
  const toast = useToast()
  const update = useUpdateMeeting(meeting.id)
  const [value, setValue] = useState(meeting.title)
  const cancelled = useRef(false)

  useEffect(() => setValue(meeting.title), [meeting.title])

  async function save() {
    const title = value.trim()
    if (!title || title === meeting.title) {
      setValue(meeting.title)
      return
    }
    try {
      await update.mutateAsync({ title })
      toast('Title updated')
    } catch {
      setValue(meeting.title)
      toast('Could not rename the meeting', 'error')
    }
  }

  return (
    <input
      aria-label="Meeting title"
      value={value}
      maxLength={200}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        if (cancelled.current) cancelled.current = false
        else save()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') {
          cancelled.current = true // blur runs before the state reset is rendered
          setValue(meeting.title)
          event.currentTarget.blur()
        }
      }}
      className="-mx-2 w-full truncate rounded-sm border border-transparent bg-transparent px-2 py-0.5 font-display text-2xl font-medium text-fg transition-colors hover:border-line focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    />
  )
}

function TagEditor({ meeting }: { meeting: MeetingDetail }) {
  const toast = useToast()
  const update = useUpdateMeeting(meeting.id)
  const [draft, setDraft] = useState('')
  const tags = meeting.tags

  const save = (next: string[]) =>
    update.mutate({ tags: next }, { onError: () => toast('Could not update the tags', 'error') })

  function add() {
    const name = draft.trim()
    setDraft('')
    if (name && !tags.some((tag) => tag.toLowerCase() === name.toLowerCase())) save([...tags, name])
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-sm bg-strong py-0.5 pr-1 pl-2 text-xs text-fg-secondary"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => save(tags.filter((item) => item !== tag))}
            className="rounded-sm p-0.5 hover:bg-fg/10"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        aria-label="Add a tag"
        placeholder="Add tag"
        maxLength={60}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={add}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            add()
          }
        }}
        className="h-6 w-20 rounded-sm bg-transparent px-1 text-xs text-fg-secondary placeholder:text-fg-hint focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
      />
    </div>
  )
}

// Under the title: who, when, how long, who was there, and the tags.
export function MeetingMeta({
  meeting,
  onEditDetails,
}: {
  meeting: MeetingDetail
  onEditDetails: () => void
}) {
  const { data: user } = useUser()
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
        <span className="flex items-center gap-2">
          <Avatar name={user?.name ?? '?'} />
          <span className="underline underline-offset-2">{user?.name}</span>
        </span>
        <span>{formatFullDate(meeting.meeting_at)}</span>
        <span>{formatDuration(meeting.duration_seconds)}</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-2 text-sm text-fg-muted">
        <span>Participants:</span>
        <span className="text-fg-secondary">{meeting.participants.join(', ') || 'None'}</span>
        <Button
          variant="ghost"
          className="h-6 px-1.5"
          icon={<Pencil size={12} />}
          onClick={onEditDetails}
        >
          Edit
        </Button>
      </div>
      <TagEditor meeting={meeting} />
    </div>
  )
}
