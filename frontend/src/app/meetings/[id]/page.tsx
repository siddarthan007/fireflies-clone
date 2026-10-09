'use client'

import { use } from 'react'

import { MeetingView } from '@/components/detail/meeting-view'

// A single meeting. It has its own layout, so it sits outside the (shell) group.
export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <MeetingView key={id} meetingId={Number(id)} />
}
