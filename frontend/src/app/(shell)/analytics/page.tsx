import { BarChart3 } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export const metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Analytics"
      description="Talk time, topics and meeting trends across your team."
    />
  )
}
