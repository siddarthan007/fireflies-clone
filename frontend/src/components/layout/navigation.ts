import { BarChart3, Bot, Home, Layers, ListChecks, Settings, Sparkle, Video } from 'lucide-react'
import type { ComponentType } from 'react'

import { FredIcon } from '@/components/ui/fred'

export interface NavigationItem {
  href: string
  label: string
  icon: ComponentType<{ size?: number }>
  comingSoon?: boolean
}

export const NAVIGATION_GROUPS: NavigationItem[][] = [
  [
    { href: '/', label: 'Home', icon: Home },
    { href: '/ask-fred', label: 'AskFred', icon: FredIcon },
  ],
  [
    { href: '/meetings', label: 'Meetings', icon: Video },
    { href: '/tasks', label: 'Tasks', icon: ListChecks },
    { href: '/skills', label: 'AI Skills', icon: Sparkle, comingSoon: true },
  ],
  [
    { href: '/analytics', label: 'Analytics', icon: BarChart3, comingSoon: true },
    { href: '/agents', label: 'Voice Agents', icon: Bot, comingSoon: true },
  ],
]

export const SECONDARY_NAVIGATION: NavigationItem[] = [
  { href: '/integrations', label: 'Integrations', icon: Layers, comingSoon: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function navigationTitle(pathname: string) {
  return (
    [...NAVIGATION_GROUPS.flat(), ...SECONDARY_NAVIGATION].find((item) =>
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
    )?.label ?? 'Fireflies'
  )
}
