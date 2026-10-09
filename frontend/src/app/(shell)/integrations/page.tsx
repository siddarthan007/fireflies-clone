import { Layers } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export const metadata = { title: 'Integrations' }

export default function IntegrationsPage() {
  return (
    <ComingSoon
      icon={Layers}
      title="Integrations"
      description="Zoom, Google Meet, calendars and CRMs will connect here."
    />
  )
}
