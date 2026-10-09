"""Global search, the seed data and the small system routes."""

from sqlalchemy import func, select

from app.models import Comment, Meeting, Tag, TranscriptSegment
from app.seed import seed_if_empty
from tests.helpers import create_meeting


def test_search_finds_titles_and_transcript_lines(client):
    meeting = create_meeting(client, title="Roadmap review")
    body = client.get("/api/v1/search", params={"q": "roadmap"}).json()

    assert [m["title"] for m in body["meetings"]] == ["Roadmap review"]
    hits = [(h["speaker"], h["start_ms"]) for h in body["segments"]]
    assert hits == [("Harshita Rao", 0), ("Aditya Verma", 12000)]  # lines that mention it
    assert all(h["meeting_id"] == meeting["id"] for h in body["segments"])
    assert all("roadmap" in h["text"].lower() for h in body["segments"])

    assert client.get("/api/v1/search", params={"q": "nonexistent"}).json() == {
        "meetings": [],
        "segments": [],
    }
    assert client.get("/api/v1/search", params={"q": ""}).status_code == 422


def test_seed_loads_every_sample_meeting_once(db):
    assert seed_if_empty(db) == 8
    assert db.scalar(select(func.count()).select_from(Meeting)) == 8
    assert db.scalar(select(func.count()).select_from(Tag)) > 0
    assert seed_if_empty(db) == 0  # a second call does nothing

    for meeting in db.scalars(select(Meeting)):
        assert meeting.overview and meeting.chapters and meeting.action_items and meeting.segments
        assert meeting.duration_seconds * 1000 >= max(s.end_ms for s in meeting.segments)
        assert all(
            chapter.start_ms <= meeting.duration_seconds * 1000 for chapter in meeting.chapters
        )

    assert db.scalar(select(func.count()).select_from(Comment)) > 0
    highlighted = (
        select(func.count())
        .select_from(TranscriptSegment)
        .where(TranscriptSegment.highlighted.is_(True))
    )
    assert db.scalar(highlighted) > 0


def test_health_and_demo_user(client):
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    me = client.get("/api/v1/me").json()
    assert me["name"] and "@" in me["email"]
