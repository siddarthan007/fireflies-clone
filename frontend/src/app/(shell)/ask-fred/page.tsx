'use client'

import { CalendarDays, CheckCheck, Target, Users } from 'lucide-react'

import { ChatMessages } from '@/components/askfred/chat-messages'
import { Composer } from '@/components/askfred/composer'
import { useGlobalChat } from '@/components/askfred/global-chat'
import { useFirstName } from '@/lib/api/user'
import { cn } from '@/lib/utils/cn'

const SUGGESTIONS = [
  { icon: CheckCheck, text: 'List my action items & todos for this week' },
  { icon: CalendarDays, text: 'Summarize my last meeting' },
  { icon: Target, text: 'What decisions were made recently?' },
  { icon: Users, text: 'Who attended my meetings?' },
]

// The full-page AskFred: ask anything about your meetings.
export default function AskFredPage() {
  const chat = useGlobalChat()
  const firstName = useFirstName()

  const composer = (
    <Composer
      large
      onSend={chat.ask}
      onStop={chat.stop}
      streaming={chat.isStreaming}
      placeholder="Ask anything about your meetings"
    />
  )

  if (chat.messages.length > 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <ChatMessages messages={chat.messages} streaming={chat.isStreaming} />
        </div>
        <div className="mx-auto w-full max-w-[760px] px-4 pt-2 pb-6">{composer}</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[606px] px-4 pt-12 pb-10">
        {/* Hidden until the name arrives, so the line does not jump */}
        <h2 className={cn('font-display text-xl font-medium text-fg', !firstName && 'invisible')}>
          Hi {firstName}, how can I help today?
        </h2>
        <div className="mt-10">{composer}</div>
        <ul className="mt-8 space-y-1">
          {SUGGESTIONS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <button
                type="button"
                onClick={() => chat.ask(text)}
                className="flex min-h-10 w-full items-center gap-3 rounded-lg py-2 pr-2 pl-2.5 text-left text-[13px] leading-6 text-fg-secondary transition-colors hover:bg-muted"
              >
                <Icon size={18} className="shrink-0 text-fg-icon" />
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
