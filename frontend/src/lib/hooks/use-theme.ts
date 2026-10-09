'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

// The theme is a "dark" class on <html>, set by a script in the root layout before first paint.
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const readTheme = () =>
      setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    readTheme()
    window.addEventListener('themechange', readTheme)
    return () => window.removeEventListener('themechange', readTheme)
  }, [])

  function setTheme(next: Theme) {
    document.documentElement.classList.toggle('dark', next === 'dark')
    setThemeState(next)
    window.dispatchEvent(new Event('themechange'))
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Storage can be blocked (private windows). The theme still changes for this visit.
    }
  }

  return { theme, setTheme }
}
