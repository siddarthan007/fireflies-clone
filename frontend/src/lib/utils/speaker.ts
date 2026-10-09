// A speaker always gets the same avatar color. Class names are written in full so Tailwind sees them.
const AVATAR_CLASSES = [
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
  'bg-avatar-7',
  'bg-avatar-8',
]

export function avatarClass(name: string): string {
  let sum = 0
  for (const char of name) sum += char.charCodeAt(0)
  return AVATAR_CLASSES[sum % AVATAR_CLASSES.length]
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
