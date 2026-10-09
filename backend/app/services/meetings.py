"""Everything the API does with meetings. Functions that change data also commit it."""

from datetime import UTC, date, datetime, time, timedelta

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    ActionItem,
    Chapter,
    Meeting,
    Participant,
    Tag,
    TranscriptSegment,
    meeting_tags,
)
from app.schemas import FilterOptions, SearchResults, SegmentHit, TagCount, clean_names
from app.services.notes import generate_notes
from app.services.transcript_parser import ParsedTranscript


def get_meeting(db: Session, meeting_id: int) -> Meeting:
    meeting = db.get(Meeting, meeting_id)
    if meeting is None:
        raise HTTPException(404, "Meeting not found")
    return meeting


def start_of_day(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=UTC)


def list_meetings(
    db: Session,
    *,
    q: str | None,
    participants: list[str],
    tags: list[str],
    date_from: date | None,
    date_to: date | None,
    newest_first: bool,
    skip: int,
    limit: int,
) -> tuple[list[Meeting], int]:
    """Filtered, sorted page of meetings plus the total number of matches."""
    query = select(Meeting)
    if q:
        query = query.where(Meeting.title.icontains(q, autoescape=True))
    if participants:
        query = query.where(Meeting.participants.any(Participant.name.in_(participants)))
    if tags:
        query = query.where(Meeting.tags.any(Tag.name.in_(tags)))
    if date_from:
        query = query.where(Meeting.meeting_at >= start_of_day(date_from))
    if date_to:  # inclusive, so the filter stops at the end of that day
        query = query.where(Meeting.meeting_at < start_of_day(date_to + timedelta(days=1)))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    order = Meeting.meeting_at.desc() if newest_first else Meeting.meeting_at.asc()
    page = db.scalars(query.order_by(order, Meeting.id).offset(skip).limit(limit)).all()
    return list(page), total


def create_meeting(
    db: Session,
    parsed: ParsedTranscript,
    *,
    title: str | None,
    meeting_at: datetime | None,
    participants: list[str],
) -> Meeting:
    """Store a meeting, its transcript and generated notes. Default participants: the speakers."""
    names = participants or clean_names(parsed.participants) or parsed.speakers
    notes = generate_notes(parsed.segments)
    meeting = Meeting(
        title=title or parsed.title or "Untitled meeting",
        meeting_at=meeting_at or datetime.now(UTC),
        duration_seconds=parsed.duration_seconds,
        overview=notes.overview.strip() or None,
        participants=[Participant(name=name) for name in names],
        segments=[
            TranscriptSegment(speaker=s.speaker, start_ms=s.start_ms, end_ms=s.end_ms, text=s.text)
            for s in parsed.segments
        ],
        chapters=[
            Chapter(
                title=chapter.title.strip()[:200],
                start_ms=min(max(chapter.start_seconds, 0) * 1000, parsed.duration_seconds * 1000),
                bullets=[bullet.strip() for bullet in chapter.bullets if bullet.strip()],
            )
            for chapter in notes.chapters
            if chapter.title.strip()
        ],
        action_items=[
            ActionItem(
                text=item.text.strip()[:500], assignee=(item.assignee or "").strip()[:120] or None
            )
            for item in notes.action_items
            if item.text.strip()
        ],
    )
    db.add(meeting)
    db.commit()
    return meeting


def get_or_create_tag(db: Session, name: str) -> Tag:
    tag = db.scalar(select(Tag).where(func.lower(Tag.name) == name.lower()))
    return tag or Tag(name=name)


def update_meeting(db: Session, meeting: Meeting, changes: dict) -> Meeting:
    """Apply the fields the client sent. Participants and tags replace the whole list."""
    if "participants" in changes:
        meeting.participants = [Participant(name=n) for n in changes.pop("participants")]
    if "tags" in changes:
        meeting.tags = [get_or_create_tag(db, n) for n in changes.pop("tags")]
    for field, value in changes.items():
        setattr(meeting, field, value)
    db.commit()
    return meeting


def delete_meeting(db: Session, meeting: Meeting) -> None:
    db.delete(meeting)
    db.commit()


def filter_options(db: Session) -> FilterOptions:
    """The participant names and tags that exist, for the Filters popover."""
    names = db.scalars(select(Participant.name).distinct().order_by(Participant.name)).all()
    tag_rows = db.execute(
        select(Tag.name, func.count(meeting_tags.c.meeting_id))
        .join(meeting_tags, meeting_tags.c.tag_id == Tag.id)
        .group_by(Tag.id)
        .order_by(Tag.name)
    ).all()
    return FilterOptions(
        participants=list(names),
        tags=[TagCount(name=name, meeting_count=count) for name, count in tag_rows],
    )


def search(db: Session, q: str) -> SearchResults:
    """Global search: meetings whose title matches, and transcript lines that match."""
    meetings = db.scalars(
        select(Meeting)
        .where(Meeting.title.icontains(q, autoescape=True))
        .order_by(Meeting.meeting_at.desc())
        .limit(5)
    ).all()
    rows = db.execute(
        select(TranscriptSegment, Meeting.title)
        .join(Meeting, TranscriptSegment.meeting_id == Meeting.id)
        .where(TranscriptSegment.text.icontains(q, autoescape=True))
        .order_by(Meeting.meeting_at.desc(), TranscriptSegment.start_ms)
        .limit(20)
    ).all()
    return SearchResults(
        meetings=meetings,
        segments=[
            SegmentHit(
                meeting_id=segment.meeting_id,
                meeting_title=title,
                speaker=segment.speaker,
                start_ms=segment.start_ms,
                text=segment.text,
            )
            for segment, title in rows
        ],
    )
