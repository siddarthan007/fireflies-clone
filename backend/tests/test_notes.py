"""Generated notes: the rules used without a key, and the Gemini path with a fake client."""

from app.services import ai
from app.services.notes import ActionItemNotes, ChapterNotes, Notes, generate_notes
from app.services.transcript_parser import ParsedSegment
from tests.helpers import FakeGemini, create_meeting

LINES = [
    ("Aditya Verma", "The upload service is slow when a college sends many recordings at once."),
    (
        "Saloni Mehta",
        "I'll add a progress bar to the upload dialog so students know it is working.",
    ),
    (
        "Aditya Verma",
        "The upload queue needs more workers, and we need to test the queue with big files.",
    ),
    ("Karthik Nair", "Let's review the queue size alert on Monday."),
]


def segments(lines=LINES):
    return [
        ParsedSegment(speaker, index * 10_000, index * 10_000 + 9_000, text)
        for index, (speaker, text) in enumerate(lines)
    ]


def test_rules_write_a_summary_an_outline_and_action_items():
    notes = generate_notes(segments())

    assert "upload" in notes.overview.lower()
    assert [c.start_seconds for c in notes.chapters] == [0]
    assert notes.chapters[0].bullets  # the best sentences of the chapter
    owners = {item.text: item.assignee for item in notes.action_items}
    progress_bar = "I'll add a progress bar to the upload dialog so students know it is working."
    assert owners[progress_bar] == "Saloni Mehta"  # "I'll" makes the speaker the owner
    assert "Let's review the queue size alert on Monday." not in owners  # chatter, not a task
    shared = "The upload queue needs more workers, and we need to test the queue with big files."
    assert owners[shared] is None  # "we" does not name an owner


def test_long_transcripts_get_several_chapters_in_time_order():
    many = segments(
        [
            ("Aditya Verma", f"Topic {n} is about the upload queue and the retries.")
            for n in range(40)
        ]
    )
    starts = [chapter.start_seconds for chapter in generate_notes(many).chapters]
    assert len(starts) == 4 and starts == sorted(starts) and starts[0] == 0


def test_gemini_notes_are_used_when_a_key_is_set(monkeypatch):
    written = Notes(
        overview="The team agreed to add a progress bar.",
        chapters=[ChapterNotes(title="Uploads", start_seconds=0, bullets=["Progress bar"])],
        action_items=[ActionItemNotes(text="Build the progress bar", assignee="Saloni Mehta")],
    )
    fake = FakeGemini(notes=written)
    monkeypatch.setattr(ai, "get_client", lambda: fake)

    assert generate_notes(segments()) == written
    assert fake.closed
    prompt = fake.calls[0]["contents"]
    assert "[0:10] Saloni Mehta: I'll add a progress bar" in prompt  # the transcript with times


def test_rules_take_over_when_gemini_fails(monkeypatch):
    monkeypatch.setattr(ai, "get_client", lambda: FakeGemini(error=RuntimeError("quota")))
    assert "upload" in generate_notes(segments()).overview.lower()

    monkeypatch.setattr(ai, "get_client", lambda: FakeGemini(notes=None))  # reply without notes
    assert generate_notes(segments()).chapters


def test_a_created_meeting_keeps_gemini_notes_inside_the_meeting(client, monkeypatch):
    written = Notes(
        overview="Summary.",
        chapters=[
            ChapterNotes(title="Pricing", start_seconds=5, bullets=["Agreed on pricing"]),
            ChapterNotes(title="Way past the end", start_seconds=9_999, bullets=[]),
            ChapterNotes(title="  ", start_seconds=0, bullets=[]),
        ],
        action_items=[ActionItemNotes(text="Send pricing", assignee=" "), ActionItemNotes(text="")],
    )
    monkeypatch.setattr(ai, "get_client", lambda: FakeGemini(notes=written))

    meeting = create_meeting(client)
    assert [(c["title"], c["start_ms"]) for c in meeting["chapters"]] == [
        ("Pricing", 5000),
        ("Way past the end", 33_000),  # clamped to the length of the meeting
    ]
    assert [(i["text"], i["assignee"]) for i in meeting["action_items"]] == [("Send pricing", None)]
