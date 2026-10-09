'use client'

import { Layers, MessageSquare, Plus, Search } from 'lucide-react'

import { useToast } from '@/components/ui/toast'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import { useGlobalChat } from './global-chat'

const itemClass =
  'flex h-9 w-full items-center gap-2.5 rounded-sm px-3 text-sm text-fg-secondary transition-colors hover:bg-fg/5'

// Left column of the AskFred page. Chats are not stored, so only the current one is listed.
export function ChatsPanel() {
  const toast = useToast()
  const chat = useGlobalChat()
  const first = chat.messages.find((message) => message.role === 'user')

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-r border-line-subtle bg-page lg:flex">
      <div className="flex h-[52px] shrink-0 items-center border-b-[0.5px] border-line px-6">
        <h2 className="text-sm font-medium text-fg-secondary">AskFred</h2>
      </div>
      <div className="flex flex-col gap-0.5 px-4 pt-4 pb-1.5">
        <button type="button" onClick={chat.reset} className={itemClass}>
          <Plus size={20} /> New Chat
        </button>
        <button
          type="button"
          title="Chat search (coming soon)"
          onClick={() => toast('Chat search is coming soon')}
          className={itemClass}
        >
          <Search size={20} /> Search{' '}
          <span className="ml-auto text-xs text-fg-hint">Coming soon</span>
        </button>
        <button
          type="button"
          title="Connectors (coming soon)"
          onClick={() => toast('Connectors are coming soon')}
          className={itemClass}
        >
          <Layers size={20} /> Connectors{' '}
          <span className="ml-auto text-xs text-fg-hint">Coming soon</span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2">
        {first ? (
          <button type="button" aria-current="true" className={cn(itemClass, 'bg-strong')}>
            <MessageSquare size={16} className="shrink-0" />
            <span className="truncate">{first.content}</span>
          </button>
        ) : (
          <EmptyState
            title="No chats yet"
            description="Your chats will appear here once you start one."
            className="pt-24"
          />
        )}
      </div>
    </aside>
  )
}
