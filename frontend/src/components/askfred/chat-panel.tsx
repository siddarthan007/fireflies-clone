'use client'

import type { ReactNode } from 'react'

import { SparklesIcon } from '@/components/ui/fred'
import type { useAskFred } from '@/lib/api/askfred'
import { ChatMessages } from './chat-messages'
import { Composer } from './composer'

export interface Suggestion {
  icon?: ReactNode
  text: string
}

// A greeting and suggestions until the first question, then the conversation.
export function ChatPanel({
  chat,
  greeting,
  suggestions,
  scope,
  placeholder,
}: {
  chat: ReturnType<typeof useAskFred>
  greeting: [string, string]
  suggestions: Suggestion[]
  scope?: string
  placeholder?: string
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {chat.messages.length > 0 ? (
        <div className="min-h-0 flex-1">
          <ChatMessages messages={chat.messages} streaming={chat.isStreaming} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col justify-center gap-12 px-6 py-10">
            <div className="space-y-5">
              <SparklesIcon />
              <p className="text-lg text-fg-secondary">
                <span className="block font-medium">{greeting[0]}</span>
                <span className="block font-medium">{greeting[1]}</span>
              </p>
            </div>
            <ul className="flex flex-col items-start gap-4">
              {suggestions.map((suggestion) => (
                <li key={suggestion.text}>
                  <button
                    type="button"
                    onClick={() => chat.ask(suggestion.text)}
                    className="flex min-h-10 items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-left text-sm text-fg-secondary transition-colors hover:bg-strong"
                  >
                    {suggestion.icon && (
                      <span className="flex size-5 shrink-0 items-center justify-center">
                        {suggestion.icon}
                      </span>
                    )}
                    {suggestion.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="shrink-0 p-4 pt-2">
        <Composer
          onSend={chat.ask}
          onStop={chat.stop}
          streaming={chat.isStreaming}
          scope={scope}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
