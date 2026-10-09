"""Action items: add, edit, complete and delete tasks, and the cross-meeting task list."""

from fastapi import APIRouter

from app.database import DbSession
from app.models import ActionItem
from app.schemas import ActionItemCreate, ActionItemOut, ActionItemUpdate, TaskOut
from app.services import action_items, meetings

router = APIRouter(tags=["action items"])


@router.get("/action-items", response_model=list[TaskOut])
def list_action_items(
    db: DbSession, assignee: str | None = None, done: bool | None = None
) -> list[ActionItem]:
    return action_items.list_action_items(db, assignee=assignee, done=done)


@router.post("/meetings/{meeting_id}/action-items", response_model=ActionItemOut, status_code=201)
def create_action_item(meeting_id: int, body: ActionItemCreate, db: DbSession) -> ActionItem:
    meeting = meetings.get_meeting(db, meeting_id)
    return action_items.create_action_item(db, meeting, body)


@router.patch("/action-items/{item_id}", response_model=ActionItemOut)
def update_action_item(item_id: int, body: ActionItemUpdate, db: DbSession) -> ActionItem:
    item = action_items.get_action_item(db, item_id)
    return action_items.update_action_item(db, item, body.model_dump(exclude_unset=True))


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(item_id: int, db: DbSession) -> None:
    action_items.delete_action_item(db, action_items.get_action_item(db, item_id))
