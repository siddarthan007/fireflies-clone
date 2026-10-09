import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ActionItem, Task } from '@/lib/types'
import { api, queryString } from './client'

interface TaskFilters {
  assignee?: string
  done?: boolean
}

export interface ActionItemFields {
  text: string
  assignee: string | null
  due_date: string | null
}

export function useTasks({ assignee, done }: TaskFilters = {}, enabled = true) {
  const query = queryString({ assignee, done: done === undefined ? undefined : String(done) })
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: () => api<Task[]>(`/action-items${query}`),
    enabled,
  })
}

// An action item shows in its meeting and on the Tasks page, so changes refetch both.
function useRefresh() {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['meeting'] }),
      client.invalidateQueries({ queryKey: ['tasks'] }),
    ])
}

export function useAddActionItem(meetingId: number) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (item: Partial<ActionItemFields> & { text: string }) =>
      api<ActionItem>(`/meetings/${meetingId}/action-items`, { method: 'POST', json: item }),
    onSuccess: refresh,
  })
}

export function useUpdateActionItem() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({
      id,
      ...changes
    }: { id: number } & Partial<ActionItemFields> & { done?: boolean }) =>
      api<ActionItem>(`/action-items/${id}`, { method: 'PATCH', json: changes }),
    onSuccess: refresh,
  })
}

export function useDeleteActionItem() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/action-items/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
}
