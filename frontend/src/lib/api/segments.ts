import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Comment, Segment } from '@/lib/types'
import { api } from './client'

// Highlights and comments are part of the transcript, so a change refetches it.
function useRefreshTranscript(meetingId: number) {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ['transcript', meetingId] })
}

export function useSetHighlight(meetingId: number) {
  const refresh = useRefreshTranscript(meetingId)
  return useMutation({
    mutationFn: ({ segmentId, highlighted }: { segmentId: number; highlighted: boolean }) =>
      api<Segment>(`/segments/${segmentId}`, { method: 'PATCH', json: { highlighted } }),
    onSuccess: refresh,
  })
}

export function useAddComment(meetingId: number) {
  const refresh = useRefreshTranscript(meetingId)
  return useMutation({
    mutationFn: ({ segmentId, text }: { segmentId: number; text: string }) =>
      api<Comment>(`/segments/${segmentId}/comments`, { method: 'POST', json: { text } }),
    onSuccess: refresh,
  })
}

export function useDeleteComment(meetingId: number) {
  const refresh = useRefreshTranscript(meetingId)
  return useMutation({
    mutationFn: (commentId: number) => api<void>(`/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
}
