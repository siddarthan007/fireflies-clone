"""Highlights and comments on transcript lines."""

from tests.helpers import create_meeting

API = "/api/v1"


def first_segment(client):
    meeting = create_meeting(client)
    return meeting, client.get(f"{API}/meetings/{meeting['id']}/transcript").json()[0]


def test_highlight_a_line_and_remove_it(client):
    meeting, segment = first_segment(client)
    url = f"{API}/segments/{segment['id']}"

    assert client.patch(url, json={"highlighted": True}).json()["highlighted"] is True
    transcript = client.get(f"{API}/meetings/{meeting['id']}/transcript").json()
    assert [s["highlighted"] for s in transcript] == [True, False, False]

    assert client.patch(url, json={"highlighted": False}).json()["highlighted"] is False


def test_comments_show_up_on_the_line_and_can_be_deleted(client):
    meeting, segment = first_segment(client)
    url = f"{API}/segments/{segment['id']}/comments"

    created = client.post(url, json={"text": "  Share this with sales  "})
    assert created.status_code == 201
    assert created.json()["text"] == "Share this with sales"  # trimmed
    client.post(url, json={"text": "Second thought"})

    transcript = client.get(f"{API}/meetings/{meeting['id']}/transcript").json()
    assert [c["text"] for c in transcript[0]["comments"]] == [
        "Share this with sales",
        "Second thought",
    ]
    assert transcript[1]["comments"] == []

    assert client.delete(f"{API}/comments/{created.json()['id']}").status_code == 204
    assert client.delete(f"{API}/comments/{created.json()['id']}").status_code == 404
    transcript = client.get(f"{API}/meetings/{meeting['id']}/transcript").json()
    assert [c["text"] for c in transcript[0]["comments"]] == ["Second thought"]


def test_bad_input_and_unknown_lines(client):
    _, segment = first_segment(client)
    assert (
        client.post(f"{API}/segments/{segment['id']}/comments", json={"text": " "}).status_code
        == 422
    )
    assert client.post(f"{API}/segments/999/comments", json={"text": "Hi"}).status_code == 404
    assert client.patch(f"{API}/segments/999", json={"highlighted": True}).status_code == 404
    assert client.patch(f"{API}/segments/{segment['id']}", json={}).status_code == 422
