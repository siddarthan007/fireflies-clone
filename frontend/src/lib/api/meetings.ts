import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import type {
  FilterOptions,
  MeetingDetail,
  MeetingList,
  Segment,
  TranscriptFormat,
} from '@/lib/types'
import { API_URL, api, queryString } from './client'

// A download link for the export endpoint. The browser saves the file.
export function exportUrl(id: number, format: 'markdown' | 'txt') {
  return `${API_URL}/meetings/${id}/export?format=${format}`
}

export interface MeetingFilters {
  q?: string
  participants?: string[]
  tags?: string[]
  dateFrom?: string // "2026-10-01"
  dateTo?: string
  sort?: 'newest' | 'oldest'
  limit?: number
}

export interface NewMeeting {
  title?: string
  meeting_at?: string
  participants: string[]
  transcript: { format: TranscriptFormat; content: string }
}

export interface MeetingChanges {
  title?: string
  meeting_at?: string
  overview?: string | null
  participants?: string[]
  tags?: string[]
}

export function useMeetings(filters: MeetingFilters = {}) {
  const query = queryString({
    q: filters.q,
    participant: filters.participants,
    tag: filters.tags,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    sort: filters.sort,
    limit: filters.limit,
  })
  return useQuery({
    queryKey: ['meetings', query],
    queryFn: () => api<MeetingList>(`/meetings${query}`),
    placeholderData: keepPreviousData, // keep the old list on screen while a new filter loads
  })
}

export function useMeeting(id: number) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => api<MeetingDetail>(`/meetings/${id}`),
  })
}

export function useTranscript(id: number) {
  return useQuery({
    queryKey: ['transcript', id],
    queryFn: () => api<Segment[]>(`/meetings/${id}/transcript`),
  })
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: () => api<FilterOptions>('/meetings/filter-options'),
  })
}

// After any change to a meeting, everything that shows meetings or their tasks is refetched.
function refreshMeetings(client: QueryClient) {
  return Promise.all(
    ['meetings', 'meeting', 'filter-options', 'tasks'].map((key) =>
      client.invalidateQueries({ queryKey: [key] }),
    ),
  )
}

export function useCreateMeeting() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (meeting: NewMeeting) =>
      api<MeetingDetail>('/meetings', { method: 'POST', json: meeting }),
    onSuccess: () => refreshMeetings(client),
  })
}

export function useUploadMeeting() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) =>
      api<MeetingDetail>('/meetings/upload', { method: 'POST', form }),
    onSuccess: () => refreshMeetings(client),
  })
}

export function useUpdateMeeting(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (changes: MeetingChanges) =>
      api<MeetingDetail>(`/meetings/${id}`, { method: 'PATCH', json: changes }),
    onSuccess: () => refreshMeetings(client),
  })
}

export function useDeleteMeeting() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/meetings/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      // Drop the deleted meeting instead of refetching it, which would only return a 404.
      client.removeQueries({ queryKey: ['meeting', id] })
      client.removeQueries({ queryKey: ['transcript', id] })
      return refreshMeetings(client)
    },
  })
}
