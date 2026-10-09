import { useEffect, useRef, useState } from 'react'

import type { ChatTurn } from '@/lib/types'
import { streamText } from './client'

export interface ChatMessage extends ChatTurn {
  id: number
  failed?: boolean
}

const HISTORY_TURNS = 10

// A chat with AskFred. The server keeps nothing: each question sends the last few messages
// and the answer streams back. Pass a meeting id to ask about one meeting.
export function useAskFred(meetingId?: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const lastId = useRef(0)

  useEffect(() => () => controller.current?.abort(), [])

  async function ask(question: string) {
    if (isStreaming) return
    const history = messages
      .filter((message) => !message.failed)
      .slice(-HISTORY_TURNS)
      .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }))

    const answerId = lastId.current + 2
    lastId.current = answerId
    const update = (change: (message: ChatMessage) => Partial<ChatMessage>) =>
      setMessages((all) =>
        all.map((message) =>
          message.id === answerId ? { ...message, ...change(message) } : message,
        ),
      )

    setMessages((all) => [
      ...all,
      { id: answerId - 1, role: 'user', content: question },
      { id: answerId, role: 'assistant', content: '' },
    ])
    const mine = new AbortController()
    controller.current = mine
    setIsStreaming(true)

    try {
      const path = meetingId === undefined ? '/ask' : `/meetings/${meetingId}/ask`
      for await (const chunk of streamText(path, { question, history }, mine.signal)) {
        update((message) => ({ content: message.content + chunk }))
      }
    } catch {
      const sorry = 'Sorry, I could not answer that. Please try again.'
      if (!mine.signal.aborted) update((m) => (m.content ? {} : { content: sorry, failed: true }))
    } finally {
      if (controller.current === mine) setIsStreaming(false)
      // Stopped before the first word arrived: leave no empty answer behind.
      setMessages((all) => all.filter((message) => message.id !== answerId || message.content))
    }
  }

  function stop() {
    controller.current?.abort()
  }

  function reset() {
    controller.current?.abort()
    setMessages([])
  }

  return { messages, isStreaming, ask, stop, reset }
}
