"""Global search across meeting titles and transcripts."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.database import DbSession
from app.schemas import SearchResults
from app.services import meetings

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResults)
def search(db: DbSession, q: Annotated[str, Query(min_length=1, max_length=100)]) -> SearchResults:
    return meetings.search(db, q.strip())
