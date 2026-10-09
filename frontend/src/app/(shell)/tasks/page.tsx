'use client'

import { ListTodo } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { TaskGroup } from '@/components/tasks/task-group'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useTasks } from '@/lib/api/action-items'
import { useUser } from '@/lib/api/user'
import type { Task } from '@/lib/types'

type Scope = 'mine' | 'all'

// The tasks arrive ordered by meeting, so one pass puts each meeting's tasks together.
function groupByMeeting(tasks: Task[]) {
  const groups: { meetingId: number; title: string; tasks: Task[] }[] = []
  for (const task of tasks) {
    const last = groups.at(-1)
    if (last?.meetingId === task.meeting_id) last.tasks.push(task)
    else groups.push({ meetingId: task.meeting_id, title: task.meeting_title, tasks: [task] })
  }
  return groups
}

export default function TasksPage() {
  const toast = useToast()
  const { data: user } = useUser()
  const [scope, setScope] = useState<Scope>('mine')

  // "My Tasks" are the ones assigned to the demo user, so wait until we know the name.
  const tasks = useTasks(
    { assignee: scope === 'mine' ? user?.name : undefined },
    scope === 'all' || !!user,
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[900px] space-y-8 px-6 py-10 max-sm:px-4">
        <div className="flex items-center justify-between">
          <SegmentedControl
            label="Which tasks"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'mine', label: 'My Tasks' },
              { value: 'all', label: 'All Tasks' },
            ]}
          />
          <Button
            variant="ghost"
            className="text-fg-hint"
            onClick={() => toast('Feedback is coming soon')}
          >
            Share Feedback
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted px-3 py-2 text-sm text-fg-secondary">
          Automatically send all your tasks to your work apps.
          <button
            type="button"
            onClick={() => toast('Task integrations are coming soon')}
            className="shrink-0 font-medium text-fg-brand hover:underline"
          >
            Connect
          </button>
        </div>

        {tasks.isLoading || tasks.isPending ? (
          <div className="space-y-4" aria-busy>
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : tasks.isError ? (
          <EmptyState
            title="Could not load your tasks"
            description="Check that the API is running, then try again."
            action={<Button onClick={() => tasks.refetch()}>Try again</Button>}
          />
        ) : tasks.data.length === 0 ? (
          <EmptyState
            icon={<ListTodo size={32} />}
            title="All your meeting tasks in one place"
            description="Manage, assign and update all your meeting tasks here."
            action={
              <Link
                href="/meetings"
                className="inline-flex h-10 items-center rounded-sm bg-brand px-4 font-display text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                Go to meetings
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {groupByMeeting(tasks.data).map((group) => (
              <TaskGroup key={group.meetingId} {...group} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
