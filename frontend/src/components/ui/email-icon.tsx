export function EmailIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6v13h4V9" fill="#4285f4" />
      <path d="M17 9v10h4V6" fill="#34a853" />
      <path d="m3 6 9 7 9-7-4-3-5 4-5-4" fill="#ea4335" />
      <path d="M3 6v5l4 3V9" fill="#c5221f" />
      <path d="M21 6v5l-4 3V9" fill="#fbbc04" />
    </svg>
  )
}
