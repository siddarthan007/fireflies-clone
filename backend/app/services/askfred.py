"""AskFred: answers a question about one meeting or about the most recent ones.

With a Gemini key the answer streams from the model. Without a key, or if the model cannot be
reached, it is put together from the meeting notes, so the chat always works.
"""

import re
import time
from collections.abc import Iterator
from datetime import UTC, datetime

from google.genai import types
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Meeting
from app.schemas import ChatTurn
from app.services import ai
from app.services.text import clock, keywords

HISTORY_TURNS = 10
RECENT_MEETINGS = 10
MAX_TRANSCRIPT_CHARS = 60_000
TYPING_DELAY = 0.02  # seconds between words of a rule-based answer, so it streams like the model

SYSTEM_PROMPT = """You are AskFred, the assistant inside a meeting notes app.

Answer only from the meeting data below. If the answer is not there, say you could not find it.
Never invent quotes, owners, dates or action items.

Write for a busy reader:
- Lead with the answer. Add detail only when it helps. Keep it short.
- Use Markdown. Put names, decisions and numbers in **bold**.
- Use "-" bullets for lists and "1." for ordered steps. No headings, tables or emoji.
- When you point to a moment in a transcript, give its time, like (12:40).

Today is {today}.

Meeting data:
{context}"""


def stream_answer(
    db: Session, question: str, history: list[ChatTurn], meeting: Meeting | None
) -> Iterator[str]:
    """Read what is needed from the database now. The stream that comes back does not use it."""
    if meeting is not None:
        meetings = [meeting]
    else:
        recent = select(Meeting).order_by(Meeting.meeting_at.desc()).limit(RECENT_MEETINGS)
        meetings = list(db.scalars(recent))
    context = build_context(meetings, with_transcript=meeting is not None)
    return reply(context, question, history, answer_from_notes(meetings, question))


def reply(context: str, question: str, history: list[ChatTurn], fallback: str) -> Iterator[str]:
    client = ai.get_client()
    if client is not None:
        started = False
        try:
            for text in gemini_stream(client, context, question, history):
                started = True
                yield text
            if started:
                return
        except Exception:  # unreachable, key rejected, quota: carry on without the model
            if started:
                yield "\n\n(The answer was cut short. Ask again to get the rest.)"
                return
        finally:
            client.close()
    for word in re.findall(r"\S+\s*", fallback):
        yield word
        time.sleep(TYPING_DELAY)


# --- Gemini -----------------------------------------------------------------


def build_context(meetings: list[Meeting], *, with_transcript: bool) -> str:
    parts: list[str] = []
    for meeting in meetings:
        parts.append(f"## {meeting.title} ({meeting.meeting_at:%d %b %Y})")
        parts.append("Participants: " + ", ".join(p.name for p in meeting.participants))
        if meeting.overview:
            parts.append(f"Summary: {meeting.overview}")
        for chapter in meeting.chapters:
            parts.append(
                f"Topic {chapter.title} ({clock(chapter.start_ms)}): " + "; ".join(chapter.bullets)
            )
        for item in meeting.action_items:
            who = f", owner {item.assignee}" if item.assignee else ""
            due = f", due {item.due_date:%d %b}" if item.due_date else ""
            status = "done" if item.done else "open"
            parts.append(f"Action item ({status}{who}{due}): {item.text}")
        if with_transcript:
            lines = [f"[{clock(s.start_ms)}] {s.speaker}: {s.text}" for s in meeting.segments]
            parts.append("Transcript:\n" + "\n".join(lines)[:MAX_TRANSCRIPT_CHARS])
        parts.append("")
    return "\n".join(parts)


def gemini_stream(client, context: str, question: str, history: list[ChatTurn]) -> Iterator[str]:
    def turn(role: str, text: str) -> types.Content:
        return types.Content(role=role, parts=[types.Part.from_text(text=text)])

    contents = [
        turn("model" if t.role == "assistant" else "user", t.content)
        for t in history[-HISTORY_TURNS:]
    ]
    while contents and contents[0].role == "model":  # a conversation has to start with the user
        contents.pop(0)
    contents.append(turn("user", question))

    today = f"{datetime.now(UTC):%A, %d %B %Y}"
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT.format(today=today, context=context), temperature=0.3
    )
    stream = client.models.generate_content_stream(
        model=get_settings().gemini_model, contents=contents, config=config
    )
    for chunk in stream:
        if chunk.text:
            yield chunk.text


# --- without a key: answer from the notes -----------------------------------


def answer_from_notes(meetings: list[Meeting], question: str) -> str:
    text = question.lower()
    several = len(meetings) > 1

    if re.search(r"action item|task|to-?do|follow.?up|assign", text):
        open_items = [(m, i) for m in meetings for i in m.action_items if not i.done]
        if not open_items:
            return "There are no open action items."
        lines = [
            f"- {item.text}"
            + (f" (**{item.assignee}**)" if item.assignee else "")
            + (f", from {meeting.title}" if several else "")
            for meeting, item in open_items
        ]
        return "Open action items:\n" + "\n".join(lines)

    if re.search(r"decision|decid|agree|conclu", text):
        bullets = [b for m in meetings for c in m.chapters for b in c.bullets]
        if bullets:
            return "Key points from the notes:\n" + "\n".join(f"- {b}" for b in bullets[:8])
        return "There are no notes to pull decisions from."

    if re.search(r"topic|chapter|outline|agenda|discuss|cover", text):
        titles = [f"- **{c.title}** ({clock(c.start_ms)})" for m in meetings for c in m.chapters]
        if titles:
            return "Topics covered:\n" + "\n".join(titles[:10])

    if re.search(r"summar|overview|recap|catch me up|\bday\b|\btoday\b", text):
        summaries = [
            f"**{m.title}**: {m.overview}" if several else m.overview
            for m in meetings
            if m.overview
        ]
        if summaries:
            return "\n\n".join(summaries[:3])

    if re.search(r"\bwho\b|attend|participant|join", text):
        return "\n".join(
            f"**{m.title}**: " + ", ".join(p.name for p in m.participants) for m in meetings
        )

    return quote_matching_lines(meetings, text)


def quote_matching_lines(meetings: list[Meeting], text: str) -> str:
    """Last resort: quote the transcript lines that share the most words with the question."""
    wanted = set(keywords(text))
    scored = []
    for meeting in meetings:
        for segment in meeting.segments:
            overlap = len(wanted & set(keywords(segment.text)))
            if overlap:
                scored.append((overlap, meeting, segment))
    scored.sort(key=lambda row: row[0], reverse=True)
    if not scored:
        return (
            "I could not find that in the meeting. "
            "Try asking for the summary, action items, decisions or topics."
        )
    lines = [
        f"- **{segment.speaker}** ({clock(segment.start_ms)}"
        + (f", {meeting.title}" if len(meetings) > 1 else "")
        + f"): {segment.text}"
        for _, meeting, segment in scored[:4]
    ]
    return "From the transcript:\n" + "\n".join(lines)
