'use client'

import { ChevronDown, Link2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, fieldClass } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils/cn'

// Looks like the real dialog, but joining live calls is out of scope, so Start explains that.
export function LiveMeetingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [link, setLink] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to live meeting"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-fg-hint">
            Live capture is coming soon
          </span>
          <Button size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="lg"
            variant="primary"
            disabled={!link.trim()}
            onClick={() => {
              toast('Live capture is coming soon. Use Upload transcript to add a meeting.')
              onClose()
            }}
          >
            Start Capturing
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-1">
        <Field label="Name your meeting" htmlFor="live-name" optional>
          <Input id="live-name" placeholder="E.g. Product team sync" data-autofocus />
        </Field>
        <Field
          label="Meeting link"
          htmlFor="live-link"
          hint="Capture meetings from GMeet, Zoom, MS Teams, and more."
        >
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-[52px] items-center justify-center rounded-l-sm border border-line bg-muted text-fg-icon">
              <Link2 size={20} />
            </span>
            <input
              id="live-link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className={cn(fieldClass, 'h-10 rounded-l-none pl-16')}
            />
          </div>
        </Field>
        <Field label="Meeting language" htmlFor="live-language">
          <div className="relative">
            <select id="live-language" className={cn(fieldClass, 'h-10 appearance-none pr-10')}>
              <option>English (Global)</option>
            </select>
            <ChevronDown
              size={20}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-icon"
            />
          </div>
        </Field>
      </div>
    </Modal>
  )
}
