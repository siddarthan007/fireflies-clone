import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Markdown styling lives here, as descendant selectors, so the chat answers share one look.
const STYLE = [
  'space-y-3 text-sm leading-6 text-fg-secondary break-words',
  '[&_strong]:font-semibold [&_strong]:text-fg',
  '[&_h1]:font-semibold [&_h1]:text-fg [&_h2]:font-semibold [&_h2]:text-fg [&_h3]:font-semibold [&_h3]:text-fg',
  '[&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:pl-1',
  '[&_a]:text-fg-link [&_a]:underline [&_a]:underline-offset-2',
  '[&_code]:rounded-sm [&_code]:bg-strong [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_blockquote]:text-fg-muted',
  '[&_table]:block [&_table]:overflow-x-auto [&_th]:border-b [&_th]:border-line [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border-b [&_td]:border-line-subtle [&_td]:px-2 [&_td]:py-1',
].join(' ')

export function Markdown({ text }: { text: string }) {
  return (
    <div className={STYLE}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}
