'use client'

import { ArrowDownUp, Search, X } from 'lucide-react'
import { useState } from 'react'

import { IconButton } from '@/components/ui/icon-button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { cn } from '@/lib/utils/cn'
import { FiltersPopover, type LibraryFilters } from './filters-popover'

export type Scope = 'hosted' | 'shared' | null

// The row above the meeting list: scope toggles, Filters, sort order and title search.
export function MeetingsToolbar({
  scope,
  onScope,
  filters,
  onFilters,
  sort,
  onSort,
  query,
  onQuery,
}: {
  scope: Scope
  onScope: (scope: Scope) => void
  filters: LibraryFilters
  onFilters: (filters: LibraryFilters) => void
  sort: 'newest' | 'oldest'
  onSort: (sort: 'newest' | 'oldest') => void
  query: string
  onQuery: (query: string) => void
}) {
  const [searching, setSearching] = useState(query !== '')

  const toggleClass = (on: boolean, position: string) =>
    cn(
      'h-[34px] border border-line px-3 text-sm transition-colors max-sm:flex-1 max-sm:px-2',
      position,
      on ? 'bg-strong text-fg' : 'bg-layer text-fg-muted hover:bg-muted',
    )

  return (
    <div className="flex h-[72px] shrink-0 items-center gap-1 border-b border-line-subtle px-5 max-sm:h-auto max-sm:flex-wrap max-sm:gap-2 max-sm:px-4 max-sm:py-3">
      <div
        role="group"
        aria-label="Whose meetings"
        className="flex rounded-sm shadow-card max-sm:w-full"
      >
        <button
          type="button"
          aria-pressed={scope === 'hosted'}
          onClick={() => onScope(scope === 'hosted' ? null : 'hosted')}
          className={toggleClass(scope === 'hosted', 'rounded-l-sm')}
        >
          Hosted by me
        </button>
        <button
          type="button"
          aria-pressed={scope === 'shared'}
          onClick={() => onScope(scope === 'shared' ? null : 'shared')}
          className={toggleClass(scope === 'shared', '-ml-px rounded-r-sm')}
        >
          Shared with me
        </button>
      </div>
      <div aria-hidden className="mx-4 h-7 w-px bg-line max-sm:hidden" />
      <FiltersPopover filters={filters} onChange={onFilters} />

      <div className="ml-auto flex items-center gap-1">
        <Menu
          trigger={
            <IconButton label={sort === 'newest' ? 'Sort: newest first' : 'Sort: oldest first'}>
              <ArrowDownUp size={20} />
            </IconButton>
          }
        >
          <MenuItem checked={sort === 'newest'} onSelect={() => onSort('newest')}>
            Newest first
          </MenuItem>
          <MenuItem checked={sort === 'oldest'} onSelect={() => onSort('oldest')}>
            Oldest first
          </MenuItem>
        </Menu>

        {searching ? (
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-hint"
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  onQuery('')
                  setSearching(false)
                }
              }}
              placeholder="Search titles"
              aria-label="Search meeting titles"
              className="h-8 w-44 rounded-sm border border-line bg-muted pr-8 pl-8 text-sm text-fg-secondary focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none max-md:h-11 max-md:pr-11 sm:w-56"
            />
            <IconButton
              label="Close search"
              size="sm"
              className="absolute top-1 right-1 max-md:top-0 max-md:right-0"
              onClick={() => {
                onQuery('')
                setSearching(false)
              }}
            >
              <X size={16} />
            </IconButton>
          </div>
        ) : (
          <IconButton
            label="Search titles"
            variant="outline"
            className="size-8"
            onClick={() => setSearching(true)}
          >
            <Search size={20} />
          </IconButton>
        )}
      </div>
    </div>
  )
}
