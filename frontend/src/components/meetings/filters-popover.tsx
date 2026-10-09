'use client'

import { Calendar, Clock, Eye, ListFilter, Mic, Tag as TagIcon, User, Users } from 'lucide-react'
import { useCallback, useRef, useState, type ComponentType } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tag } from '@/components/ui/tag'
import { useFilterOptions } from '@/lib/api/meetings'
import { useDismiss } from '@/lib/hooks/use-dismiss'
import { cn } from '@/lib/utils/cn'

export interface LibraryFilters {
  participants: string[]
  tags: string[]
  dateFrom: string // "2026-10-01" or ""
  dateTo: string
}

export const NO_FILTERS: LibraryFilters = { participants: [], tags: [], dateFrom: '', dateTo: '' }

export function countFilters(filters: LibraryFilters) {
  return (
    filters.participants.length + filters.tags.length + (filters.dateFrom || filters.dateTo ? 1 : 0)
  )
}

type Category = 'participants' | 'dates' | 'tags'

const CATEGORIES: { id: Category; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'dates', label: 'Date Range', icon: Calendar },
  { id: 'tags', label: 'Tags', icon: TagIcon },
]

// Filters the real app has that this project does not build.
const NOT_BUILT = [
  { label: 'Hosted by', icon: User },
  { label: 'Duration', icon: Clock },
  { label: 'Captured From', icon: Mic },
  { label: 'Privacy', icon: Eye },
]

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

// The Filters button and its two-pane popover: categories on the left, choices on the right.
export function FiltersPopover({
  filters,
  onChange,
}: {
  filters: LibraryFilters
  onChange: (filters: LibraryFilters) => void
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>('participants')
  const [search, setSearch] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, root)

  const { data: options, isLoading } = useFilterOptions()
  const active = countFilters(filters)

  const people = (options?.participants ?? []).filter((name) =>
    name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  function clearCurrent() {
    if (category === 'participants') onChange({ ...filters, participants: [] })
    else if (category === 'tags') onChange({ ...filters, tags: [] })
    else onChange({ ...filters, dateFrom: '', dateTo: '' })
  }

  return (
    <div ref={root} className="relative">
      <Button
        icon={<ListFilter size={20} />}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn(open && 'border-brand bg-brand-soft-hover text-fg-brand ring-1 ring-brand')}
      >
        Filters{active > 0 && <span className="text-fg-brand">· {active}</span>}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter meetings"
          className="menu-in absolute top-full left-0 z-30 mt-1 flex min-h-[362px] w-[487px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-line bg-elevated shadow-menu max-sm:flex-col"
        >
          <div className="flex w-[212px] shrink-0 flex-col justify-between border-r border-line-subtle bg-subtle py-2.5 pr-4 pl-2.5 max-sm:w-full max-sm:border-r-0 max-sm:border-b max-sm:py-2 max-sm:pr-2.5">
            <ul className="flex flex-col gap-1.5 max-sm:flex-row max-sm:overflow-x-auto">
              {CATEGORIES.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setCategory(id)}
                    aria-pressed={category === id}
                    className={cn(
                      'flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-sm whitespace-nowrap transition-colors',
                      category === id
                        ? 'bg-brand-soft font-medium text-fg-brand'
                        : 'text-fg-secondary hover:bg-fg/5',
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                </li>
              ))}
              {NOT_BUILT.map(({ label, icon: Icon }) => (
                <li key={label} className="max-sm:hidden">
                  <span className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-fg-muted opacity-60">
                    <Icon size={16} />
                    <span className="flex-1">{label}</span>
                    <Tag tone="neutral">Soon</Tag>
                  </span>
                </li>
              ))}
            </ul>
            <Button
              disabled={active === 0}
              className="mt-4 text-fg-muted max-sm:hidden"
              onClick={() => onChange(NO_FILTERS)}
            >
              Clear All Filters
            </Button>
          </div>

          <div className="min-w-0 flex-1 px-3 py-4">
            <div className="flex items-center gap-2 pb-1.5">
              {category === 'participants' ? (
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search participants"
                  aria-label="Search participants"
                  className="h-8"
                />
              ) : (
                <p className="flex-1 text-sm font-medium text-fg-secondary">
                  {category === 'dates' ? 'Date range (UTC)' : 'Tags'}
                </p>
              )}
              <Button variant="ghost" className="ml-auto text-fg-muted" onClick={clearCurrent}>
                Clear all
              </Button>
            </div>

            {isLoading && <Skeleton className="mt-3 h-12" />}

            {category === 'participants' &&
              people.map((name) => (
                <label
                  key={name}
                  className="flex h-12 cursor-pointer items-center justify-between rounded-md px-2 hover:bg-muted"
                >
                  <span className="flex items-center gap-2 text-sm text-fg">
                    <Avatar name={name} size="md" />
                    {name}
                  </span>
                  <Checkbox
                    checked={filters.participants.includes(name)}
                    onChange={() =>
                      onChange({ ...filters, participants: toggle(filters.participants, name) })
                    }
                  />
                </label>
              ))}
            {category === 'participants' && !isLoading && people.length === 0 && (
              <p className="px-2 pt-3 text-sm text-fg-muted">No participants found</p>
            )}

            {category === 'tags' &&
              (options?.tags ?? []).map((tag) => (
                <label
                  key={tag.name}
                  className="flex h-12 cursor-pointer items-center justify-between rounded-md px-2 hover:bg-muted"
                >
                  <span className="text-sm text-fg">
                    {tag.name} <span className="text-fg-hint">({tag.meeting_count})</span>
                  </span>
                  <Checkbox
                    checked={filters.tags.includes(tag.name)}
                    onChange={() => onChange({ ...filters, tags: toggle(filters.tags, tag.name) })}
                  />
                </label>
              ))}
            {category === 'tags' && !isLoading && options?.tags.length === 0 && (
              <p className="px-2 pt-3 text-sm text-fg-muted">No tags yet</p>
            )}

            {category === 'dates' && (
              <div className="space-y-3 pt-3">
                <label className="block space-y-1.5 text-sm text-fg-secondary">
                  From
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    max={filters.dateTo || undefined}
                    onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
                  />
                </label>
                <label className="block space-y-1.5 text-sm text-fg-secondary">
                  To
                  <Input
                    type="date"
                    value={filters.dateTo}
                    min={filters.dateFrom || undefined}
                    onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
