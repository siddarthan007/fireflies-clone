'use client'

import Link from 'next/link'
import { Maximize2, Minimize2, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { MeetingDetailsModal } from '@/components/meetings/meeting-details-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { FredIcon } from '@/components/ui/fred'
import { IconButton } from '@/components/ui/icon-button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import { UnderlineTabs } from '@/components/ui/underline-tabs'
import { useMeeting } from '@/lib/api/meetings'
import { usePlayer } from '@/lib/hooks/use-player'
import { cn } from '@/lib/utils/cn'
import { DetailHeader } from './detail-header'
import { MeetingChat } from './meeting-chat'
import { NotesPane } from './notes-pane'
import { PlayerBar } from './player-bar'
import { SidePanel } from './side-panel'
import { ToolRail, type PanelId } from './tool-rail'
import { TranscriptPane } from './transcript-pane'

type RightTab = 'askfred' | 'transcript'

// Column widths on large screens: tool rail, optional side panel, notes, right panel.
function gridColumns(sidePanelOpen: boolean, expanded: boolean) {
  if (expanded) {
    return sidePanelOpen
      ? 'lg:grid-cols-[48px_320px_minmax(0,1fr)]'
      : 'lg:grid-cols-[48px_minmax(0,1fr)]'
  }
  return sidePanelOpen
    ? 'lg:grid-cols-[48px_320px_minmax(0,1fr)_clamp(372.4px,37.24%,548.8px)]'
    : 'lg:grid-cols-[48px_minmax(0,1fr)_clamp(372.4px,37.24%,548.8px)]'
}

function LoadingView() {
  return (
    <div className="flex h-dvh flex-col" aria-busy>
      <Skeleton className="h-14 rounded-none" />
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}

// One meeting: notes in the middle, AskFred or the transcript on the right, a player below.
export function MeetingView({ meetingId }: { meetingId: number }) {
  const meeting = useMeeting(meetingId)
  const player = usePlayer((meeting.data?.duration_seconds ?? 0) * 1000)

  const [rightTab, setRightTab] = useState<RightTab>('askfred')
  const [mobilePane, setMobilePane] = useState<'notes' | 'right'>('notes') // phones show one pane
  const [sidePanel, setSidePanel] = useState<PanelId | null>(null)
  const [expanded, setExpanded] = useState<'notes' | 'transcript' | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [searchRequests, setSearchRequests] = useState(0)
  const [followRequest, setFollowRequest] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  function showTranscript() {
    setRightTab('transcript')
    setMobilePane('right')
    setExpanded((value) => (value === 'notes' ? null : value))
    setFollowRequest((value) => value + 1)
  }

  function seek(ms: number) {
    player.seek(ms)
    showTranscript()
  }

  function togglePlayback() {
    if (!player.playing) showTranscript()
    player.toggle()
  }

  // A link like /meetings/3?t=125000 (from search results) opens the transcript at that moment.
  const loaded = meeting.data !== undefined
  useEffect(() => {
    if (!loaded) return
    const stamp = new URLSearchParams(window.location.search).get('t')
    const time = Number(stamp)
    if (stamp !== null && Number.isFinite(time) && time >= 0) seek(time)
    // Run once when the meeting loads (seek changes on every render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  // The browser tab shows the meeting's name.
  const title = meeting.data?.title
  useEffect(() => {
    if (title) document.title = `${title} - Fireflies`
  }, [title])

  // The search button in the tool rail focuses the transcript's find box once it is on screen.
  useEffect(() => {
    if (searchRequests > 0) searchRef.current?.focus()
  }, [searchRequests])

  if (meeting.isLoading) return <LoadingView />

  if (meeting.isError || !meeting.data) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <EmptyState
          title="Meeting not found"
          description="It may have been deleted, or the API is not reachable."
          action={
            <Link
              href="/meetings"
              className="inline-flex h-10 items-center rounded-sm bg-brand px-4 font-display text-sm font-medium text-white hover:bg-brand-hover"
            >
              Back to meetings
            </Link>
          }
        />
      </div>
    )
  }

  const data = meeting.data
  const mobileValue = mobilePane === 'notes' ? 'notes' : rightTab

  return (
    <div className="flex h-dvh flex-col bg-page">
      <DetailHeader meeting={data} onEditDetails={() => setDetailsOpen(true)} />

      <div className="shrink-0 border-b border-line-subtle p-2 lg:hidden">
        <SegmentedControl
          label="Meeting sections"
          value={mobileValue}
          onChange={(value) => {
            if (value === 'notes') setMobilePane('notes')
            else if (value === 'transcript') showTranscript()
            else {
              setRightTab(value)
              setMobilePane('right')
            }
          }}
          options={[
            { value: 'notes', label: 'Notes' },
            { value: 'askfred', label: 'AskFred' },
            { value: 'transcript', label: 'Transcript' },
          ]}
        />
      </div>

      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-1 gap-px bg-line-subtle',
          gridColumns(sidePanel !== null, expanded !== null),
        )}
      >
        <div className="hidden bg-page lg:block">
          <ToolRail
            panel={sidePanel}
            onPanel={setSidePanel}
            onSearch={() => {
              showTranscript()
              setSearchRequests((count) => count + 1)
            }}
          />
        </div>

        {sidePanel && (
          <div className="hidden bg-page lg:block">
            <SidePanel
              panel={sidePanel}
              meetingId={meetingId}
              onSeek={seek}
              onClose={() => setSidePanel(null)}
            />
          </div>
        )}

        <div
          className={cn(
            'min-h-0 bg-page',
            mobilePane !== 'notes' && 'max-lg:hidden',
            expanded === 'transcript' && 'lg:hidden',
          )}
        >
          <NotesPane
            meeting={data}
            onSeek={seek}
            onEditDetails={() => setDetailsOpen(true)}
            expanded={expanded === 'notes'}
            onToggleExpanded={() => setExpanded((value) => (value === 'notes' ? null : 'notes'))}
          />
        </div>

        <div
          className={cn(
            'flex min-h-0 flex-col bg-page',
            mobilePane !== 'right' && 'max-lg:hidden',
            expanded === 'notes' && 'lg:hidden',
          )}
        >
          <div className="hidden h-12 shrink-0 items-center justify-between gap-2 border-b border-line-subtle px-4 lg:flex">
            <UnderlineTabs
              label="Right panel"
              value={rightTab}
              onChange={(value) => (value === 'transcript' ? showTranscript() : setRightTab(value))}
              tabs={[
                {
                  value: 'askfred',
                  label: (
                    <>
                      <FredIcon size={16} /> AskFred
                    </>
                  ),
                },
                { value: 'transcript', label: 'Transcript' },
              ]}
            />
            {rightTab === 'transcript' && (
              <div className="flex gap-1">
                <IconButton
                  label={expanded === 'transcript' ? 'Show notes' : 'Expand transcript'}
                  onClick={() =>
                    setExpanded((value) => (value === 'transcript' ? null : 'transcript'))
                  }
                >
                  {expanded === 'transcript' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </IconButton>
                <IconButton label="Edit transcript (coming soon)" disabled>
                  <Pencil size={20} />
                </IconButton>
              </div>
            )}
          </div>
          {/* Both stay mounted so switching tabs keeps the chat and the transcript scroll position. */}
          <div className={cn('min-h-0 flex-1', rightTab !== 'askfred' && 'hidden')}>
            <MeetingChat meetingId={meetingId} />
          </div>
          <div className={cn('min-h-0 flex-1', rightTab !== 'transcript' && 'hidden')}>
            <TranscriptPane
              meetingId={meetingId}
              player={player}
              searchRef={searchRef}
              visible={rightTab === 'transcript' && expanded !== 'notes'}
              followRequest={followRequest}
              onSeek={seek}
            />
          </div>
        </div>
      </div>

      <PlayerBar player={player} meetingId={meetingId} onToggle={togglePlayback} onSeek={seek} />
      <MeetingDetailsModal
        meeting={data}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  )
}
