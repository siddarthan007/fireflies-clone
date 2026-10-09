'use client'

import { CircleHelp } from 'lucide-react'

import { useToast } from '@/components/ui/toast'

// The round help button that floats in the bottom corner of the real app.
export function HelpButton() {
  const toast = useToast()
  return (
    <button
      type="button"
      aria-label="Help"
      title="Help"
      onClick={() => toast('The help center is coming soon')}
      className="fixed right-3.5 bottom-[18px] z-30 flex size-[50px] items-center justify-center rounded-full border border-line bg-brand-deep text-white shadow-[0_2px_24px_rgb(0_0_0/0.04)] transition-transform hover:scale-105 max-md:hidden"
    >
      <CircleHelp size={24} />
    </button>
  )
}
