'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { GlobalChatProvider } from '@/components/askfred/global-chat'
import { ChatsPanel } from '@/components/askfred/chats-panel'
import { ChannelsPanel } from '@/components/meetings/channels-panel'
import { GlobalSearch } from './global-search'
import { HelpButton } from './help-button'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

// Sidebar and top bar around most pages. Meetings and AskFred add a second column.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [preferNarrow, setPreferNarrow] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const panel = pathname.startsWith('/meetings') ? (
    <ChannelsPanel />
  ) : pathname.startsWith('/ask-fred') ? (
    <ChatsPanel />
  ) : null

  // Remember whether the user collapsed the sidebar.
  useEffect(() => {
    try {
      setPreferNarrow(localStorage.getItem('sidebar') === 'narrow')
    } catch {
      // storage blocked: start expanded
    }
  }, [])

  function toggleSidebar() {
    const next = !preferNarrow
    setPreferNarrow(next)
    try {
      localStorage.setItem('sidebar', next ? 'narrow' : 'wide')
    } catch {
      // storage blocked: the choice lasts until the page reloads
    }
  }

  // The phone drawer closes when you go to another page.
  useEffect(() => setDrawerOpen(false), [pathname])

  // Ctrl+K opens search, Ctrl+J opens AskFred. Cmd works too on a Mac.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (key === 'j') {
        event.preventDefault()
        router.push('/ask-fred')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [router])

  return (
    <GlobalChatProvider>
      <div className="flex h-dvh overflow-hidden bg-page">
        <Sidebar
          collapsed={preferNarrow}
          onToggle={toggleSidebar}
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
        />
        {panel}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setDrawerOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
          <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpButton />
    </GlobalChatProvider>
  )
}
