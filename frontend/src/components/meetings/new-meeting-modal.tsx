'use client'

import { FileText, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type DragEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Textarea, fieldClass } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useToast } from '@/components/ui/toast'
import { useCreateMeeting, useUploadMeeting } from '@/lib/api/meetings'
import type { TranscriptFormat } from '@/lib/types'
import { cn } from '@/lib/utils/cn'
import { toDateTimeInput } from '@/lib/utils/format'

const EXAMPLES: Record<TranscriptFormat, string> = {
  txt: 'Riya  00:00\nThanks for joining. Let us start with the roadmap.\n\nTom  00:12\nSounds good.',
  vtt: 'WEBVTT\n\n00:00:00.000 --> 00:00:06.000\n<v Siddartha Nepal>Thanks for joining.</v>',
  json: '{"sentences": [{"speaker": "Siddartha Nepal", "start_time": 0, "end_time": 6, "text": "Thanks for joining."}]}',
}

const blankForm = () => ({
  mode: 'file' as 'file' | 'paste',
  title: '',
  when: toDateTimeInput(new Date().toISOString()),
  participants: '',
  file: null as File | null,
  format: 'txt' as TranscriptFormat,
  text: '',
})

// Create a meeting from a transcript file or pasted text.
export function NewMeetingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const upload = useUploadMeeting()
  const create = useCreateMeeting()

  const [form, setForm] = useState(blankForm)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const errorBox = useRef<HTMLParagraphElement>(null)
  const update = (patch: Partial<ReturnType<typeof blankForm>>) =>
    setForm((current) => ({ ...current, ...patch }))

  useEffect(() => {
    if (open) {
      setForm(blankForm())
      setError('')
    }
  }, [open])

  // The dialog body scrolls, so bring a new error into view.
  useEffect(() => {
    if (error) errorBox.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  const ready = form.mode === 'file' ? form.file !== null : form.text.trim() !== ''
  const pending = upload.isPending || create.isPending
  const meetingAt = form.when ? new Date(form.when).toISOString() : undefined
  const participants = form.participants
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      let meeting
      if (form.mode === 'file' && form.file) {
        const data = new FormData()
        data.append('file', form.file)
        if (form.title.trim()) data.append('title', form.title.trim())
        if (meetingAt) data.append('meeting_at', meetingAt)
        meeting = await upload.mutateAsync(data)
      } else {
        meeting = await create.mutateAsync({
          title: form.title.trim() || undefined,
          meeting_at: meetingAt,
          participants,
          transcript: { format: form.format, content: form.text },
        })
      }
      toast('Meeting created')
      onClose()
      router.push(`/meetings/${meeting.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the meeting')
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) update({ file })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload transcript"
      footer={
        <>
          <Button size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="lg"
            variant="primary"
            type="submit"
            form="new-meeting"
            disabled={!ready || pending}
          >
            {pending ? 'Creating...' : 'Create meeting'}
          </Button>
        </>
      }
    >
      <form id="new-meeting" onSubmit={submit} className="space-y-4 pb-1">
        <Field label="Meeting title" htmlFor="meeting-title" optional>
          <Input
            id="meeting-title"
            value={form.title}
            onChange={(event) => update({ title: event.target.value })}
            placeholder="E.g. Product team sync"
            maxLength={200}
            data-autofocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date and time" htmlFor="meeting-when">
            <Input
              id="meeting-when"
              type="datetime-local"
              value={form.when}
              onChange={(event) => update({ when: event.target.value })}
            />
          </Field>
          <Field label="Participants" htmlFor="meeting-people" optional>
            <Input
              id="meeting-people"
              value={form.participants}
              onChange={(event) => update({ participants: event.target.value })}
              placeholder="Siddartha Nepal, Harshita Rao"
              disabled={form.mode === 'file'}
              title={
                form.mode === 'file' ? 'Uploaded files list their speakers as participants' : ''
              }
            />
          </Field>
        </div>

        <SegmentedControl
          label="Transcript source"
          value={form.mode}
          onChange={(mode) => update({ mode })}
          options={[
            { value: 'file', label: 'Upload file' },
            { value: 'paste', label: 'Paste text' },
          ]}
        />

        {form.mode === 'file' ? (
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors focus-within:border-brand focus-within:ring-1 focus-within:ring-brand',
              dragging
                ? 'border-brand bg-brand-soft'
                : 'border-line-strong bg-muted hover:bg-strong',
            )}
          >
            <input
              type="file"
              accept=".txt,.vtt,.json"
              className="sr-only"
              onChange={(event) => update({ file: event.target.files?.[0] ?? null })}
            />
            {form.file ? (
              <FileText size={24} className="text-fg-brand" />
            ) : (
              <Upload size={24} className="text-fg-icon" />
            )}
            <span className="text-sm font-medium text-fg-secondary">
              {form.file ? form.file.name : 'Choose a transcript file or drop it here'}
            </span>
            <span className="text-xs text-fg-hint">.txt, .vtt or .json, up to 2 MB</span>
          </label>
        ) : (
          <div className="space-y-2">
            <select
              aria-label="Transcript format"
              value={form.format}
              onChange={(event) => update({ format: event.target.value as TranscriptFormat })}
              className={cn(fieldClass, 'h-8 w-auto py-0 pr-8')}
            >
              <option value="txt">Plain text (.txt)</option>
              <option value="vtt">WebVTT (.vtt)</option>
              <option value="json">JSON (.json)</option>
            </select>
            <Textarea
              aria-label="Transcript text"
              rows={7}
              value={form.text}
              onChange={(event) => update({ text: event.target.value })}
              placeholder={EXAMPLES[form.format]}
              className="font-mono text-xs"
            />
          </div>
        )}

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
  )
}
