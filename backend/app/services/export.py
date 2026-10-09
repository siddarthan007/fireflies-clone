"""Render a meeting as Markdown or plain text for download."""

from app.models import Meeting
from app.services.text import clock


def header_lines(meeting: Meeting) -> list[str]:
    lines = [
        f"Date: {meeting.meeting_at:%Y-%m-%d %H:%M} UTC",
        f"Duration: {meeting.duration_seconds // 60} min",
    ]
    if meeting.participants:
        lines.append("Participants: " + ", ".join(p.name for p in meeting.participants))
    if meeting.tags:
        lines.append("Tags: " + ", ".join(t.name for t in meeting.tags))
    return lines


def to_markdown(meeting: Meeting) -> str:
    lines = [f"# {meeting.title}", "", *header_lines(meeting), ""]
    if meeting.overview:
        lines += ["## Overview", "", meeting.overview, ""]
    if meeting.chapters:
        lines += ["## Outline", ""]
        for chapter in meeting.chapters:
            lines.append(f"### {chapter.title} ({clock(chapter.start_ms)})")
            lines += [f"- {bullet}" for bullet in chapter.bullets]
            lines.append("")
    if meeting.action_items:
        lines += ["## Action items", ""]
        for item in meeting.action_items:
            who = f" ({item.assignee})" if item.assignee else ""
            lines.append(f"- [{'x' if item.done else ' '}] {item.text}{who}")
        lines.append("")
    lines += ["## Transcript", ""]
    for segment in meeting.segments:
        lines += [f"**{segment.speaker}** ({clock(segment.start_ms)})", segment.text, ""]
    return "\n".join(lines)


def to_text(meeting: Meeting) -> str:
    lines = [meeting.title, *header_lines(meeting), ""]
    if meeting.overview:
        lines += ["OVERVIEW", meeting.overview, ""]
    if meeting.action_items:
        lines.append("ACTION ITEMS")
        lines += [f"[{'x' if i.done else ' '}] {i.text}" for i in meeting.action_items]
        lines.append("")
    lines += ["TRANSCRIPT", ""]
    for segment in meeting.segments:
        lines += [f"{segment.speaker}  {clock(segment.start_ms)}", segment.text, ""]
    return "\n".join(lines)
