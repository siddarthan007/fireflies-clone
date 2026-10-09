"""Meetings API: create, list and filter, edit, delete, transcript, export."""

import pytest
from sqlalchemy import func, select

from app.models import ActionItem, Chapter, Comment, Participant, TranscriptSegment
from tests.helpers import TRANSCRIPT, create_meeting

API = "/api/v1/meetings"


@pytest.mark.parametrize("field,limit", [("participants", 120), ("tags", 60)])
def test_metadata_names_reject_values_beyond_the_contract(client, field, limit):
    meeting = create_meeting(client)
    response = client.patch(f"{API}/{meeting['id']}", json={field: ["x" * (limit + 1)]})
    assert response.status_code == 422
    assert client.patch(f"{API}/{meeting['id']}", json={field: ["x" * limit]}).status_code == 200


def test_create_rejects_an_oversized_participant_name(client):
    response = client.post(
        API,
        json={"participants": ["x" * 121], "transcript": {"format": "txt", "content": TRANSCRIPT}},
    )
    assert response.status_code == 422


def test_create_from_pasted_transcript(client):
    meeting = create_meeting(client)
    assert meeting["title"] == "Pricing review"
    assert meeting["meeting_at"] == "2026-10-02T15:30:00Z"  # always UTC with a Z
    assert meeting["duration_seconds"] == 33  # last segment starts at 30s and lasts 3s
    assert meeting["participants"] == ["Harshita Rao", "Aditya Verma"]  # the speakers
    assert meeting["overview"]  # notes are generated on creation
    assert [c["start_ms"] for c in meeting["chapters"]] == [0]
    assert [i["assignee"] for i in meeting["action_items"]] == ["Harshita Rao"]


def test_create_with_explicit_participants_cleans_the_list(client):
    meeting = create_meeting(client, participants=[" Asha ", "asha", "", "Ben"])
    assert meeting["participants"] == ["Asha", "Ben"]


def test_create_with_a_bad_transcript_explains_the_problem(client):
    response = client.post(
        API,
        json={"title": "Bad", "transcript": {"format": "txt", "content": "no timestamps here"}},
    )
    assert response.status_code == 422
    assert "line 1" in response.json()["detail"]


def test_upload_vtt_and_json_files(client):
    vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\n<v Dana>Hello there.</v>\n"
    response = client.post(
        f"{API}/upload", files={"file": ("kickoff_call.vtt", vtt)}, data={"title": ""}
    )
    assert response.status_code == 201
    assert response.json()["title"] == "kickoff call"  # no title given: use the file name
    assert response.json()["participants"] == ["Dana"]

    json_file = (
        '{"title": "Standup", "sentences": '
        '[{"speaker": "Eve", "start_ms": 0, "end_ms": 900, "text": "Hi"}]}'
    )
    response = client.post(f"{API}/upload", files={"file": ("any.json", json_file)})
    assert response.json()["title"] == "Standup"  # the title inside the file wins


def test_upload_rejects_other_file_types(client):
    response = client.post(f"{API}/upload", files={"file": ("slides.pdf", "x")})
    assert response.status_code == 422


def test_get_unknown_meeting_is_404(client):
    assert client.get(f"{API}/999").status_code == 404


def test_list_is_newest_first_and_paginated(client):
    create_meeting(client, title="Old", meeting_at="2026-01-01T09:00:00Z")
    create_meeting(client, title="New", meeting_at="2026-03-01T09:00:00Z")
    create_meeting(client, title="Middle", meeting_at="2026-02-01T09:00:00Z")

    body = client.get(API).json()
    assert [m["title"] for m in body["items"]] == ["New", "Middle", "Old"]
    assert body["total"] == 3

    oldest = client.get(API, params={"sort": "oldest", "limit": 1, "skip": 1}).json()
    assert [m["title"] for m in oldest["items"]] == ["Middle"]
    assert oldest["total"] == 3


