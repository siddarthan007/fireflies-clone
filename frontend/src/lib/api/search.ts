import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { SearchResults } from '@/lib/types'
import { api, queryString } from './client'

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => api<SearchResults>(`/search${queryString({ q })}`),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
  })
}
