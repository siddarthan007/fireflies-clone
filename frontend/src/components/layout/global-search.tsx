'use client'

import { Video, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { FredIcon } from '@/components/ui/fred'
import { Highlight } from '@/components/ui/highlight'
import { IconButton } from '@/components/ui/icon-button'
import { useMeetings } from '@/lib/api/meetings'
import { useSearch } from '@/lib/api/search'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { useDialog } from '@/lib/hooks/use-dialog'
import { cn } from '@/lib/utils/cn'
import { formatClock, formatDay } from '@/lib/utils/format'

interface Row {
  key: string
  href: string
  title: string
  detail?: string // second line
  date?: string
  highlight?: boolean // mark the search term inside the title
}

// The Ctrl+K dialog: recent meetings until you type, then matching titles and transcript lines.
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const activeRow = useRef<HTMLAnchorElement>(null)
  const term = useDebounce(query.trim())

  const recent = useMeetings({ limit: 5 })
  const search = useSearch(term)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const searching = term !== ''
  const rows: Row[] = searching
    ? [
        ...(search.data?.meetings ?? []).map((meeting) => ({
          key: `m${meeting.id}`,
          href: `/meetings/${meeting.id}`,
          title: meeting.title,
          date: formatDay(meeting.meeting_at, true),
          highlight: true,
        })),
        ...(search.data?.segments ?? []).map((hit, index) => ({
          key: `s${hit.meeting_id}-${hit.start_ms}-${index}`,
          href: `/meetings/${hit.meeting_id}?t=${hit.start_ms}`,
          title: hit.text,
          detail: `${hit.speaker} at ${formatClock(hit.start_ms)}, ${hit.meeting_title}`,
          highlight: true,
        })),
      ]
    : (recent.data?.items ?? []).map((meeting) => ({
        key: `r${meeting.id}`,
        href: `/meetings/${meeting.id}`,
        title: meeting.title,
        date: formatDay(meeting.meeting_at, true),
      }))

  const result = searching ? search : recent
  const waiting = query.trim() !== term || result.isLoading || result.isPlaceholderData
  const failed = result.isError

  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: 'nearest' })
  }, [active, waiting, rows.length])

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => Math.min(Math.max(current + step, 0), Math.max(rows.length - 1, 0)))
    } else if (event.key === 'Enter' && !waiting && !failed && rows[active]) {
      onClose()
      router.push(rows[active].href)
    }
  }

  return (
    <dialog
      {...useDialog(open, onClose)}
      aria-label="Search meetings"
      className="mx-auto mt-[8vh] w-[calc(100%-32px)] max-w-[618px] rounded-xl border border-line bg-elevated p-0 shadow-modal"
    >
      {open && (
        <div onKeyDown={onKeyDown}>
          <div className="flex h-14 items-center gap-2 border-b border-line-subtle px-4">
            <input
              data-autofocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              placeholder="Search by title or keyword.."
              aria-label="Search by title or keyword"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg-secondary outline-none placeholder:text-fg-hint"
            />
            <IconButton label="Close search" onClick={onClose}>
              <X size={20} />
            </IconButton>
          </div>

          <div className="max-h-[50vh] overflow-y-auto px-2 pt-4 pb-1">
            <p className="px-3 pb-1 text-xs text-fg-hint">
              {searching ? 'Results' : 'Recent Meeting'}
            </p>
            {!waiting &&
              !failed &&
              rows.map((row, index) => (
                <Link
                  key={row.key}
                  ref={index === active ? activeRow : undefined}
                  href={row.href}
                  onClick={onClose}
                  onMouseMove={() => setActive(index)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2',
                    index === active && 'bg-strong',
                  )}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-fg-brand">
                    <Video size={12} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] leading-5 font-medium text-fg">
                      {row.highlight ? <Highlight text={row.title} query={term} /> : row.title}
                    </span>
                    {row.detail && (
                      <span className="block truncate text-xs text-fg-hint">{row.detail}</span>
                    )}
                  </span>
                  {row.date && <span className="text-xs font-medium text-fg-hint">{row.date}</span>}
                </Link>
              ))}
            {waiting && (
              <p role="status" className="px-3 py-4 text-sm text-fg-muted">
                Searching...
              </p>
            )}
            {failed && (
              <div role="alert" className="px-3 py-4 text-sm text-fg-muted">
                Could not load meetings.{' '}
                <button
                  type="button"
                  onClick={() => result.refetch()}
                  className="rounded-sm font-medium text-fg-brand hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
            {!waiting && !failed && rows.length === 0 && (
              <p className="px-3 py-4 text-sm text-fg-muted">
                {searching ? `No results for "${term}"` : 'Nothing to show yet'}
              </p>
            )}
          </div>

          <div className="border-t border-line-subtle p-3.5">
            <Link
              href="/ask-fred"
              onClick={onClose}
              className="flex h-10 items-center gap-2.5 rounded-sm bg-brand-soft px-3 text-xs text-fg-secondary"
            >
              <FredIcon size={20} />
              <span className="flex-1">Ask Fred anything about your meetings</span>
              <span className="font-medium text-fg-brand">Try AskFred</span>
            </Link>
          </div>
        </div>
      )}
    </dialog>
  )
}
