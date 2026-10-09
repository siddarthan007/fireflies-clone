import { Sparkle } from 'lucide-react'

import { ComingSoon } from '@/components/layout/coming-soon'

export const metadata = { title: 'AI Skills' }

export default function SkillsPage() {
  return (
    <ComingSoon
      icon={Sparkle}
      title="AI Skills"
      description="Reusable AI prompts you can run on any meeting."
    />
  )
}
