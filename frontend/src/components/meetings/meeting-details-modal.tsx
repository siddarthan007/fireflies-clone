'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useUpdateMeeting } from '@/lib/api/meetings'
import type { MeetingListItem } from '@/lib/types'
import { toDateTimeInput } from '@/lib/utils/format'
import { DeleteMeetingModal } from './delete-meeting-modal'

const toList = (text: string) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

// Edit a meeting's title, date, participants and tags, or delete it.
export function MeetingDetailsModal({
  meeting,
  open,
  onClose,
}: {
  meeting: MeetingListItem
  open: boolean
  onClose: () => void
}) {
  const toast = useToast()
  const update = useUpdateMeeting(meeting.id)

  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [participants, setParticipants] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const errorBox = useRef<HTMLParagraphElement>(null)

  // Start from the saved values every time the dialog opens.
  useEffect(() => {
    if (!open) return
    setTitle(meeting.title)
    setWhen(toDateTimeInput(meeting.meeting_at))
    setParticipants(meeting.participants.join(', '))
    setTags(meeting.tags.join(', '))
    setError('')
  }, [open, meeting])

  useEffect(() => {
    if (error) errorBox.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await update.mutateAsync({
        title,
        meeting_at: new Date(when).toISOString(),
        participants: toList(participants),
        tags: toList(tags),
      })
      toast('Meeting updated')
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the changes')
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Meeting details"
        footer={
          <>
            <Button
              size="lg"
              variant="ghost"
              className="mr-auto text-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
            <Button size="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="lg"
              variant="primary"
              type="submit"
              form="meeting-details"
              disabled={!title.trim() || !when || update.isPending}
            >
              {update.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <form id="meeting-details" onSubmit={save} className="space-y-4 pb-1">
          <Field label="Title" htmlFor="details-title">
            <Input
              id="details-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              data-autofocus
            />
          </Field>
          <Field label="Date and time" htmlFor="details-when">
            <Input
              id="details-when"
              type="datetime-local"
              value={when}
              onChange={(event) => setWhen(event.target.value)}
            />
          </Field>
          <Field label="Participants" htmlFor="details-people" hint="Separate names with commas.">
            <Input
              id="details-people"
              value={participants}
              onChange={(event) => setParticipants(event.target.value)}
            />
          </Field>
          <Field label="Tags" htmlFor="details-tags" optional hint="Separate tags with commas.">
            <Input
              id="details-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </Field>
          {error && (
            <p
              ref={errorBox}
              role="alert"
              className="rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}
        </form>
      </Modal>

      <DeleteMeetingModal
        meeting={meeting}
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onDeleted={onClose}
      />
    </>
  )
}
