"""Action items: the tasks that come out of a meeting."""

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import ActionItem, Meeting
from app.schemas import ActionItemCreate


def get_action_item(db: Session, item_id: int) -> ActionItem:
    item = db.get(ActionItem, item_id)
    if item is None:
        raise HTTPException(404, "Action item not found")
    return item


def list_action_items(db: Session, *, assignee: str | None, done: bool | None) -> list[ActionItem]:
    """Items from every meeting, newest meeting first, for the Tasks page."""
    query = (
        select(ActionItem)
        .join(Meeting)
        .options(selectinload(ActionItem.meeting))
        .order_by(Meeting.meeting_at.desc(), ActionItem.id)
    )
    if assignee:
        query = query.where(func.lower(ActionItem.assignee) == assignee.lower())
    if done is not None:
        query = query.where(ActionItem.done == done)
    return list(db.scalars(query).all())


def create_action_item(db: Session, meeting: Meeting, data: ActionItemCreate) -> ActionItem:
    item = ActionItem(
        meeting_id=meeting.id, text=data.text, assignee=data.assignee, due_date=data.due_date
    )
    db.add(item)
    db.commit()
    return item


def update_action_item(db: Session, item: ActionItem, changes: dict) -> ActionItem:
    for field, value in changes.items():
        setattr(item, field, value)
    db.commit()
    return item


def delete_action_item(db: Session, item: ActionItem) -> None:
    db.delete(item)
    db.commit()
