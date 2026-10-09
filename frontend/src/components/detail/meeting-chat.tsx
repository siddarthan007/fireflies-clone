'use client'

import { ChatPanel } from '@/components/askfred/chat-panel'
import { useAskFred } from '@/lib/api/askfred'
import { useHiGreeting } from '@/lib/api/user'

const SUGGESTIONS = [
  { text: 'Identify the key decisions made.' },
  { text: 'What are the action items and deadlines?' },
  { text: 'What were the main topics?' },
]

// AskFred about one meeting. Its conversation is kept only while you are on this page.
export function MeetingChat({ meetingId }: { meetingId: number }) {
  const hi = useHiGreeting()
  const chat = useAskFred(meetingId)
  return (
    <ChatPanel
      chat={chat}
      greeting={[hi, 'Ask anything about this meeting']}
      suggestions={SUGGESTIONS}
      placeholder="Ask anything about this meeting"
    />
  )
}
