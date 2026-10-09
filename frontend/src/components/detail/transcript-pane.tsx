'use client'

import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { IconButton } from '@/components/ui/icon-button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranscript } from '@/lib/api/meetings'
import { findActiveIndex, type Player } from '@/lib/hooks/use-player'
import { TranscriptLine } from './transcript-line'

export function TranscriptPane({
  meetingId,
  player,
  searchRef,
  visible,
  followRequest,
  onSeek,
}: {
  meetingId: number
  player: Player
  searchRef: React.RefObject<HTMLInputElement | null>
  visible: boolean
  followRequest: number
  onSeek: (ms: number) => void
}) {
  const { data: segments, isLoading, isError, refetch } = useTranscript(meetingId)
  const [query, setQuery] = useState('')
  const [current, setCurrent] = useState(0) // which match the find box is on
  const [following, setFollowing] = useState(true) // keep the playing line in view
  const rows = useRef(new Map<number, HTMLElement>())
  const scroller = useRef<HTMLDivElement>(null)

  const term = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      term && segments
        ? segments.flatMap((segment, index) =>
            segment.text.toLowerCase().includes(term) ? [index] : [],
          )
        : [],
    [segments, term],
  )
  const activeIndex = findActiveIndex(segments ?? [], player.currentMs)
  const matchIndex = matches[current] ?? -1

  function scrollTo(index: number) {
    const container = scroller.current
    if (!container || container.clientHeight === 0) return
    const row = rows.current.get(index)
    const top = row
      ? container.scrollTop +
        row.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        container.clientHeight * 0.2
      : 0
    container.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  useEffect(() => {
    setFollowing(true)
  }, [followRequest])

  useEffect(() => {
    if (following && visible) scrollTo(activeIndex)
  }, [activeIndex, following, visible, followRequest])

  useEffect(() => {
    if (matchIndex >= 0) scrollTo(matchIndex)
  }, [matchIndex])

  const goToMatch = (step: number) =>
    setCurrent((value) => (matches.length ? (value + step + matches.length) % matches.length : 0))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="relative">
          <Search
            size={20}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-hint"
          />
          <input
            ref={searchRef}
            value={query}
            placeholder="Find in transcript"
            aria-label="Find in transcript"
            onChange={(event) => {
              setQuery(event.target.value)
              setCurrent(0)
              if (event.target.value.trim()) setFollowing(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') goToMatch(event.shiftKey ? -1 : 1)
              if (event.key === 'Escape') setQuery('')
            }}
            className="h-[38px] w-full rounded-sm border border-muted bg-muted pr-24 pl-10 text-sm text-fg-secondary transition-colors placeholder:text-fg-hint focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none max-md:h-11 max-md:pr-36"
          />
          {term && (
            <div className="absolute top-1 right-1 flex items-center gap-0.5 max-md:top-0 max-md:right-0">
              <span className="px-1 text-xs text-fg-muted" aria-live="polite">
                {matches.length ? `${current + 1} of ${matches.length}` : 'No matches'}
              </span>
              <IconButton
                label="Previous match"
                size="sm"
                disabled={!matches.length}
                onClick={() => goToMatch(-1)}
              >
                <ChevronUp size={16} />
              </IconButton>
              <IconButton
                label="Next match"
                size="sm"
                disabled={!matches.length}
                onClick={() => goToMatch(1)}
              >
                <ChevronDown size={16} />
              </IconButton>
            </div>
          )}
        </div>
      </div>

      <div
        ref={scroller}
        className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-6"
        onWheel={() => setFollowing(false)}
        onTouchMove={() => setFollowing(false)}
      >
        {isLoading && (
          <div className="space-y-4 pt-4" aria-busy>
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-14 w-full" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <EmptyState
            title="Could not load the transcript"
            action={<Button onClick={() => refetch()}>Try again</Button>}
          />
        )}
        {segments?.length === 0 && <EmptyState title="This meeting has no transcript" />}

        {segments?.map((segment, index) => (
          <TranscriptLine
            key={segment.id}
            segment={segment}
            meetingId={meetingId}
            active={index === activeIndex}
            matched={index === matchIndex}
            term={term}
            onSeek={() => {
              setFollowing(true)
              onSeek(segment.start_ms)
            }}
            lineRef={(element) => {
              if (element) rows.current.set(index, element)
              else rows.current.delete(index)
            }}
          />
        ))}

        {!following && activeIndex >= 0 && (
          <div className="sticky bottom-2 flex justify-center">
            <Button
              icon={<ChevronUp size={16} />}
              className="h-9 bg-layer pr-4 shadow-menu"
              onClick={() => {
                setFollowing(true)
                scrollTo(activeIndex)
              }}
            >
              Back to current line
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
