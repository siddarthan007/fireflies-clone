'use client'

import { Bot, Building2, Hash, Plus, Search, Upload } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils/cn'

const CHANNELS = [
  { label: 'My Meetings', icon: Hash, ready: true },
  { label: 'All Meetings', icon: Building2, ready: false },
  { label: 'Voice Agent Meetings', icon: Bot, ready: false },
  { label: 'Uploads', icon: Upload, ready: false },
]

// Second column of the Meetings page. Only My Meetings is real, since every meeting is yours.
export function ChannelsPanel() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const visible = CHANNELS.filter((channel) =>
    channel.label.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <aside className="hidden w-[250px] shrink-0 flex-col border-r border-line bg-subtle lg:flex">
      <div className="flex h-[52px] shrink-0 items-center border-b border-line px-4">
        <div className="relative w-full">
          <Search size={16} className="absolute top-1/2 left-2 -translate-y-1/2 text-fg-hint" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search channels"
            aria-label="Search channels"
            className="h-[33px] w-full rounded-sm border border-line-subtle bg-muted pr-2 pl-8 text-sm text-fg-secondary transition-colors focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 border-b border-line p-3">
        {visible.map((channel) => {
          const Icon = channel.icon
          const classes =
            'flex h-10 w-full items-center gap-3 rounded-sm px-3 text-left text-sm transition-colors'
          return channel.ready ? (
            <Link
              key={channel.label}
              href="/meetings"
              aria-current="page"
              className={cn(classes, 'bg-brand-soft font-medium text-fg-brand')}
            >
              <Icon size={16} />
              {channel.label}
            </Link>
          ) : (
            <button
              key={channel.label}
              type="button"
              title={`${channel.label} (coming soon)`}
              onClick={() => toast(`${channel.label} is coming soon`)}
              className={cn(classes, 'text-fg-muted hover:bg-fg/5 hover:text-fg-secondary')}
            >
              <Icon size={16} />
              {channel.label}
              <span className="ml-auto text-xs text-fg-hint">Soon</span>
            </button>
          )
        })}
        {visible.length === 0 && (
          <p className="px-3 py-2 text-sm text-fg-muted">No channels found</p>
        )}
      </div>

      <div className="space-y-2 p-3">
        <p className="flex h-9 items-center px-3 text-sm text-fg-secondary">All channels</p>
        <div className="flex flex-col items-center gap-4 px-2 pt-2 text-center">
          <Hash size={20} className="text-accent-pink" />
          <p className="text-sm text-fg-secondary">Channels are coming soon</p>
          <Button icon={<Plus size={20} />} onClick={() => toast('Channels are coming soon')}>
            Channel
          </Button>
        </div>
      </div>
    </aside>
  )
}