def test_list_filters(client):
    create_meeting(
        client,
        title="Sprint planning",
        participants=["Harshita Rao", "Aditya Verma"],
        meeting_at="2026-05-10T09:00:00Z",
    )
    create_meeting(
        client,
        title="Design sync",
        participants=["Saloni Mehta"],
        meeting_at="2026-05-12T18:00:00Z",
    )
    client.patch(f"{API}/2", json={"tags": ["design"]})

    def titles(**params):
        return [m["title"] for m in client.get(API, params=params).json()["items"]]

    assert titles(q="PLAN") == ["Sprint planning"]  # case-insensitive title search
    assert titles(q="100%") == []  # % is not a wildcard
    assert titles(participant="Saloni Mehta") == ["Design sync"]
    assert sorted(titles(participant=["Saloni Mehta", "Aditya Verma"])) == [
        "Design sync",
        "Sprint planning",
    ]
    assert titles(tag="design") == ["Design sync"]
    assert titles(date_from="2026-05-11") == ["Design sync"]
    assert titles(date_to="2026-05-10") == ["Sprint planning"]  # the end date is inclusive
    assert titles(date_from="2026-05-10", date_to="2026-05-12") != []


def test_filter_options_lists_what_exists(client):
    create_meeting(client, participants=["Harshita Rao", "Aditya Verma"])
    create_meeting(client, participants=["Harshita Rao"])
    client.patch(f"{API}/1", json={"tags": ["sales", "demo"]})
    client.patch(f"{API}/2", json={"tags": ["sales"]})

    options = client.get(f"{API}/filter-options").json()
    assert options["participants"] == ["Aditya Verma", "Harshita Rao"]
    assert options["tags"] == [
        {"name": "demo", "meeting_count": 1},
        {"name": "sales", "meeting_count": 2},
    ]


def test_update_changes_only_what_is_sent(client):
    meeting = create_meeting(client)
    response = client.patch(
        f"{API}/{meeting['id']}",
        json={
            "title": "Renamed",
            "participants": ["Asha"],
            "tags": ["a", "A", "b"],
            "overview": "Short.",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert (body["title"], body["participants"], body["tags"]) == ("Renamed", ["Asha"], ["a", "b"])
    assert body["overview"] == "Short."
    assert body["duration_seconds"] == meeting["duration_seconds"]  # untouched

    body = client.patch(f"{API}/{meeting['id']}", json={"overview": None}).json()
    assert body["overview"] is None  # null removes the summary


def test_update_rejects_a_null_title(client):
    meeting = create_meeting(client)
    assert client.patch(f"{API}/{meeting['id']}", json={"title": None}).status_code == 422
    assert client.patch(f"{API}/{meeting['id']}", json={"title": "  "}).status_code == 422


def test_tags_are_shared_between_meetings(client):
    create_meeting(client)
    create_meeting(client)
    client.patch(f"{API}/1", json={"tags": ["Sales"]})
    client.patch(f"{API}/2", json={"tags": ["sales"]})  # same tag, different case
    assert client.get(f"{API}/2").json()["tags"] == ["Sales"]


def test_delete_removes_everything_the_meeting_owns(client, db):
    meeting = create_meeting(client)
    client.post(f"{API}/{meeting['id']}/action-items", json={"text": "Follow up"})
    segment = client.get(f"{API}/{meeting['id']}/transcript").json()[0]
    client.post(f"/api/v1/segments/{segment['id']}/comments", json={"text": "Noted"})

    assert client.delete(f"{API}/{meeting['id']}").status_code == 204
    assert client.get(f"{API}/{meeting['id']}").status_code == 404

    for model in (TranscriptSegment, Comment, Chapter, Participant, ActionItem):
        assert db.scalar(select(func.count()).select_from(model)) == 0


def test_transcript_comes_back_in_time_order(client):
    meeting = create_meeting(client)
    segments = client.get(f"{API}/{meeting['id']}/transcript").json()
    assert [s["speaker"] for s in segments] == ["Harshita Rao", "Aditya Verma", "Harshita Rao"]
    assert [s["start_ms"] for s in segments] == [0, 12000, 30000]
    assert segments[0]["end_ms"] == 12000
    assert segments[0]["highlighted"] is False and segments[0]["comments"] == []


def test_export_markdown_and_text(client):
    meeting = create_meeting(client)
    markdown = client.get(f"{API}/{meeting['id']}/export")
    assert markdown.status_code == 200
    assert markdown.headers["content-disposition"] == 'attachment; filename="pricing-review.md"'
    assert markdown.text.startswith("# Pricing review")
    assert "**Aditya Verma** (0:12)" in markdown.text

    text = client.get(f"{API}/{meeting['id']}/export", params={"format": "txt"})
    assert text.headers["content-disposition"].endswith('.txt"')
    assert TRANSCRIPT.split("\n")[1] in text.text
