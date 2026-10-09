'use client'

import { useEffect, useRef } from 'react'

// Opens and closes a native <dialog> from an `open` flag: <dialog {...useDialog(open, onClose)}>.
// Adds close on backdrop click and focus on the [data-autofocus] element.
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [open])

  return {
    ref,
    onClose,
    onCancel: (event: React.SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault()
      onClose()
    },
    onClick: (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === ref.current) onClose() // a click on the dimmed backdrop
    },
  }
}
