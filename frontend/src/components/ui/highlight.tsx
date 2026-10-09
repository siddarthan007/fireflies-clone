// Text with every occurrence of `query` wrapped in <mark>. Used by both search boxes.
export function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim()
  if (!term) return <>{text}</>
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Splitting on a capture group puts the matches at the odd positions.
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>,
      )}
    </>
  )
}
