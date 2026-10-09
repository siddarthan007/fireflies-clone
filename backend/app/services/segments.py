"""Highlights and comments on transcript lines."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Comment, TranscriptSegment


def get_segment(db: Session, segment_id: int) -> TranscriptSegment:
    segment = db.get(TranscriptSegment, segment_id)
    if segment is None:
        raise HTTPException(404, "Transcript line not found")
    return segment


def set_highlight(db: Session, segment: TranscriptSegment, highlighted: bool) -> TranscriptSegment:
    segment.highlighted = highlighted
    db.commit()
    return segment


def add_comment(db: Session, segment: TranscriptSegment, text: str) -> Comment:
    comment = Comment(segment_id=segment.id, text=text)
    db.add(comment)
    db.commit()
    return comment


def delete_comment(db: Session, comment_id: int) -> None:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(404, "Comment not found")
    db.delete(comment)
    db.commit()
