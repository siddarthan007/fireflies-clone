import type { ComponentType } from 'react'

import { EmptyState } from '@/components/ui/empty-state'
import { Tag } from '@/components/ui/tag'

// A placeholder page for a feature that is out of scope (AI Skills, Analytics, Voice Agents, Integrations).
export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ size?: number }>
  title: string
  description: string
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={<Icon size={32} />}
        title={title}
        description={description}
        action={<Tag tone="brand">Coming soon</Tag>}
      />
    </div>
  )
}
