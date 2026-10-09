'use client'

import Link from 'next/link'

import { MeetingThumb } from '@/components/meetings/meeting-card'
import { Avatar } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { useUpdateActionItem } from '@/lib/api/action-items'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils/cn'
import { formatDueDate } from '@/lib/utils/format'

function todayAsText() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// The tasks of one meeting, under the meeting's title.
export function TaskGroup({
  meetingId,
  title,
  tasks,
}: {
  meetingId: number
  title: string
  tasks: Task[]
}) {
  const toast = useToast()
  const update = useUpdateActionItem()
  const today = todayAsText()

  return (
    <section aria-label={title} className="overflow-hidden rounded-xl border border-line bg-layer">
      <Link
        href={`/meetings/${meetingId}`}
        className="flex items-center gap-3 border-b border-line-subtle px-5 py-3 transition-colors hover:bg-muted"
      >
        <MeetingThumb size="md" />
        <span className="truncate text-sm font-medium text-fg">{title}</span>
      </Link>
      <ul className="divide-y divide-line-subtle">
        {tasks.map((task) => {
          const overdue = !task.done && task.due_date !== null && task.due_date < today
          return (
            <li key={task.id} className="flex items-start gap-3 px-5 py-3">
              <Checkbox
                aria-label={`Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`}
                checked={task.done}
                className="mt-0.5"
                onChange={(event) =>
                  update.mutate(
                    { id: task.id, done: event.target.checked },
                    { onError: () => toast('Could not update the task', 'error') },
                  )
                }
              />
              <p
                className={cn(
                  'min-w-0 flex-1 text-sm',
                  task.done ? 'text-fg-hint line-through' : 'text-fg-secondary',
                )}
              >
                {task.text}
              </p>
              <div className="flex shrink-0 items-center gap-3 text-sm text-fg-muted max-sm:flex-col max-sm:items-end max-sm:gap-1">
                {task.assignee && (
                  <span className="flex items-center gap-1.5">
                    <Avatar name={task.assignee} />
                    {task.assignee}
                  </span>
                )}
                {task.due_date && (
                  <span className={cn(overdue && 'font-medium text-danger')}>
                    {overdue ? 'Overdue, ' : ''}
                    {formatDueDate(task.due_date)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
