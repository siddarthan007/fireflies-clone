// Shapes returned by the API, matching backend/app/schemas.py.

export interface Chapter {
  id: number
  title: string
  start_ms: number
  bullets: string[]
}

export interface ActionItem {
  id: number
  meeting_id: number
  text: string
  assignee: string | null
  due_date: string | null // "2026-10-09"
  done: boolean
}

export interface Task extends ActionItem {
  meeting_title: string
}

export interface MeetingListItem {
  id: number
  title: string
  meeting_at: string // ISO timestamp in UTC, ends with Z
  duration_seconds: number
  participants: string[]
  tags: string[]
}

export interface MeetingDetail extends MeetingListItem {
  overview: string | null
  chapters: Chapter[]
  action_items: ActionItem[]
}

export interface MeetingList {
  items: MeetingListItem[]
  total: number
}

export interface Comment {
  id: number
  text: string
  created_at: string
}

export interface Segment {
  id: number
  speaker: string
  start_ms: number
  end_ms: number
  text: string
  highlighted: boolean
  comments: Comment[]
}

export interface FilterOptions {
  participants: string[]
  tags: { name: string; meeting_count: number }[]
}

export interface SegmentHit {
  meeting_id: number
  meeting_title: string
  speaker: string
  start_ms: number
  text: string
}

export interface SearchResults {
  meetings: MeetingListItem[]
  segments: SegmentHit[]
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface User {
  name: string
  email: string
}

export type TranscriptFormat = 'txt' | 'vtt' | 'json'
