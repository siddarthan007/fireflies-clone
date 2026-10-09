"""Load the sample meetings from seed_data/ into an empty database.

The API calls seed_if_empty() on startup. You can also run `python -m app.seed`.
Dates in the files are relative (days ago, and a time of day in IST), so the library always
looks recent.
"""

import json
from datetime import UTC, datetime, time, timedelta, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import (
    ActionItem,
    Chapter,
    Comment,
    Meeting,
    Participant,
    Tag,
    TranscriptSegment,
)

SEED_DIR = Path(__file__).parent / "seed_data"
IST = timezone(timedelta(hours=5, minutes=30))


def meeting_time(days_ago: int, clock: str) -> datetime:
    day = datetime.now(IST).date() - timedelta(days=days_ago)
    hour, minute = (int(part) for part in clock.split(":"))
    return datetime.combine(day, time(hour, minute), tzinfo=IST).astimezone(UTC)


def seed_if_empty(db: Session) -> int:
    """Insert every file in seed_data/. Does nothing if meetings already exist."""
    if db.scalar(select(Meeting.id).limit(1)) is not None:
        return 0

    tags: dict[str, Tag] = {}  # one Tag row per name, shared between meetings
    files = sorted(SEED_DIR.glob("*.json"))
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        segments = [
            TranscriptSegment(
                speaker=s["speaker"],
                start_ms=round(s["start"] * 1000),
                end_ms=round(s["end"] * 1000),
                text=s["text"],
                highlighted=s.get("highlighted", False),
                comments=[Comment(text=text) for text in s.get("comments", [])],
            )
            for s in data["segments"]
        ]
        db.add(
            Meeting(
                title=data["title"],
                meeting_at=meeting_time(data["days_ago"], data["time"]),
                duration_seconds=(max(s.end_ms for s in segments) + 999) // 1000,
                overview=data["overview"],
                participants=[Participant(name=name) for name in data["participants"]],
                tags=[tags.setdefault(name, Tag(name=name)) for name in data["tags"]],
                segments=segments,
                chapters=[
                    Chapter(
                        title=c["title"], start_ms=round(c["start"] * 1000), bullets=c["bullets"]
                    )
                    for c in data["chapters"]
                ],
                action_items=[
                    ActionItem(
                        text=item["text"],
                        assignee=item["assignee"],
                        due_date=datetime.now(IST).date() + timedelta(days=item["due_in_days"]),
                        done=item["done"],
                    )
                    for item in data["action_items"]
                ],
            )
        )
    db.commit()
    return len(files)


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        added = seed_if_empty(session)
    print(f"Added {added} meetings." if added else "Meetings already exist, nothing to do.")
