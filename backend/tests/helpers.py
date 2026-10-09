"""Small helpers shared by the test files."""

from types import SimpleNamespace

TRANSCRIPT = (
    "Harshita Rao  00:00\n"
    "Thanks for joining. Today we cover the pricing and the roadmap.\n"
    "\n"
    "Aditya Verma  00:12\n"
    "Sounds good. The roadmap review is next week.\n"
    "\n"
    "Harshita Rao  00:30\n"
    "Great, pricing first then. I'll send the revised pricing sheet by Friday.\n"
)


def create_meeting(client, **fields):
    """Create a meeting through the API and return its JSON."""
    body = {
        "title": "Pricing review",
        "meeting_at": "2026-10-02T15:30:00Z",
        "transcript": {"format": "txt", "content": TRANSCRIPT},
        **fields,
    }
    response = client.post("/api/v1/meetings", json=body)
    assert response.status_code == 201, response.text
    return response.json()


class FakeGemini:
    """Stands in for the Gemini client. `chunks` are streamed, then `error` (if set) is raised."""

    def __init__(self, chunks=(), error=None, notes=None):
        self.chunks, self.error, self.notes = list(chunks), error, notes
        self.models = self
        self.calls = []
        self.closed = False

    def close(self):
        self.closed = True

    def generate_content_stream(self, **kwargs):
        self.calls.append(kwargs)
        for text in self.chunks:
            yield SimpleNamespace(text=text)
        if self.error:
            raise self.error

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return SimpleNamespace(parsed=self.notes)
