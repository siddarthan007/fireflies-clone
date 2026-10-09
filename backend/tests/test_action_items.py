"""Action items API: add, edit, complete, clear a field, delete, and the Tasks list."""

from tests.helpers import create_meeting


def add_item(client, meeting_id, **fields):
    response = client.post(
        f"/api/v1/meetings/{meeting_id}/action-items", json={"text": "Send the deck", **fields}
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_add_item_shows_up_in_the_meeting(client):
    meeting = create_meeting(client)
    item = add_item(client, meeting["id"], assignee="Harshita Rao", due_date="2026-10-09")
    assert item["done"] is False
    assert item["due_date"] == "2026-10-09"

    detail = client.get(f"/api/v1/meetings/{meeting['id']}").json()
    assert "Send the deck" in [i["text"] for i in detail["action_items"]]


def test_add_item_needs_text_and_an_existing_meeting(client):
    meeting = create_meeting(client)
    blank = client.post(f"/api/v1/meetings/{meeting['id']}/action-items", json={"text": " "})
    assert blank.status_code == 422
    assert client.post("/api/v1/meetings/999/action-items", json={"text": "x"}).status_code == 404


def test_edit_complete_and_clear_fields(client):
    meeting = create_meeting(client)
    item = add_item(client, meeting["id"], assignee="Harshita Rao", due_date="2026-10-09")
    url = f"/api/v1/action-items/{item['id']}"

    assert client.patch(url, json={"done": True}).json()["done"] is True
    renamed = client.patch(url, json={"text": "Send the new deck"}).json()
    assert renamed["text"] == "Send the new deck"

    cleared = client.patch(url, json={"assignee": None, "due_date": None}).json()
    assert cleared["assignee"] is None and cleared["due_date"] is None
    assert cleared["done"] is True  # fields that were not sent stay as they were


def test_edit_rejects_nulls_for_required_fields(client):
    meeting = create_meeting(client)
    item = add_item(client, meeting["id"])
    url = f"/api/v1/action-items/{item['id']}"
    assert client.patch(url, json={"text": None}).status_code == 422
    assert client.patch(url, json={"done": None}).status_code == 422
    assert client.patch("/api/v1/action-items/999", json={"done": True}).status_code == 404


def test_delete_item(client):
    meeting = create_meeting(client)
    item = add_item(client, meeting["id"])
    assert client.delete(f"/api/v1/action-items/{item['id']}").status_code == 204
    assert client.delete(f"/api/v1/action-items/{item['id']}").status_code == 404


def test_task_list_spans_meetings_and_filters(client):
    first = create_meeting(client, title="First", meeting_at="2026-01-01T09:00:00Z")
    second = create_meeting(client, title="Second", meeting_at="2026-02-01T09:00:00Z")
    add_item(client, first["id"], text="Mine", assignee="Siddartha Nepal")
    done = add_item(client, second["id"], text="Theirs", assignee="Aditya Verma")
    client.patch(f"/api/v1/action-items/{done['id']}", json={"done": True})

    def texts(**params):
        tasks = client.get("/api/v1/action-items", params=params).json()
        return [t["text"] for t in tasks if t["text"] in ("Mine", "Theirs")]

    assert texts() == ["Theirs", "Mine"]  # newest meeting first

    tasks = client.get("/api/v1/action-items").json()
    assert {t["text"]: t["meeting_title"] for t in tasks}["Theirs"] == "Second"

    assert texts(assignee="siddartha nepal") == ["Mine"]
    assert texts(done=False) == ["Mine"]
