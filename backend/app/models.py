"""Database tables.

    meetings 1---* participants          who was in the meeting
    meetings 1---* transcript_segments   one row per spoken turn
    transcript_segments 1---* comments   notes people leave on a line
    meetings 1---* chapters              the outline
    meetings 1---* action_items          tasks, editable by the user
    meetings *---* tags                  through meeting_tags

Everything below `meetings` belongs to it: deleting a meeting deletes the rest.
"""

from datetime import UTC, date, datetime

from sqlalchemy import JSON, Column, Date, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UTCDateTime

meeting_tags = Table(
    "meeting_tags",
    Base.metadata,
    Column("meeting_id", ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    meeting_at: Mapped[datetime] = mapped_column(UTCDateTime, index=True)
    duration_seconds: Mapped[int]
    overview: Mapped[str | None] = mapped_column(Text)  # the summary paragraph

    # Every list row shows participants and tags, so they load together with the meeting.
    participants: Mapped[list["Participant"]] = relationship(
        cascade="all, delete-orphan", order_by="Participant.id", lazy="selectin"
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary=meeting_tags, back_populates="meetings", order_by="Tag.name", lazy="selectin"
    )
    segments: Mapped[list["TranscriptSegment"]] = relationship(
        cascade="all, delete-orphan", order_by="TranscriptSegment.start_ms"
    )
    chapters: Mapped[list["Chapter"]] = relationship(
        cascade="all, delete-orphan", order_by="Chapter.start_ms"
    )
    action_items: Mapped[list["ActionItem"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="ActionItem.id"
    )


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    speaker: Mapped[str] = mapped_column(String(120))
    start_ms: Mapped[int]
    end_ms: Mapped[int]
    text: Mapped[str] = mapped_column(Text)
    highlighted: Mapped[bool] = mapped_column(default=False)

    comments: Mapped[list["Comment"]] = relationship(
        cascade="all, delete-orphan", order_by="Comment.id", lazy="selectin"
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    segment_id: Mapped[int] = mapped_column(
        ForeignKey("transcript_segments.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=lambda: datetime.now(UTC))


class Chapter(Base):
    __tablename__ = "chapters"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    start_ms: Mapped[int]  # clicking the chapter seeks the player here
    bullets: Mapped[list[str]] = mapped_column(JSON)  # shown with the chapter, never queried


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(String(500))
    assignee: Mapped[str | None] = mapped_column(String(120))  # a name, not an account
    due_date: Mapped[date | None] = mapped_column(Date)
    done: Mapped[bool] = mapped_column(default=False)

    meeting: Mapped[Meeting] = relationship(back_populates="action_items")

    @property
    def meeting_title(self) -> str:
        """The Tasks page lists items from every meeting and shows where each came from."""
        return self.meeting.title


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)

    meetings: Mapped[list[Meeting]] = relationship(secondary=meeting_tags, back_populates="tags")
