'use client'

import { Clock, PanelTop, Plus } from 'lucide-react'
import { useState } from 'react'

import { FredIcon } from '@/components/ui/fred'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils/cn'
import { ChatPanel, type Suggestion } from './chat-panel'
import { useGlobalChat } from './global-chat'

// The AskFred column on Home and Meetings, sharing one chat with the AskFred page.
export function AskFredRail({
  label,
  greeting,
  suggestions,
  scope,
  className,
}: {
  label: string
  greeting: [string, string]
  suggestions: Suggestion[]
  scope?: string
  className?: string
}) {
  const chat = useGlobalChat()
  const [collapsed, setCollapsed] = useState(false)
  return (
    <aside
      aria-label="AskFred"
      className={cn(
        'hidden shrink-0 flex-col border-l border-line-subtle bg-page xl:flex',
        className,
        collapsed && 'w-12',
      )}
    >
      <div
        className={cn(
          'flex h-12 shrink-0 items-center justify-between border-b border-line-subtle px-3',
          collapsed && 'justify-center px-2',
        )}
      >
        <span
          className={cn(
            'flex h-12 items-center gap-2 px-4 font-display text-sm text-fg-brand',
            collapsed && 'hidden',
          )}
        >
          <FredIcon size={20} />
          {label}
        </span>
        <div className="flex gap-1">
          <IconButton
            label="Chat history (coming soon)"
            disabled
            className={collapsed ? 'hidden' : ''}
          >
            <Clock size={16} />
          </IconButton>
          <IconButton label="New chat" onClick={chat.reset} className={collapsed ? 'hidden' : ''}>
            <Plus size={20} />
          </IconButton>
          <IconButton
            label={collapsed ? 'Expand AskFred' : 'Collapse AskFred'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <PanelTop size={16} />
          </IconButton>
        </div>
      </div>
      <div className={cn('min-h-0 flex-1', collapsed && 'hidden')}>
        <ChatPanel chat={chat} greeting={greeting} suggestions={suggestions} scope={scope} />
      </div>
    </aside>
  )
}
