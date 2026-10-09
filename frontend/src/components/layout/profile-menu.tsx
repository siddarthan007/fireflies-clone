'use client'

import { ChevronDown, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Avatar } from '@/components/ui/avatar'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { useUser } from '@/lib/api/user'
import { useTheme } from '@/lib/hooks/use-theme'

// The account row at the top of the sidebar. There is no login, so this is the demo user.
export function ProfileMenu({
  collapsed = false,
  avatarSize = 'sm',
  align = 'start',
}: {
  collapsed?: boolean // show only the avatar
  avatarSize?: 'sm' | 'lg'
  align?: 'start' | 'end' // which edge of the avatar the menu lines up with
}) {
  const { data: user } = useUser()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const name = user?.name ?? 'Demo user'

  return (
    <Menu
      align={align}
      trigger={
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-2.5 rounded-sm text-sm font-medium text-fg-secondary"
        >
          <Avatar name={name} size={avatarSize} />
          {!collapsed && (
            <span className="flex items-center gap-1">
              {name.split(' ')[0]}
              <ChevronDown size={16} className="text-fg-icon" />
            </span>
          )}
        </button>
      }
    >
      <div className="px-4 pb-2">
        <p className="text-sm font-medium text-fg">{name}</p>
        <p className="text-xs text-fg-hint">{user?.email}</p>
      </div>
      <MenuSeparator />
      <MenuItem
        icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </MenuItem>
      <MenuItem icon={<Settings size={16} />} onSelect={() => router.push('/settings')}>
        Settings
      </MenuItem>
      <MenuItem icon={<LogOut size={16} />} soon>
        Sign out
      </MenuItem>
    </Menu>
  )
}
