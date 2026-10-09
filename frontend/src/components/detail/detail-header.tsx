'use client'

import {
  Download,
  FileText,
  Globe,
  Link2,
  Menu as MenuIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'

import { ProfileMenu } from '@/components/layout/profile-menu'
import { NotificationsMenu } from '@/components/layout/notifications-menu'
import { SidebarDrawer } from '@/components/layout/sidebar'
import { DeleteMeetingModal } from '@/components/meetings/delete-meeting-modal'
import { NewMeetingModal } from '@/components/meetings/new-meeting-modal'
import { IconButton } from '@/components/ui/icon-button'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { useToast } from '@/components/ui/toast'
import { exportUrl } from '@/lib/api/meetings'
import type { MeetingDetail } from '@/lib/types'

// The bar across the top of a meeting: where you are, plus share, new meeting and account.
export function DetailHeader({
  meeting,
  onEditDetails,
}: {
  meeting: MeetingDetail
  onEditDetails: () => void
}) {
  const toast = useToast()
  const [navMode, setNavMode] = useState<'hover' | 'click' | null>(null)
  const closedAt = useRef(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const download = (format: 'markdown' | 'txt') =>
    window.location.assign(exportUrl(meeting.id, format))

  function closeNavigation() {
    closedAt.current = Date.now()
    setNavMode(null)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast('Link copied'),
      () => toast('Could not copy the link', 'error'),
    )
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line-subtle bg-page pr-4 pl-[11px]">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton
          label="Open menu"
          aria-expanded={navMode !== null}
          aria-controls="workspace-navigation"
          aria-haspopup="dialog"
          onClick={() => setNavMode('click')}
          onPointerEnter={(event) => {
            // Closing the overlay can expose the trigger under a stationary pointer.
            if (event.pointerType === 'mouse' && Date.now() - closedAt.current > 200)
              setNavMode('hover')
          }}
        >
          <MenuIcon size={20} />
        </IconButton>
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-sm text-fg-icon"
        >
          <Link href="/meetings" className="shrink-0 hover:text-fg hover:underline">
            #All Meetings
          </Link>
          <span aria-hidden className="shrink-0">
            /
          </span>
          <span aria-current="page" className="truncate max-sm:hidden">
            {meeting.title}
          </span>
        </nav>
        <Menu
          align="start"
          trigger={
            <IconButton label="More actions">
              <MoreHorizontal size={20} />
            </IconButton>
          }
        >
          <MenuItem icon={<Pencil size={16} />} onSelect={onEditDetails}>
            Edit details
          </MenuItem>
          <MenuItem icon={<Download size={16} />} onSelect={() => download('markdown')}>
            Export as Markdown
          </MenuItem>
          <MenuItem icon={<FileText size={16} />} onSelect={() => download('txt')}>
            Export as text
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={16} />} onSelect={() => setDeleteOpen(true)}>
            Delete meeting
          </MenuItem>
        </Menu>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          title="Plans and billing are coming soon"
          onClick={() => toast('Plans and billing are coming soon')}
          className="btn-upgrade hidden h-8 rounded-sm px-2 font-display text-sm font-medium md:block"
        >
          Upgrade
        </button>
        <div className="flex">
          <Menu
            trigger={
              <button
                type="button"
                className="flex h-8 items-center gap-1.5 rounded-l-sm bg-brand pr-3 pl-2 font-display text-sm font-medium text-white transition-colors hover:bg-brand-hover max-md:h-11"
              >
                <Globe size={20} />
                <span className="max-sm:sr-only">Share</span>
              </button>
            }
          >
            <p className="px-4 pb-1 text-xs text-fg-hint">Team sharing is coming soon</p>
            <MenuItem icon={<Link2 size={16} />} onSelect={copyLink}>
              Copy link
            </MenuItem>
            <MenuItem icon={<Download size={16} />} onSelect={() => download('markdown')}>
              Download as Markdown
            </MenuItem>
            <MenuItem icon={<FileText size={16} />} onSelect={() => download('txt')}>
              Download as text
            </MenuItem>
          </Menu>
          <button
            type="button"
            aria-label="Copy link"
            title="Copy link"
            onClick={copyLink}
            className="flex size-8 items-center justify-center rounded-r-sm border-l border-white/10 bg-brand text-white transition-colors hover:bg-brand-hover max-md:size-11"
          >
            <Link2 size={16} />
          </button>
        </div>
        <IconButton
          label="New meeting"
          variant="outline"
          className="max-sm:hidden"
          onClick={() => setUploadOpen(true)}
        >
          <Plus size={20} />
        </IconButton>
        <NotificationsMenu />
        <ProfileMenu collapsed avatarSize="lg" align="end" />
      </div>

      <SidebarDrawer
        open={navMode !== null}
        hover={navMode === 'hover'}
        onClose={closeNavigation}
      />
      <NewMeetingModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <DeleteMeetingModal
        meeting={meeting}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </header>
  )
}
