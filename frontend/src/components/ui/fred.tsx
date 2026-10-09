import { useId } from 'react'

// AskFred's robot head, drawn for this project as a simple placeholder in the product's colors.
export function FredIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M6.5 3.5 7.5 6M13.5 3.5 12.5 6"
        stroke="#9b8afb"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="2.5" y="6" width="15" height="10.5" rx="5" fill="#7a5af8" />
      <rect x="4.5" y="8.2" width="11" height="5.6" rx="2.8" fill="#2b1a6e" />
      <circle cx="8" cy="11" r="1" fill="#d9d6fe" />
      <circle cx="12" cy="11" r="1" fill="#d9d6fe" />
    </svg>
  )
}

const STAR = 'M12 2.5 14 9.4 21 11.5 14 13.6 12 20.5 10 13.6 3 11.5 10 9.4Z'

// Three sparkles in a gradient, shown above AskFred's greeting.
export function SparklesIcon({
  size = 32,
  tone = 'green',
}: {
  size?: number
  tone?: 'green' | 'purple'
}) {
  const id = useId()
  const [from, to] = tone === 'green' ? ['#22ccee', '#6ce9a6'] : ['#7a5af8', '#eeaafd']
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={STAR} fill={`url(#${id})`} transform="translate(5 -1) scale(.7)" />
      <path d={STAR} fill={`url(#${id})`} transform="translate(0 7) scale(.4)" />
      <path d={STAR} fill={`url(#${id})`} transform="translate(2 -2) scale(.36)" />
    </svg>
  )
}
