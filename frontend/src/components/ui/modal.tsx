'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { useDialog } from '@/lib/hooks/use-dialog'
import { cn } from '@/lib/utils/cn'
import { IconButton } from './icon-button'

// A centered dialog on the native <dialog>, which traps focus and closes on Escape.
// Put data-autofocus on the field that should be focused first.
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <dialog
      {...useDialog(open, onClose)}
      aria-label={title}
      className={cn(
        'm-auto w-[calc(100%-32px)] max-w-[520px] rounded-lg border border-line bg-elevated p-0 shadow-modal',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-64px)] flex-col">
          <div className="flex items-center justify-between pt-[18px] pr-4 pb-4 pl-6">
            <h2 className="text-base font-medium text-fg-secondary">{title}</h2>
            <IconButton label="Close" onClick={onClose}>
              <X size={20} />
            </IconButton>
          </div>
          <div className="overflow-y-auto px-6 py-1">{children}</div>
          {footer && <div className="flex justify-end gap-3 px-6 pt-5 pb-6">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
