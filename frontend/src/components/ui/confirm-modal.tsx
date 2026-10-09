'use client'

import { Button } from './button'
import { Modal } from './modal'

// "Are you sure?" before something that cannot be undone.
export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  pending = false,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button size="lg" onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button size="lg" variant="danger" disabled={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="pb-1 text-sm text-fg-muted">{message}</p>
    </Modal>
  )
}
