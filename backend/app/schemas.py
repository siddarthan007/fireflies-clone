"""Request and response shapes: the API contract."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator


def clean_names(names: list[str]) -> list[str]:
    """Trim whitespace and drop blanks and duplicates (ignoring case), keeping the order."""
    seen: set[str] = set()
    cleaned: list[str] = []
    for name in (n.strip() for n in names):
        if name and name.lower() not in seen:
            seen.add(name.lower())
            cleaned.append(name)
    return cleaned


Names = Annotated[list[Annotated[str, Field(max_length=120)]], AfterValidator(clean_names)]
TagNames = Annotated[list[Annotated[str, Field(max_length=60)]], AfterValidator(clean_names)]


class Response(BaseModel):
    """Base for everything we send back. Can be built straight from ORM rows."""

    model_config = ConfigDict(from_attributes=True)


class Request(BaseModel):
    """Base for everything we receive. Strings are trimmed."""

    model_config = ConfigDict(str_strip_whitespace=True)


# --- meetings -------------------------------------------------------------


class ChapterOut(Response):
    id: int
    title: str
    start_ms: int
    bullets: list[str]


class ActionItemOut(Response):
    id: int
    meeting_id: int
    text: str
    assignee: str | None
    due_date: date | None
    done: bool


class MeetingListItem(Response):
    id: int
    title: str
    meeting_at: datetime
    duration_seconds: int
    participants: list[str]
    tags: list[str]

    @field_validator("participants", "tags", mode="before")
    @classmethod
    def names_only(cls, items):
        """The ORM holds Participant and Tag rows; the API only needs their names."""
        return [getattr(item, "name", item) for item in items]


class MeetingDetail(MeetingListItem):
    overview: str | None
    chapters: list[ChapterOut]
    action_items: list[ActionItemOut]


class MeetingList(Response):
    items: list[MeetingListItem]
    total: int


class CommentOut(Response):
    id: int
    text: str
    created_at: datetime


class SegmentOut(Response):
    id: int
    speaker: str
    start_ms: int
    end_ms: int
    text: str
    highlighted: bool
    comments: list[CommentOut]


class SegmentUpdate(Request):
    highlighted: bool


class CommentCreate(Request):
    text: str = Field(min_length=1, max_length=500)


class TranscriptIn(Request):
    format: Literal["txt", "vtt", "json"]
    content: str = Field(min_length=1, max_length=2_000_000)


class MeetingCreate(Request):
    title: str | None = Field(None, max_length=200)
    meeting_at: datetime | None = None
    participants: Names = []
    transcript: TranscriptIn


class MeetingUpdate(Request):
    """PATCH body. Only the fields the client sends are changed (see exclude_unset)."""

    title: str | None = Field(None, min_length=1, max_length=200)
    meeting_at: datetime | None = None
    overview: str | None = None  # sending null removes the summary
    participants: Names | None = None
    tags: TagNames | None = None

    @field_validator("title", "meeting_at", "participants", "tags")
    @classmethod
    def not_null(cls, value):
        if value is None:
            raise ValueError("cannot be null")
        return value


class TagCount(Response):
    name: str
    meeting_count: int


class FilterOptions(Response):
    """What the Filters popover can offer: names that actually occur in meetings."""

    participants: list[str]
    tags: list[TagCount]


# --- action items ---------------------------------------------------------


class TaskOut(ActionItemOut):
    """An action item plus the meeting it came from, for the Tasks page."""

    meeting_title: str


class ActionItemCreate(Request):
    text: str = Field(min_length=1, max_length=500)
    assignee: str | None = Field(None, max_length=120)
    due_date: date | None = None


class ActionItemUpdate(Request):
    """PATCH body. Sending null clears assignee and due_date; text and done can't be null."""

    text: str | None = Field(None, min_length=1, max_length=500)
    assignee: str | None = Field(None, max_length=120)
    due_date: date | None = None
    done: bool | None = None

    @field_validator("text", "done")
    @classmethod
    def not_null(cls, value):
        if value is None:
            raise ValueError("cannot be null")
        return value


# --- search, AskFred, profile ---------------------------------------------


class SegmentHit(Response):
    meeting_id: int
    meeting_title: str
    speaker: str
    start_ms: int
    text: str


class SearchResults(Response):
    meetings: list[MeetingListItem]
    segments: list[SegmentHit]


class ChatTurn(Request):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class AskRequest(Request):
    question: str = Field(min_length=1, max_length=1000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)


class UserOut(Response):
    name: str
    email: str
