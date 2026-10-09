import { Bell } from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'
import { Menu } from '@/components/ui/menu'

export function NotificationsMenu() {
  return (
    <Menu
      trigger={
        <IconButton label="Notifications (coming soon)" className="size-9 max-md:size-11">
          <Bell size={20} />
        </IconButton>
      }
    >
      <div className="w-64 px-4 py-3">
        <p className="text-sm font-medium text-fg">Notifications</p>
        <p className="pt-1 text-sm text-fg-muted">Coming soon</p>
      </div>
    </Menu>
  )
}
