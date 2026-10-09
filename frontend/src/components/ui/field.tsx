import type { ReactNode } from 'react'

// A form row: bold label, optional "(Optional)" note and hint, then the control.
export function Field({
  label,
  htmlFor,
  optional,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  optional?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
          {label}
          {optional && <span className="font-normal text-fg-hint"> (Optional)</span>}
        </label>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
