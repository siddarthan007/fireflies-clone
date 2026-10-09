"""Startup keeps edits and deletions across restarts of the same SQLite file."""

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import main
from app.database import get_db


def test_a_new_database_is_seeded_once_and_deleted_meetings_stay_deleted(tmp_path, monkeypatch):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'meetings.db'}", connect_args={"check_same_thread": False}
    )
    sessions = sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "SessionLocal", sessions)

    def database():
        with sessions() as db:
            yield db

    main.app.dependency_overrides[get_db] = database
    try:
        with TestClient(main.app) as client:
            meetings = client.get("/api/v1/meetings").json()
            assert meetings["total"] == 8
            for meeting in meetings["items"]:
                assert client.delete(f"/api/v1/meetings/{meeting['id']}").status_code == 204

        with TestClient(main.app) as client:
            assert client.get("/api/v1/meetings").json() == {"items": [], "total": 0}
    finally:
        main.app.dependency_overrides.clear()
        engine.dispose()
