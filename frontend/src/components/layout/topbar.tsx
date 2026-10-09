'use client'

import {
  Calendar,
  ChevronDown,
  Clock,
  Menu as MenuIcon,
  Mic,
  Search,
  Upload,
  Video,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { LiveMeetingModal } from '@/components/meetings/live-meeting-modal'
import { NewMeetingModal } from '@/components/meetings/new-meeting-modal'
import { IconButton } from '@/components/ui/icon-button'
import { Menu, MenuItem } from '@/components/ui/menu'
import { useToast } from '@/components/ui/toast'
import { navigationTitle } from './navigation'
import { NotificationsMenu } from './notifications-menu'

export function Topbar({
  onOpenMenu,
  onOpenSearch,
}: {
  onOpenMenu: () => void
  onOpenSearch: () => void
}) {
  const pathname = usePathname()
  const toast = useToast()
  const [liveOpen, setLiveOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <header className="grid h-[52px] shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 border-b-[0.5px] border-line bg-page px-3 lg:grid-cols-[1fr_333px_3fr]">
      <div className="flex min-w-0 items-center gap-1">
        <IconButton
          label="Open menu"
          aria-controls="workspace-navigation"
          aria-haspopup="dialog"
          className="md:hidden"
          onClick={onOpenMenu}
        >
          <MenuIcon size={20} />
        </IconButton>
        {/* AskFred shows its own title in the side panel on wide screens */}
        <h1
          className={
            pathname.startsWith('/ask-fred')
              ? 'truncate text-sm text-fg-icon lg:invisible'
              : 'truncate text-sm text-fg-icon'
          }
        >
          {navigationTitle(pathname)}
        </h1>
      </div>

      <button
        type="button"
        onClick={onOpenSearch}
        className="relative hidden h-[34px] w-80 items-center gap-2 justify-self-center rounded-sm border border-line bg-muted pr-20 pl-2 text-left text-sm text-fg-hint transition-colors hover:border-line-strong lg:flex"
      >
        <Search size={20} className="shrink-0" />
        <span className="truncate">Search by title or keyword</span>
        <kbd className="absolute right-2 font-sans text-xs">Ctrl + K</kbd>
      </button>

      <div className="flex items-center justify-end gap-3">
        <IconButton label="Search" className="lg:hidden" onClick={onOpenSearch}>
          <Search size={20} />
        </IconButton>
        {pathname === '/' && (
          <button
            type="button"
            title="Free meeting plans (coming soon)"
            aria-label="Free meeting plans (coming soon)"
            onClick={() => toast('Meeting plans are coming soon')}
            className="hidden h-8 items-center gap-2 text-sm text-fg-muted xl:flex"
          >
            <span className="rounded-sm bg-success-soft p-0.5 text-success">
              <Clock size={12} />
            </span>
            Free meetings
          </button>
        )}
        <button
          type="button"
          title="Plans and billing are coming soon"
          onClick={() => toast('Plans and billing are coming soon')}
          className="btn-upgrade hidden h-8 rounded-sm px-2 font-display text-sm font-medium sm:block"
        >
          Upgrade
        </button>
        <NotificationsMenu />
        <div className="flex">
          <button
            type="button"
            title="Live capture is coming soon"
            onClick={() => setLiveOpen(true)}
            className="flex h-8 items-center gap-1 rounded-l-sm bg-brand pr-3 pl-2 font-display text-sm font-medium text-white transition-colors hover:bg-brand-hover max-md:h-11"
          >
            <Video size={20} />
            <span className="max-sm:sr-only">Capture</span>
          </button>
          <Menu
            className="min-w-[260px]"
            trigger={
              <button
                type="button"
                aria-label="More capture options"
                className="flex h-8 w-[29px] items-center justify-center rounded-r-sm border-l border-white/10 bg-brand text-white transition-colors hover:bg-brand-hover max-md:h-11"
              >
                <ChevronDown size={20} />
              </button>
            }
          >
            <MenuItem icon={<Video size={16} />} onSelect={() => setLiveOpen(true)}>
              Add to live meeting
            </MenuItem>
            <MenuItem icon={<Calendar size={16} />} soon>
              Schedule new meeting
            </MenuItem>
            <MenuItem icon={<Upload size={16} />} onSelect={() => setUploadOpen(true)}>
              Upload transcript
            </MenuItem>
            <MenuItem icon={<Mic size={16} />} soon>
              Start recording
            </MenuItem>
          </Menu>
        </div>
      </div>

      <LiveMeetingModal open={liveOpen} onClose={() => setLiveOpen(false)} />
      <NewMeetingModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </header>
  )
}
