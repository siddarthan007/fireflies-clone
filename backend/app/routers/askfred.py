"""AskFred: ask about one meeting or about all of them. The answer streams as plain text."""

from collections.abc import Iterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.database import DbSession
from app.schemas import AskRequest
from app.services import askfred, meetings

router = APIRouter(tags=["askfred"])


def text_stream(chunks: Iterator[str]) -> StreamingResponse:
    return StreamingResponse(
        chunks,
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/ask")
def ask_all_meetings(body: AskRequest, db: DbSession) -> StreamingResponse:
    return text_stream(askfred.stream_answer(db, body.question, body.history, None))


@router.post("/meetings/{meeting_id}/ask")
def ask_one_meeting(meeting_id: int, body: AskRequest, db: DbSession) -> StreamingResponse:
    meeting = meetings.get_meeting(db, meeting_id)
    return text_stream(askfred.stream_answer(db, body.question, body.history, meeting))
