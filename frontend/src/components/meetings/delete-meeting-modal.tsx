'use client'

import { useRouter } from 'next/navigation'

import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'
import { useDeleteMeeting } from '@/lib/api/meetings'

export function DeleteMeetingModal({
  meeting,
  open,
  onClose,
  onDeleted,
}: {
  meeting: { id: number; title: string }
  open: boolean
  onClose: () => void
  onDeleted?: () => void // for a parent dialog that should close as well
}) {
  const router = useRouter()
  const toast = useToast()
  const remove = useDeleteMeeting()

  async function deleteMeeting() {
    try {
      await remove.mutateAsync(meeting.id)
      toast('Meeting deleted')
      onClose()
      onDeleted?.()
      router.push('/meetings')
    } catch {
      toast('Could not delete the meeting', 'error')
    }
  }

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title="Delete meeting"
      message={`Delete "${meeting.title}"? Its transcript, notes and action items are removed for good.`}
      confirmLabel="Delete meeting"
      pending={remove.isPending}
      onConfirm={deleteMeeting}
    />
  )
}
