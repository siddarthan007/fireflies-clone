import { EmptyState } from '@/components/ui/empty-state'
import { SparklesIcon } from '@/components/ui/fred'

export function SummaryEmpty() {
  return (
    <section aria-label="Overview" className="py-6">
      <div aria-hidden className="relative mx-auto h-36 w-44 space-y-5 opacity-60">
        {['bg-brand-soft', 'bg-muted', 'bg-success-soft'].map((color) => (
          <div key={color} className="space-y-1.5">
            <div className={`h-2 w-10 rounded-full ${color}`} />
            <div className="h-1.5 w-36 rounded-full bg-muted" />
            <div className="h-1.5 w-28 rounded-full bg-muted" />
          </div>
        ))}
        <span className="absolute right-7 bottom-0 rounded-sm border border-line bg-page p-1.5">
          <SparklesIcon size={24} tone="purple" />
        </span>
      </div>
      <EmptyState
        title="No meeting summary available"
        description="No summary has been saved for this meeting."
        className="pt-5 pb-2"
      />
    </section>
  )
}
