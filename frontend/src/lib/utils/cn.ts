import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Joins class names and lets the later one win when two Tailwind classes conflict.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
