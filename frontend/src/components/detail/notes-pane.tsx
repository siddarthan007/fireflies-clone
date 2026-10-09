'use client'

import { Maximize2, Minimize2, Sparkles, Video } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { IconButton } from '@/components/ui/icon-button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { MeetingDetail } from '@/lib/types'
import { ActionItems } from './action-items'
import { MeetingMeta, TitleEditor } from './meeting-meta'
import { Outline } from './outline'
import { SummaryEmpty } from './summary-empty'

// The middle of the meeting page: title, details, summary, action items and outline.
export function NotesPane({
  meeting,
  onSeek,
  onEditDetails,
  expanded,
  onToggleExpanded,
}: {
  meeting: MeetingDetail
  onSeek: (ms: number) => void
  onEditDetails: () => void
  expanded: boolean
  onToggleExpanded: () => void
}) {
  const [tab, setTab] = useState<'notes' | 'skills'>('notes')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative flex shrink-0 items-center justify-center px-4 pt-3 pb-2">
        <SegmentedControl
          label="Meeting views"
          size="md"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'notes', label: 'Notes' },
            {
              value: 'skills',
              label: (
                <>
                  AI Skills <span className="text-xs text-fg-hint">Coming soon</span>
                </>
              ),
            },
          ]}
        />
        <IconButton
          label={expanded ? 'Show the side panel' : 'Expand notes'}
          className="absolute right-4 max-lg:hidden"
          onClick={onToggleExpanded}
        >
          {expanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] space-y-10 px-8 pt-12 pb-12 max-sm:px-4 max-sm:pt-6">
          {tab === 'skills' ? (
            <EmptyState
              icon={<Sparkles size={32} />}
              title="AI Skills are coming soon"
              description="Run reusable prompts, like a follow-up email, on any meeting."
            />
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <TitleEditor meeting={meeting} />
                  <Button
                    icon={<Video size={20} />}
                    disabled
                    title="This meeting has no video"
                    className="h-9 shrink-0 text-fg-disabled max-sm:hidden"
                  >
                    Video
                  </Button>
                </div>
                <MeetingMeta meeting={meeting} onEditDetails={onEditDetails} />
              </div>

              {meeting.overview ? (
                <section aria-label="Overview" className="space-y-2">
                  <h3 className="text-sm font-medium text-fg">Overview</h3>
                  <p className="text-sm leading-6 text-fg-secondary">{meeting.overview}</p>
                </section>
              ) : (
                <SummaryEmpty />
              )}

              <ActionItems meeting={meeting} />
              <Outline chapters={meeting.chapters} onSeek={onSeek} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
