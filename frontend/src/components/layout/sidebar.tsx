'use client'

import { UserPlus, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmailIcon } from '@/components/ui/email-icon'
import { IconButton } from '@/components/ui/icon-button'
import { useToast } from '@/components/ui/toast'
import { useDialog } from '@/lib/hooks/use-dialog'
import { useDismiss } from '@/lib/hooks/use-dismiss'
import { cn } from '@/lib/utils/cn'
import { NAVIGATION_GROUPS, SECONDARY_NAVIGATION, type NavigationItem } from './navigation'
import { SidebarHeader } from './sidebar-header'

function itemClass(active: boolean, collapsed: boolean) {
  return cn(
    'flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-sm transition-colors max-md:h-11',
    active ? 'bg-strong text-fg' : 'text-fg-muted hover:bg-fg/5 hover:text-fg',
    collapsed && 'justify-center px-0',
  )
}

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavigationItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  const Icon = item.icon
  const label = item.comingSoon ? `${item.label} (coming soon)` : item.label
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? label : undefined}
        title={label}
        className={itemClass(active, collapsed)}
      >
        <span className="flex size-6 shrink-0 items-center justify-center">
          <Icon size={collapsed ? 16 : 20} />
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.comingSoon && (
          <span className="ml-auto shrink-0 text-xs text-fg-hint">Coming soon</span>
        )}
      </Link>
    </li>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  drawerOpen: boolean
  onCloseDrawer: () => void
}

export function Sidebar({ collapsed, onToggle, drawerOpen, onCloseDrawer }: SidebarProps) {
  return (
    <>
      <aside
        id="workspace-sidebar"
        aria-label="Workspace sidebar"
        className={cn(
          'ease-ui hidden shrink-0 flex-col border-r border-line-subtle bg-subtle transition-[width] duration-[240ms] md:flex',
          collapsed ? 'w-14' : 'w-[232px]',
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </aside>
      <SidebarDrawer open={drawerOpen} onClose={onCloseDrawer} />
    </>
  )
}

// Hover previews preserve editor focus. Click and keyboard opens use the native modal.
export function SidebarDrawer({
  open,
  onClose,
  hover = false,
}: {
  open: boolean
  onClose: () => void
  hover?: boolean
}) {
  const panel = useRef<HTMLElement>(null)
  const dialog = useDialog(open && !hover, onClose)
  useDismiss(open && hover, onClose, panel)
  const content = (
    <SidebarContent collapsed={false} onToggle={onClose} onNavigate={onClose} drawer />
  )

  if (hover && open) {
    return (
      <div className="fixed inset-0 z-40">
        <div className="absolute inset-0 bg-overlay" aria-hidden />
        <aside
          id="workspace-navigation"
          ref={panel}
          aria-label="Workspace navigation"
          onPointerLeave={(event) => event.pointerType === 'mouse' && onClose()}
          className="sidebar-drawer absolute inset-y-0 left-0 flex w-[232px] flex-col bg-subtle shadow-modal"
        >
          {content}
        </aside>
      </div>
    )
  }

  return (
    <dialog
      {...dialog}
      id="workspace-navigation"
      aria-label="Workspace navigation"
      className="sidebar-drawer fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[232px] max-w-[calc(100vw-32px)] border-0 bg-subtle p-0 shadow-modal max-md:w-[280px]"
    >
      {open && content}
    </dialog>
  )
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
  drawer = false,
}: {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  drawer?: boolean
}) {
  const toast = useToast()
  return (
    <div className="group/sidebar flex h-full min-h-0 flex-col">
      <SidebarHeader collapsed={collapsed} onToggle={onToggle} drawer={drawer} />
      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
        {NAVIGATION_GROUPS.map((group) => (
          <ul
            key={group[0].href}
            className="relative flex flex-col gap-0.5 p-2 after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-line-subtle"
          >
            {group.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </ul>
        ))}
        <div className="p-2">
          <button
            type="button"
            title="Upgrade (coming soon)"
            aria-label={collapsed ? 'Upgrade (coming soon)' : undefined}
            onClick={() => toast('Plans and billing are coming soon')}
            className={itemClass(false, collapsed)}
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              <Zap size={collapsed ? 16 : 20} />
            </span>
            {!collapsed && (
              <>
                <span>Upgrade</span>
                <span className="ml-auto text-xs text-fg-hint">Coming soon</span>
              </>
            )}
          </button>
        </div>
      </nav>
      <SidebarFooter collapsed={collapsed} onNavigate={onNavigate} />
    </div>
  )
}

function SidebarFooter({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const toast = useToast()
  const [showInvite, setShowInvite] = useState(true)
  return (
    <nav aria-label="Secondary" className="shrink-0">
      {!collapsed && (
        <div className="px-3 pb-2">
          <button
            type="button"
            title="Email assistant (coming soon)"
            onClick={() => toast('The email assistant is coming soon')}
            className="flex h-8 w-full items-center gap-2 rounded-sm bg-brand-soft px-3 text-left text-sm text-fg transition-colors hover:bg-brand-soft-hover max-md:h-11"
          >
            <EmailIcon />
            <span>Try Email Assistant</span>
          </button>
        </div>
      )}
      <ul className="flex flex-col gap-0.5 p-2">
        {collapsed && (
          <li>
            <button
              type="button"
              aria-label="Invite teammates (coming soon)"
              title="Invite teammates (coming soon)"
              onClick={() => toast('Teams are coming soon')}
              className={itemClass(false, true)}
            >
              <UserPlus size={16} />
            </button>
          </li>
        )}
        {SECONDARY_NAVIGATION.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </ul>
      {!collapsed && showInvite && (
        <div className="sidebar-invite px-4 pb-4">
          <div className="relative flex flex-col gap-4 rounded-lg bg-brand-soft p-3">
            <span className="absolute top-3 left-3 text-xs text-fg-hint">Coming soon</span>
            <IconButton
              label="Dismiss invitation"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setShowInvite(false)}
            >
              <X size={16} />
            </IconButton>
            <p className="pt-8 text-sm text-fg">Invite coworkers to your Fireflies team</p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => toast('Teams are coming soon')}
            >
              Create Team
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
