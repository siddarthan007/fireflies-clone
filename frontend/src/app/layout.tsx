import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { Providers } from './providers'
import './globals.css'

// Inter for text and DM Sans for buttons and headings: the two fonts the real app uses.
const inter = localFont({
  src: './fonts/inter-latin.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
})
const dmSans = localFont({
  src: './fonts/dm-sans-latin.woff2',
  variable: '--font-dm-sans',
  weight: '100 900',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Fireflies', template: '%s - Fireflies' },
  description: 'Meeting notes, transcripts and action items.',
}

// Runs before the first paint so a saved dark theme never flashes light.
const themeScript = `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
