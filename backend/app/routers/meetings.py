"""Meetings: the library, creating a meeting from a transcript, details, export."""

import re
from datetime import date, datetime
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Form, HTTPException, Query, Response, UploadFile

from app.database import DbSession
from app.models import Meeting
from app.schemas import (
    FilterOptions,
    MeetingCreate,
    MeetingDetail,
    MeetingList,
    MeetingUpdate,
    SegmentOut,
)
from app.services import export, meetings
from app.services.transcript_parser import ParsedTranscript, TranscriptError, parse_transcript

router = APIRouter(prefix="/meetings", tags=["meetings"])

MAX_UPLOAD_BYTES = 2 * 1024 * 1024
UPLOAD_FORMATS = ("txt", "vtt", "json")


def read_transcript(fmt: str, text: str) -> ParsedTranscript:
    """Parse, turning a bad transcript into a 422 that says what is wrong."""
    try:
        return parse_transcript(fmt, text)
    except TranscriptError as error:
        raise HTTPException(422, str(error)) from error


@router.get("", response_model=MeetingList)
def list_meetings(
    db: DbSession,
    q: str | None = None,
    participant: Annotated[list[str] | None, Query()] = None,
    tag: Annotated[list[str] | None, Query()] = None,
    date_from: date | None = None,
    date_to: date | None = None,
    sort: Literal["newest", "oldest"] = "newest",
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> MeetingList:
    found, total = meetings.list_meetings(
        db,
        q=q,
        participants=participant or [],
        tags=tag or [],
        date_from=date_from,
        date_to=date_to,
        newest_first=sort == "newest",
        skip=skip,
        limit=limit,
    )
    return MeetingList(items=found, total=total)


# Declared before /{meeting_id} so "filter-options" is not read as an id.
@router.get("/filter-options", response_model=FilterOptions)
def get_filter_options(db: DbSession) -> FilterOptions:
    return meetings.filter_options(db)


@router.post("", response_model=MeetingDetail, status_code=201)
def create_meeting(body: MeetingCreate, db: DbSession) -> Meeting:
    parsed = read_transcript(body.transcript.format, body.transcript.content)
    return meetings.create_meeting(
        db,
        parsed,
        title=body.title,
        meeting_at=body.meeting_at,
        participants=body.participants,
    )


@router.post("/upload", response_model=MeetingDetail, status_code=201)
def upload_meeting(
    db: DbSession,
    file: UploadFile,
    title: Annotated[str | None, Form(max_length=200)] = None,
    meeting_at: Annotated[datetime | None, Form()] = None,
) -> Meeting:
    filename = Path(file.filename or "transcript")
    fmt = filename.suffix.lstrip(".").lower()
    if fmt not in UPLOAD_FORMATS:
        raise HTTPException(422, "Upload a .txt, .vtt or .json transcript")
    raw = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "The file is larger than 2 MB")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as error:
        raise HTTPException(422, "The file must be UTF-8 text") from error

    parsed = read_transcript(fmt, text)
    name_from_file = re.sub(r"[_-]+", " ", filename.stem).strip()
    return meetings.create_meeting(
        db,
        parsed,
        title=(title or "").strip() or parsed.title or name_from_file[:200],
        meeting_at=meeting_at,
        participants=[],
    )


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: int, db: DbSession) -> Meeting:
    return meetings.get_meeting(db, meeting_id)


@router.patch("/{meeting_id}", response_model=MeetingDetail)
def update_meeting(meeting_id: int, body: MeetingUpdate, db: DbSession) -> Meeting:
    meeting = meetings.get_meeting(db, meeting_id)
    return meetings.update_meeting(db, meeting, body.model_dump(exclude_unset=True))


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, db: DbSession) -> None:
    meetings.delete_meeting(db, meetings.get_meeting(db, meeting_id))


@router.get("/{meeting_id}/transcript", response_model=list[SegmentOut])
def get_transcript(meeting_id: int, db: DbSession):
    return meetings.get_meeting(db, meeting_id).segments


@router.get("/{meeting_id}/export")
def export_meeting(
    meeting_id: int, db: DbSession, format: Literal["markdown", "txt"] = "markdown"
) -> Response:
    meeting = meetings.get_meeting(db, meeting_id)
    if format == "markdown":
        body, media_type, extension = export.to_markdown(meeting), "text/markdown", "md"
    else:
        body, media_type, extension = export.to_text(meeting), "text/plain", "txt"
    slug = re.sub(r"[^a-z0-9]+", "-", meeting.title.lower()).strip("-") or "meeting"
    return Response(
        body,
        media_type=f"{media_type}; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{slug}.{extension}"'},
    )
