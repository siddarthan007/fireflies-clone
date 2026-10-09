// Display formats, matching the Fireflies app. Dates show in the viewer's time zone.

const pad = (n: number) => String(n).padStart(2, '0')

/** 125000 -> "02:05", 3725000 -> "1:02:05" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

/** 274 -> "5 min", 4000 -> "1 hr 7 min" */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}

/** "8:03 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** "Oct 8", or "Oct 08" when padded */
export function formatDay(iso: string, padded = false): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: padded ? '2-digit' : 'numeric',
  })
}

/** "Oct 08 2026, 8:03 PM" */
export function formatFullDate(iso: string): string {
  const year = new Date(iso).getFullYear()
  return `${formatDay(iso, true)} ${year}, ${formatTime(iso)}`
}

/** Heading above a day's meetings: "Today" or "Thu, Oct 8" */
export function formatDayHeading(iso: string): string {
  const date = new Date(iso)
  if (date.toDateString() === new Date().toDateString()) return 'Today'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "2026-10-09" -> "Oct 9" (a date with no time, so no time zone shift) */
export function formatDueDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/** Groups items by the local calendar day of their timestamp, keeping the order. */
export function groupByDay<T>(items: T[], getIso: (item: T) => string) {
  const groups: { heading: string; items: T[] }[] = []
  for (const item of items) {
    const heading = formatDayHeading(getIso(item))
    const last = groups.at(-1)
    if (last?.heading === heading) last.items.push(item)
    else groups.push({ heading, items: [item] })
  }
  return groups
}

/** ISO timestamp -> value for <input type="datetime-local"> in local time */
export function toDateTimeInput(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** The greeting on the Home page, by hour of day */
export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}
