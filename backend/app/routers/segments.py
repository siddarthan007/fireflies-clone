"""Highlights and comments on transcript lines."""

from fastapi import APIRouter

from app.database import DbSession
from app.models import Comment, TranscriptSegment
from app.schemas import CommentCreate, CommentOut, SegmentOut, SegmentUpdate
from app.services import segments

router = APIRouter(tags=["transcript"])


@router.patch("/segments/{segment_id}", response_model=SegmentOut)
def update_segment(segment_id: int, body: SegmentUpdate, db: DbSession) -> TranscriptSegment:
    segment = segments.get_segment(db, segment_id)
    return segments.set_highlight(db, segment, body.highlighted)


@router.post("/segments/{segment_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(segment_id: int, body: CommentCreate, db: DbSession) -> Comment:
    segment = segments.get_segment(db, segment_id)
    return segments.add_comment(db, segment, body.text)


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: DbSession) -> None:
    segments.delete_comment(db, comment_id)
