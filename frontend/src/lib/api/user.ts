import { useQuery } from '@tanstack/react-query'

import type { User } from '@/lib/types'
import { api } from './client'

// There is no login: the API returns the one demo user.
export function useUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<User>('/me'),
    staleTime: Infinity,
  })
}

// "Siddartha Nepal" becomes "Siddartha". Empty until the user has loaded.
export function useFirstName() {
  const { data: user } = useUser()
  return user?.name.split(' ')[0] ?? ''
}

// "Hi Siddartha!", or just "Hi!" until the user has loaded.
export function useHiGreeting() {
  const firstName = useFirstName()
  return firstName ? `Hi ${firstName}!` : 'Hi!'
}
