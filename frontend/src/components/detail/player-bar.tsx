'use client'

import { Download, FileText, Pause, Play, RotateCcw, RotateCw, Star } from 'lucide-react'
import type { CSSProperties } from 'react'

import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { useToast } from '@/components/ui/toast'
import { exportUrl, useTranscript } from '@/lib/api/meetings'
import { useSetHighlight } from '@/lib/api/segments'
import { findActiveIndex, type Player } from '@/lib/hooks/use-player'
import { cn } from '@/lib/utils/cn'
import { formatClock } from '@/lib/utils/format'

const SPEEDS = [0.5, 1, 1.25, 1.5, 2]
const SKIP_MS = 10_000

// The bar along the bottom of a meeting: seek line, time, speed, skip, play, download.
export function PlayerBar({
  player,
  meetingId,
  onToggle,
  onSeek,
}: {
  player: Player
  meetingId: number
  onToggle: () => void
  onSeek: (ms: number) => void
}) {
  const toast = useToast()
  const { data: segments = [] } = useTranscript(meetingId)
  const setHighlight = useSetHighlight(meetingId)
  const { currentMs, durationMs } = player
  const percent = durationMs ? (currentMs / durationMs) * 100 : 0
  const current = segments[findActiveIndex(segments, currentMs)]
  const download = (format: 'markdown' | 'txt') =>
    window.location.assign(exportUrl(meetingId, format))

  return (
    <footer className="shrink-0 bg-page pb-4">
      <div className="px-0.5 pt-1 pb-2">
        <input
          type="range"
          className="player-range"
          min={0}
          max={durationMs}
          step={100}
          value={Math.round(currentMs)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Seek"
          aria-valuetext={`${formatClock(currentMs)} of ${formatClock(durationMs)}`}
          style={{ '--progress': `${percent}%` } as CSSProperties} // changes every tick, so not a class
        />
      </div>

      <div className="mt-1.5 grid h-9 grid-cols-[1fr_auto_1fr] items-center px-4">
        <p className="text-sm tabular-nums">
          <span className="text-fg">{formatClock(currentMs)}</span>
          <span className="text-fg-hint"> / {formatClock(durationMs)}</span>
        </p>

        <div className="flex items-center gap-6 max-sm:gap-2">
          <Menu
            align="start"
            className="min-w-24"
            trigger={
              <Button
                variant="ghost"
                className="h-9 px-3 max-sm:hidden"
                aria-label="Playback speed"
              >
                {player.speed}×
              </Button>
            }
          >
            {SPEEDS.map((speed) => (
              <MenuItem
                key={speed}
                checked={speed === player.speed}
                onSelect={() => player.setSpeed(speed)}
              >
                {speed}×
              </MenuItem>
            ))}
          </Menu>
          <IconButton label="Back 10 seconds" onClick={() => onSeek(currentMs - SKIP_MS)}>
            <RotateCcw size={20} />
          </IconButton>
          <button
            type="button"
            aria-label={player.playing ? 'Pause' : 'Play'}
            onClick={onToggle}
            className="flex h-8 w-[50px] items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover max-md:h-11"
          >
            {player.playing ? (
              <Pause size={16} className="fill-current" />
            ) : (
              <Play size={16} className="fill-current" />
            )}
          </button>
          <IconButton label="Forward 10 seconds" onClick={() => onSeek(currentMs + SKIP_MS)}>
            <RotateCw size={20} />
          </IconButton>
          <Menu
            className="min-w-52"
            trigger={
              <IconButton label="Download the transcript">
                <Download size={20} />
              </IconButton>
            }
          >
            <MenuItem icon={<FileText size={16} />} onSelect={() => download('markdown')}>
              Download as Markdown
            </MenuItem>
            <MenuItem icon={<FileText size={16} />} onSelect={() => download('txt')}>
              Download as text
            </MenuItem>
          </Menu>
        </div>

        <div className="flex items-center justify-end max-md:hidden">
          <IconButton
            label={
              current?.highlighted ? 'Remove highlight from this moment' : 'Highlight this moment'
            }
            disabled={!current}
            aria-pressed={current?.highlighted}
            onClick={() =>
              current &&
              setHighlight.mutate(
                { segmentId: current.id, highlighted: !current.highlighted },
                { onError: () => toast('Could not update the highlight', 'error') },
              )
            }
          >
            <Star
              size={20}
              className={cn(current?.highlighted && 'fill-accent-yellow text-accent-yellow')}
            />
          </IconButton>
        </div>
      </div>
    </footer>
  )
}
