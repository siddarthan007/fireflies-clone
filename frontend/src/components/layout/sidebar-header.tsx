'use client'

import { PanelLeft } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { useUser } from '@/lib/api/user'
import { cn } from '@/lib/utils/cn'
import { ProfileMenu } from './profile-menu'

export function SidebarHeader({
  collapsed,
  onToggle,
  drawer = false,
}: {
  collapsed: boolean
  onToggle: () => void
  drawer?: boolean
}) {
  const { data: user } = useUser()

  return (
    <div
      className={cn(
        'group/sidebar-header flex h-14 shrink-0 items-center',
        collapsed ? 'justify-center' : 'justify-between pr-3.5 pl-[18px]',
      )}
    >
      {collapsed ? (
        <button
          type="button"
          aria-label="Expand sidebar"
          title="Expand sidebar"
          aria-controls="workspace-sidebar"
          aria-expanded={false}
          onClick={onToggle}
          className="sidebar-avatar-button group/expand relative flex size-8 items-center justify-center rounded-sm hover:bg-strong max-md:size-11"
        >
          <span className="sidebar-avatar transition-opacity duration-150 group-hover/expand:opacity-0 group-focus-visible/expand:opacity-0">
            <Avatar name={user?.name ?? 'Siddartha Nepal'} />
          </span>
          <PanelLeft
            size={20}
            className="sidebar-open-icon absolute text-fg-icon opacity-0 transition-opacity duration-150 group-hover/expand:opacity-100 group-focus-visible/expand:opacity-100"
          />
        </button>
      ) : (
        <>
          <ProfileMenu />
          <IconButton
            label={drawer ? 'Close navigation' : 'Collapse sidebar'}
            aria-controls={drawer ? 'workspace-navigation' : 'workspace-sidebar'}
            onClick={onToggle}
            className="sidebar-collapse opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-focus-within/sidebar-header:opacity-100"
          >
            <PanelLeft size={16} />
          </IconButton>
        </>
      )}
    </div>
  )
}
