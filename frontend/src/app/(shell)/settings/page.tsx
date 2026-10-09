'use client'

import { Check, Moon, Sun } from 'lucide-react'

import { Tag } from '@/components/ui/tag'
import { useUser } from '@/lib/api/user'
import { useTheme, type Theme } from '@/lib/hooks/use-theme'
import { cn } from '@/lib/utils/cn'

// Same sections as the real settings page. Only Language & Appearance exists here.
const SECTIONS = [
  'Language & Appearance',
  'Recording & Privacy',
  'Compliance Notification',
  'Email Assistant',
  'AI Settings',
  'Live Assist',
  'Knowledge Base',
  'MCP & API',
  'Cookies',
]

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { data: user } = useUser()

  return (
    <div className="flex h-full">
      <nav
        aria-label="Settings sections"
        className="hidden w-[250px] shrink-0 overflow-y-auto border-r border-line-subtle bg-subtle p-2 md:block"
      >
        <ul className="space-y-0.5">
          {SECTIONS.map((section, index) =>
            index === 0 ? (
              <li key={section}>
                <span
                  aria-current="page"
                  className="flex h-8 items-center rounded-md bg-strong px-3 text-sm font-medium text-fg"
                >
                  {section}
                </span>
              </li>
            ) : (
              <li key={section}>
                <span className="flex h-8 items-center justify-between rounded-md px-3 text-sm text-fg-muted opacity-70">
                  {section}
                  <Tag tone="neutral">Soon</Tag>
                </span>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[700px] space-y-6 px-6 py-8 max-sm:px-4">
          <header>
            <h2 className="font-display text-xl font-medium text-fg">Language & Appearance</h2>
            <p className="pt-1 text-sm text-fg-muted">
              Signed in as {user?.name ?? '...'} {user && `(${user.email})`}. There is no login in
              this demo.
            </p>
          </header>

          <section className="space-y-3 rounded-xl border border-line bg-layer p-5">
            <div>
              <h3 className="text-sm font-medium text-fg">Theme</h3>
              <p className="text-sm text-fg-muted">Choose how Fireflies looks on this device.</p>
            </div>
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={theme === value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                    theme === value
                      ? 'border-brand bg-brand-soft text-fg-brand ring-1 ring-brand'
                      : 'border-line text-fg-secondary hover:bg-muted',
                  )}
                >
                  <Icon size={20} />
                  <span className="flex-1 font-medium">{label}</span>
                  {theme === value && <Check size={16} />}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-line bg-layer p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-fg">Language</h3>
                <p className="text-sm text-fg-muted">For transcripts and summaries.</p>
              </div>
              <Tag tone="neutral">Soon</Tag>
            </div>
            <select
              disabled
              aria-label="Language"
              className="h-10 w-full rounded-sm border border-line bg-muted px-4 text-sm text-fg-muted opacity-70"
            >
              <option>English (Global)</option>
            </select>
          </section>
        </div>
      </div>
    </div>
  )
}
