import { Bot } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export const metadata = { title: 'Voice Agents' }

export default function AgentsPage() {
  return (
    <ComingSoon
      icon={Bot}
      title="Voice Agents"
      description="Agents that join calls and take part in the conversation."
    />
  )
}
