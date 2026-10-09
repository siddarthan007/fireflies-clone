'use client'

import { useEffect, useState } from 'react'

// There is no real audio, so the player is a clock. The seek bar, transcript and outline drive it.
export function usePlayer(durationMs: number) {
  const [currentMs, setCurrentMs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  // Advance ten times a second by the real time that passed, scaled by the speed.
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      setCurrentMs((ms) => Math.min(ms + (now - last) * speed, durationMs))
      last = now
    }, 100)
    return () => clearInterval(timer)
  }, [playing, speed, durationMs])

  // Stop at the end.
  useEffect(() => {
    if (playing && currentMs >= durationMs) setPlaying(false)
  }, [playing, currentMs, durationMs])

  const seek = (ms: number) => setCurrentMs(Math.min(Math.max(ms, 0), durationMs))

  function toggle() {
    if (!playing && currentMs >= durationMs) setCurrentMs(0) // play again from the start
    setPlaying((value) => !value)
  }

  return {
    currentMs,
    durationMs,
    playing,
    speed,
    setSpeed,
    seek,
    skip: (deltaMs: number) => seek(currentMs + deltaMs),
    toggle,
  }
}

export type Player = ReturnType<typeof usePlayer>

// Index of the segment being spoken at `ms`: the last one that started. -1 before the first.
export function findActiveIndex(segments: { start_ms: number }[], ms: number): number {
  let low = 0
  let high = segments.length - 1
  let found = -1
  while (low <= high) {
    const middle = (low + high) >> 1
    if (segments[middle].start_ms <= ms) {
      found = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return found
}
