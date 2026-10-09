'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAddActionItem, useDeleteActionItem, useUpdateActionItem } from '@/lib/api/action-items'
import type { ActionItem, MeetingDetail } from '@/lib/types'
import { cn } from '@/lib/utils/cn'
import { formatDueDate } from '@/lib/utils/format'

interface Fields {
  text: string
  assignee: string
  due: string // "2026-10-09" or ""
}

// One form for both adding and editing an item.
function ItemForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: Fields
  submitLabel: string
  pending: boolean
  onSubmit: (fields: Fields) => void
  onCancel: () => void
}) {
  const [fields, setFields] = useState(initial)
  const set = (patch: Partial<Fields>) => setFields((current) => ({ ...current, ...patch }))

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (fields.text.trim()) onSubmit(fields)
      }}
      onKeyDown={(event) => event.key === 'Escape' && onCancel()}
      className="space-y-2 rounded-lg border border-line bg-muted p-3"
    >
      <Input
        aria-label="Action item"
        placeholder="What needs to be done?"
        value={fields.text}
        maxLength={500}
        onChange={(event) => set({ text: event.target.value })}
        className="h-9 bg-layer"
        autoFocus
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Assignee"
          placeholder="Assignee"
          value={fields.assignee}
          maxLength={120}
          onChange={(event) => set({ assignee: event.target.value })}
          className="h-8 w-40 bg-layer"
        />
        <Input
          aria-label="Due date"
          type="date"
          value={fields.due}
          onChange={(event) => set({ due: event.target.value })}
          className="h-8 w-40 bg-layer"
        />
        <div className="ml-auto flex gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={!fields.text.trim() || pending}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

const toFields = (item: ActionItem): Fields => ({
  text: item.text,
  assignee: item.assignee ?? '',
  due: item.due_date ?? '',
})

function ItemRow({ item }: { item: ActionItem }) {
  const toast = useToast()
  const update = useUpdateActionItem()
  const remove = useDeleteActionItem()
  const [editing, setEditing] = useState(false)
  const failed = () => toast('Something went wrong. Please try again.', 'error')

  if (editing) {
    return (
      <li>
        <ItemForm
          initial={toFields(item)}
          submitLabel="Save"
          pending={update.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(fields) =>
            update.mutate(
              {
                id: item.id,
                text: fields.text.trim(),
                assignee: fields.assignee.trim() || null,
                due_date: fields.due || null,
              },
              {
                onSuccess: () => {
                  setEditing(false)
                  toast('Action item updated')
                },
                onError: failed,
              },
            )
          }
        />
      </li>
    )
  }

  return (
    <li className="group flex items-start gap-3 py-1.5">
      <Checkbox
        aria-label={`Mark "${item.text}" as ${item.done ? 'not done' : 'done'}`}
        checked={item.done}
        className="mt-0.5"
        onChange={(event) => {
          const done = event.target.checked // read it now: React resets the box until the save finishes
          update.mutate(
            { id: item.id, done },
            { onSuccess: () => done && toast('Action item completed'), onError: failed },
          )
        }}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', item.done ? 'text-fg-hint line-through' : 'text-fg-secondary')}>
          {item.text}
        </p>
        {(item.assignee || item.due_date) && (
          <p className="text-xs text-fg-hint">
            {[item.assignee, item.due_date && `Due ${formatDueDate(item.due_date)}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <IconButton label="Edit action item" size="sm" onClick={() => setEditing(true)}>
          <Pencil size={16} />
        </IconButton>
        <IconButton
          label="Delete action item"
          size="sm"
          onClick={() =>
            remove.mutate(item.id, {
              onSuccess: () => toast('Action item deleted'),
              onError: failed,
            })
          }
        >
          <Trash2 size={16} />
        </IconButton>
      </div>
    </li>
  )
}

// The meeting's tasks: tick them off, edit them, add new ones.
export function ActionItems({ meeting }: { meeting: MeetingDetail }) {
  const toast = useToast()
  const add = useAddActionItem(meeting.id)
  const [adding, setAdding] = useState(false)
  const items = meeting.action_items
  const open = items.filter((item) => !item.done).length

  return (
    <section aria-label="Action items" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-fg">
          Action items <span className="font-normal text-fg-hint">({open} open)</span>
        </h3>
        {!adding && (
          <Button variant="ghost" icon={<Plus size={16} />} onClick={() => setAdding(true)}>
            Add
          </Button>
        )}
      </div>

      {items.length === 0 && !adding && (
        <p className="text-sm text-fg-muted">No action items yet.</p>
      )}

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {adding && (
        <ItemForm
          initial={{ text: '', assignee: '', due: '' }}
          submitLabel="Add"
          pending={add.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={(fields) =>
            add.mutate(
              {
                text: fields.text.trim(),
                assignee: fields.assignee.trim() || null,
                due_date: fields.due || null,
              },
              {
                onSuccess: () => {
                  setAdding(false)
                  toast('Action item added')
                },
                onError: () => toast('Could not add the action item', 'error'),
              },
            )
          }
        />
      )}
    </section>
  )
}
