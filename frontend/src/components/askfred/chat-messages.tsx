'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { IconButton } from '@/components/ui/icon-button'
import { useToast } from '@/components/ui/toast'
import type { ChatMessage } from '@/lib/api/askfred'
import { useUser } from '@/lib/api/user'
import { Markdown } from './markdown'

function CopyButton({ text }: { text: string }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => toast('Could not copy to the clipboard', 'error'),
    )
  }

  return (
    <IconButton label={copied ? 'Copied' : 'Copy answer'} size="sm" onClick={copy}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </IconButton>
  )
}

function Thinking() {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-fg-muted">
      <span aria-hidden className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1.5 animate-pulse rounded-full bg-brand-track"
            style={{ animationDelay: `${dot * 200}ms` }}
          />
        ))}
      </span>
      Thinking...
    </p>
  )
}

// The conversation. It follows new text as it streams in, unless you scroll up to read.
export function ChatMessages({
  messages,
  streaming,
}: {
  messages: ChatMessage[]
  streaming: boolean
}) {
  const { data: user } = useUser()
  const box = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)

  useEffect(() => {
    if (messages.at(-1)?.role === 'user') atBottom.current = true
    if (atBottom.current) box.current?.scrollTo({ top: box.current.scrollHeight })
  }, [messages])

  return (
    <div
      ref={box}
      onScroll={(event) => {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
        atBottom.current = scrollHeight - scrollTop - clientHeight < 80
      }}
      className="h-full overflow-y-auto"
    >
      <div className="mx-auto max-w-[760px] space-y-6 px-4 py-4">
        {messages.map((message, index) => {
          if (message.role === 'user') {
            return (
              <div key={message.id} className="flex items-start justify-end gap-2">
                <p className="max-w-[85%] rounded-lg bg-muted px-4 py-2 text-sm text-fg">
                  {message.content}
                </p>
                <Avatar name={user?.name ?? 'You'} size="md" />
              </div>
            )
          }
          const writing = streaming && index === messages.length - 1
          return (
            <div key={message.id} className="space-y-1">
              {message.content ? <Markdown text={message.content} /> : <Thinking />}
              {!writing && message.content && <CopyButton text={message.content} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
