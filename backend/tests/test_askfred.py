"""AskFred: the streamed answer, with and without a Gemini key."""

from app.services import ai
from tests.helpers import FakeGemini, create_meeting

API = "/api/v1"


def ask(client, meeting_id, question, **body):
    response = client.post(f"{API}/meetings/{meeting_id}/ask", json={"question": question, **body})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    return response.text


def test_answers_come_from_the_notes_without_a_key(client):
    meeting = create_meeting(client)
    client.post(f"{API}/meetings/{meeting['id']}/action-items", json={"text": "Send pricing"})

    assert "Send pricing" in ask(client, meeting["id"], "What are the action items?")
    assert "next week" in ask(client, meeting["id"], "When is the roadmap review?")
    assert "I could not find that" in ask(client, meeting["id"], "What about the cricket score?")


def test_questions_about_all_meetings(client):
    create_meeting(client, title="One")
    answer = client.post(f"{API}/ask", json={"question": "Who attended?"}).text
    assert "**One**: Harshita Rao, Aditya Verma" in answer
    assert client.post(f"{API}/meetings/999/ask", json={"question": "hi"}).status_code == 404
    assert client.post(f"{API}/ask", json={"question": ""}).status_code == 422


def test_gemini_answer_streams_through_with_the_meeting_in_the_prompt(client, monkeypatch):
    meeting = create_meeting(client)
    fake = FakeGemini(chunks=["The roadmap ", "review is ", "next week."])
    monkeypatch.setattr(ai, "get_client", lambda: fake)

    history = [
        {"role": "assistant", "content": "Left over from an earlier cut-off chat."},
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi, ask me anything."},
    ]
    assert ask(client, meeting["id"], "When is it?", history=history) == (
        "The roadmap review is next week."
    )

    call = fake.calls[0]
    roles = [content.role for content in call["contents"]]
    assert roles == ["user", "model", "user"]  # starts with the user, ends with the question
    system = call["config"].system_instruction
    assert "Aditya Verma: Sounds good. The roadmap review is next week." in system
    assert "Answer only from the meeting data" in system
    assert fake.closed


def test_rules_answer_when_gemini_fails_before_any_text(client, monkeypatch):
    meeting = create_meeting(client)
    monkeypatch.setattr(ai, "get_client", lambda: FakeGemini(error=RuntimeError("offline")))
    assert "next week" in ask(client, meeting["id"], "When is the roadmap review?")


def test_a_cut_off_stream_says_so(client, monkeypatch):
    meeting = create_meeting(client)
    fake = FakeGemini(chunks=["The roadmap "], error=RuntimeError("connection reset"))
    monkeypatch.setattr(ai, "get_client", lambda: fake)

    answer = ask(client, meeting["id"], "When is it?")
    assert answer.startswith("The roadmap ")
    assert "cut short" in answer
    assert fake.closed


def test_an_empty_gemini_stream_falls_back_to_the_notes(client, monkeypatch):
    meeting = create_meeting(client)
    fake = FakeGemini(chunks=[])
    monkeypatch.setattr(ai, "get_client", lambda: fake)

    assert "next week" in ask(client, meeting["id"], "When is the roadmap review?")
    assert fake.closed
