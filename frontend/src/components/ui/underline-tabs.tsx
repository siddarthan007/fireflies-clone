import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

interface Tab<T extends string> {
  value: T
  label: ReactNode
}

// Tabs with a purple line under the selected one, like AskFred | Transcript.
export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Tab<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-2">
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex h-12 items-center gap-2 border-b px-2 font-display text-sm transition-colors',
              selected
                ? 'border-brand text-fg-brand'
                : 'border-transparent text-fg-icon hover:text-fg',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
