import type { Chapter } from '@/lib/types'
import { formatClock } from '@/lib/utils/format'

// The AI outline: one block per topic. Clicking a topic jumps the player to where it starts.
export function Outline({
  chapters,
  onSeek,
}: {
  chapters: Chapter[]
  onSeek: (ms: number) => void
}) {
  if (chapters.length === 0) return null
  return (
    <section aria-label="Outline" className="space-y-4">
      <h3 className="text-sm font-medium text-fg">Outline</h3>
      {chapters.map((chapter) => (
        <div key={chapter.id} className="space-y-2">
          <button
            type="button"
            onClick={() => onSeek(chapter.start_ms)}
            title="Play from here"
            className="flex items-baseline gap-2 rounded-sm text-left hover:underline"
          >
            <span className="text-sm font-medium text-fg">{chapter.title}</span>
            <span className="text-sm text-fg-hint">({formatClock(chapter.start_ms)})</span>
          </button>
          <ul className="space-y-1.5 pl-1">
            {chapter.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-sm text-fg-secondary">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-fg-hint" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
