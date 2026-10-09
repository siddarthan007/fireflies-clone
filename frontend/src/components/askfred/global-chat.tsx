'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { useAskFred } from '@/lib/api/askfred'

type Chat = ReturnType<typeof useAskFred>

const GlobalChatContext = createContext<Chat | null>(null)

// One conversation about all meetings, shared by the Home, Meetings and AskFred screens.
export function GlobalChatProvider({ children }: { children: ReactNode }) {
  const chat = useAskFred()
  return <GlobalChatContext.Provider value={chat}>{children}</GlobalChatContext.Provider>
}

export function useGlobalChat(): Chat {
  const chat = useContext(GlobalChatContext)
  if (!chat) throw new Error('useGlobalChat must be used inside GlobalChatProvider')
  return chat
}
