'use client'

import { ArrowUp, Hash, Layers, Mic, Plus, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils/cn'

// Enter sends, Shift+Enter adds a line, and Send turns into Stop while an answer streams.
export function Composer({
  onSend,
  onStop,
  streaming = false,
  placeholder = 'Ask anything from your meetings...',
  scope,
  large = false,
}: {
  onSend: (question: string) => void
  onStop: () => void
  streaming?: boolean
  placeholder?: string
  scope?: string // a chip such as "My Meetings" showing what the question is about
  large?: boolean
}) {
  const [text, setText] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)
  const canSend = text.trim() !== '' && !streaming

  // Grow with the text, up to about six lines.
  useEffect(() => {
    const element = field.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 150)}px`
  }, [text])

  function send() {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
      className={cn(
        'border border-line bg-layer shadow-card transition-colors focus-within:border-brand focus-within:ring-1 focus-within:ring-brand',
        large ? 'rounded-2xl' : 'rounded-lg',
      )}
    >
      {scope && (
        <div className="px-3 pt-3">
          <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-sm text-fg-secondary">
            <Hash size={16} />
            {scope}
          </span>
        </div>
      )}
      <textarea
        ref={field}
        rows={1}
        value={text}
        placeholder={placeholder}
        aria-label="Ask AskFred a question"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send()
          }
        }}
        className={cn(
          'block w-full resize-none bg-transparent px-3 text-sm text-fg-secondary outline-none placeholder:text-fg-hint',
          large ? 'min-h-[52px] py-4' : 'min-h-[76px] py-3',
        )}
      />
      <div className="flex items-center justify-between p-2">
        <div className="flex gap-1">
          <IconButton label="Attach files (coming soon)" disabled>
            <Plus size={16} />
          </IconButton>
          <IconButton label="Connectors (coming soon)" disabled>
            <Layers size={16} />
          </IconButton>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Dictate (coming soon)" disabled>
            <Mic size={18} />
          </IconButton>
          {streaming ? (
            <button
              type="button"
              aria-label="Stop answering"
              onClick={onStop}
              className="flex size-8 items-center justify-center rounded-sm bg-brand text-white transition-colors hover:bg-brand-hover max-md:size-11"
            >
              <Square size={14} className="fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send question"
              disabled={!canSend}
              className="flex size-8 items-center justify-center rounded-sm bg-brand text-white transition-colors hover:bg-brand-hover disabled:bg-brand-disabled max-md:size-11"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
