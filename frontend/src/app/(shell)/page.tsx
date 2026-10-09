'use client'

import {
  CalendarCheck,
  CalendarCog,
  CircleHelp,
  Info,
  ListChecks,
  MessageCircle,
  Rss,
  Settings,
  Sparkle,
  SquareCheck,
  Sun,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { AskFredRail } from '@/components/askfred/askfred-rail'
import { MeetingRow } from '@/components/meetings/meeting-row'
import { NewMeetingModal } from '@/components/meetings/new-meeting-modal'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { useTasks } from '@/lib/api/action-items'
import { useMeetings } from '@/lib/api/meetings'
import { useFirstName, useHiGreeting } from '@/lib/api/user'
import { cn } from '@/lib/utils/cn'
import { greetingFor } from '@/lib/utils/format'

type Tab = 'recent' | 'upcoming' | 'feed'

const SUGGESTIONS = [
  {
    icon: <Sparkle size={16} className="fill-accent-yellow text-accent-yellow" />,
    text: "What's my day looking like?",
  },
  {
    icon: <CircleHelp size={16} className="text-accent-red" />,
    text: 'Pending tasks across all meetings',
  },
  {
    icon: <SquareCheck size={16} className="fill-accent-green text-white" />,
    text: 'List out my action items from the past week',
  },
]

function AssistantCard({
  tile,
  icon,
  title,
  subtitle,
  onClick,
}: {
  tile: string
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[200px] flex-col items-start gap-4 rounded-lg border border-line bg-layer p-4 text-left shadow-card transition-colors hover:bg-muted max-sm:w-full"
    >
      <span className={cn('flex size-8 items-center justify-center rounded-md text-white', tile)}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium text-fg-secondary">{title}</span>
        <span className="truncate text-sm text-fg-hint">{subtitle}</span>
      </span>
    </button>
  )
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export default function HomePage() {
  const router = useRouter()
  const toast = useToast()
  const firstName = useFirstName()
  const hi = useHiGreeting()
  const meetings = useMeetings({ limit: 8 })
  const openTasks = useTasks({ done: false })
  const [tab, setTab] = useState<Tab>('recent')
  const [uploadOpen, setUploadOpen] = useState(false)

  // The greeting depends on the visitor's clock, so it is set after the page loads.
  const [greeting, setGreeting] = useState('Hello')
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), [])

  const recent = meetings.data?.items ?? []
  const total = meetings.data?.total ?? 0

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1 overflow-y-auto">
        <div
          aria-hidden
          className="home-band pointer-events-none absolute inset-x-0 top-0 h-[280px]"
        />

        <div className="relative mx-auto max-w-[948px] px-4 pt-10 pb-12 sm:px-16">
          <div className="flex items-center justify-between gap-4">
            <h1 className="flex flex-wrap items-center gap-3 font-display text-2xl font-medium text-fg">
              {greeting}
              {firstName && `, ${firstName}`}
              <Sun
                size={24}
                className="shrink-0 fill-accent-yellow text-accent-orange"
                aria-hidden
              />
            </h1>
            <Button
              variant="text"
              size="inline"
              icon={<MessageCircle size={16} />}
              onClick={() => toast('Feedback is coming soon')}
            >
              Feedback
            </Button>
          </div>

          <section aria-label="Personal Assistant" className="mt-6 space-y-3">
            <div className="flex items-center justify-between py-1">
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <Sparkle size={16} />
                Personal Assistant
                <Info size={16} />
              </p>
              <Button
                variant="text"
                size="inline"
                icon={<Settings size={16} />}
                onClick={() => toast('Assistant settings are coming soon')}
              >
                Manage
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <AssistantCard
                tile="tile-brief"
                icon={<Rss size={20} />}
                title="Daily Brief"
                subtitle="Coming soon"
                onClick={() => toast('Daily Brief is coming soon')}
              />
              <AssistantCard
                tile="tile-prep"
                icon={<CalendarCheck size={20} />}
                title="Meeting Prep"
                subtitle="Coming soon"
                onClick={() => toast('Meeting Prep is coming soon')}
              />
              <AssistantCard
                tile="tile-tasks"
                icon={<ListChecks size={20} />}
                title="Tasks"
                subtitle={
                  openTasks.isError
                    ? 'Could not load tasks'
                    : openTasks.data
                      ? plural(openTasks.data.length, 'open task')
                      : 'Loading...'
                }
                onClick={() => router.push('/tasks')}
              />
            </div>
          </section>

          <section className="mt-11">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SegmentedControl
                label="Meeting lists"
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'recent', label: 'Recent' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'feed', label: 'AI Feed' },
                ]}
              />
              <Button
                variant="text"
                size="inline"
                icon={<CalendarCog size={16} />}
                onClick={() => router.push('/settings')}
              >
                Settings
              </Button>
            </div>

            <div className="mt-5">
              {tab === 'recent' &&
                (meetings.isLoading ? (
                  <div className="space-y-2" aria-busy>
                    {[0, 1, 2].map((row) => (
                      <Skeleton key={row} className="h-[60px] rounded-lg" />
                    ))}
                  </div>
                ) : meetings.isError ? (
                  <EmptyState
                    title="Could not load your meetings"
                    description="Check that the API is running, then try again."
                    action={<Button onClick={() => meetings.refetch()}>Try again</Button>}
                  />
                ) : recent.length === 0 ? (
                  <EmptyState
                    title="No meetings yet"
                    description="Upload a transcript to see notes, action items and search."
                    action={
                      <Button variant="primary" onClick={() => setUploadOpen(true)}>
                        Upload transcript
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {recent.map((meeting) => (
                      <MeetingRow key={meeting.id} meeting={meeting} />
                    ))}
                    {total > recent.length && (
                      <Link
                        href="/meetings"
                        className="mx-auto mt-4 block w-fit text-sm font-medium text-fg-brand hover:underline"
                      >
                        View all {total} meetings
                      </Link>
                    )}
                  </>
                ))}

              {tab === 'upcoming' && (
                <EmptyState
                  title="Scheduling is coming soon"
                  description="Meetings you schedule will show up here."
                />
              )}

              {tab === 'feed' && (
                <EmptyState
                  title="AI Feed is coming soon"
                  description="Highlights from your live meetings will appear here."
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <AskFredRail
        label="AskFred"
        className="w-[411.6px]"
        greeting={[hi, 'Get ready for your meeting']}
        suggestions={SUGGESTIONS}
      />
      <NewMeetingModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
