'use client'

import { AudioLines, Bookmark, MessageCircle, Search, Smile } from 'lucide-react'
import type { ComponentType } from 'react'

import { IconButton } from '@/components/ui/icon-button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils/cn'

export type PanelId = 'highlights' | 'comments'

const PANELS: { id: PanelId; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'comments', label: 'Comments', icon: MessageCircle },
  { id: 'highlights', label: 'Highlights', icon: Bookmark },
]

export function ToolRail({
  panel,
  onPanel,
  onSearch,
}: {
  panel: PanelId | null
  onPanel: (panel: PanelId | null) => void
  onSearch: () => void
}) {
  const toast = useToast()
  return (
    <div className="flex h-full flex-col items-center gap-3 p-2">
      <IconButton label="Search the transcript" onClick={onSearch}>
        <Search size={20} />
      </IconButton>
      <IconButton
        label="Meeting insights (coming soon)"
        onClick={() => toast('Meeting insights are coming soon')}
      >
        <span className="flex size-5 items-center justify-center rounded-full border border-current">
          <AudioLines size={12} />
        </span>
      </IconButton>
      {PANELS.map(({ id, label, icon: Icon }) => (
        <IconButton
          key={id}
          label={label}
          aria-pressed={panel === id}
          onClick={() => onPanel(panel === id ? null : id)}
          className={cn(panel === id && 'text-fg-brand ring-1 ring-brand')}
        >
          <Icon size={20} />
        </IconButton>
      ))}
      <IconButton
        label="Reactions (coming soon)"
        className="mt-auto"
        onClick={() => toast('Reactions are coming soon')}
      >
        <Smile size={20} />
      </IconButton>
    </div>
  )
}
