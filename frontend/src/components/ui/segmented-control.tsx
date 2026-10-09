'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

interface Option<T extends string> {
  value: T
  label: ReactNode
}

// Options on a gray track, with a white pill sliding under the selected one.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
  className,
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const track = useRef<HTMLDivElement>(null)
  const buttons = useRef(new Map<T, HTMLButtonElement>())
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  // Measure the selected button. Re-measure when the track resizes, e.g. once the font loads.
  useLayoutEffect(() => {
    const measure = () => {
      const active = buttons.current.get(value)
      if (active) setPill({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (track.current) observer.observe(track.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div
      ref={track}
      role="tablist"
      aria-label={label}
      className={cn(
        'relative inline-flex items-center gap-0.5 rounded-md bg-strong p-1',
        className,
      )}
    >
      {pill && (
        <span
          aria-hidden
          className="ease-ui absolute inset-y-1 rounded-sm bg-layer shadow-card transition-all duration-[240ms]"
          style={{ left: pill.left, width: pill.width }} // measured at runtime, so not a class
        />
      )}
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(element) => {
              if (element) buttons.current.set(option.value, element)
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 flex items-center gap-1 rounded-sm px-3 text-sm font-medium transition-colors',
              // The track adds 8px, so h-9 buttons give a 44px tap target on phones.
              size === 'sm' ? 'h-[22px] leading-[14px] max-md:h-9' : 'h-7 leading-5 max-md:h-9',
              selected ? 'text-fg-secondary' : 'text-fg-muted hover:text-fg-secondary',
              selected && !pill && 'bg-layer shadow-card', // before the first measurement
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
