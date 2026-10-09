'use client'

import { Check } from 'lucide-react'
import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'

import { useDismiss } from '@/lib/hooks/use-dismiss'
import { cn } from '@/lib/utils/cn'
import { Tag } from './tag'

const CloseMenu = createContext<() => void>(() => {})

interface TriggerProps {
  onClick?: () => void
  'aria-haspopup'?: 'menu'
  'aria-expanded'?: boolean
}

// A dropdown opened by `trigger`. It closes on a pick, Escape or an outside click.
export function Menu({
  trigger,
  children,
  align = 'end',
  className,
}: {
  trigger: ReactElement<TriggerProps>
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, root)

  return (
    <div ref={root} className="relative inline-flex">
      {cloneElement(trigger, {
        onClick: () => setOpen((value) => !value),
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })}
      {open && (
        <CloseMenu.Provider value={close}>
          <div
            role="menu"
            className={cn(
              'menu-in absolute top-full z-50 mt-1 min-w-56 rounded-lg border border-line bg-elevated py-2 shadow-menu',
              align === 'end' ? 'right-0' : 'left-0',
              className,
            )}
          >
            {children}
          </div>
        </CloseMenu.Provider>
      )}
    </div>
  )
}

export function MenuItem({
  icon,
  checked,
  soon,
  onSelect,
  children,
}: {
  icon?: ReactNode
  checked?: boolean
  soon?: boolean // not built yet: shown dimmed with a "Soon" label
  onSelect?: () => void
  children: ReactNode
}) {
  const close = useContext(CloseMenu)
  return (
    <button
      type="button"
      role="menuitem"
      disabled={soon}
      onClick={() => {
        onSelect?.()
        close()
      }}
      className="flex w-full items-center gap-3 px-4 py-1 text-left text-sm text-fg-secondary transition-colors hover:bg-fg/5 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
    >
      {icon && <span className="text-fg-icon">{icon}</span>}
      <span className="flex-1">{children}</span>
      {soon && <Tag tone="neutral">Soon</Tag>}
      {checked && <Check size={16} className="text-fg" />}
    </button>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-line-subtle" />
}
