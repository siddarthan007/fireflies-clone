"""Meeting notes (summary, outline, action items) made from a transcript.

With a Gemini key the model writes them. Without one, simple rules pick them out of the text.
"""

import re
from collections import Counter
from dataclasses import dataclass
from heapq import nlargest

from google.genai import types
from pydantic import BaseModel

from app.config import get_settings
from app.services import ai
from app.services.text import clock, keywords, words
from app.services.transcript_parser import ParsedSegment

MAX_TRANSCRIPT_CHARS = 100_000

PROMPT = """Write meeting notes from the transcript below.
- overview: 2 to 4 sentences on what the meeting was about and what was decided.
- chapters: 3 to 6 topics in the order they came up. Each has a short title, the second it starts
  (start_seconds, from the transcript timestamps) and 2 to 4 bullet points.
- action_items: only tasks someone clearly agreed to do, with the owner's name when it is clear.
  Use an empty list if there are none.
Use only what the transcript says. Do not invent names, numbers or dates.

Transcript:
"""


class ChapterNotes(BaseModel):
    title: str
    start_seconds: int
    bullets: list[str]


class ActionItemNotes(BaseModel):
    text: str
    assignee: str | None = None


class Notes(BaseModel):
    overview: str
    chapters: list[ChapterNotes]
    action_items: list[ActionItemNotes]


def generate_notes(segments: list[ParsedSegment]) -> Notes:
    client = ai.get_client()
    if client is not None:
        try:
            return notes_from_gemini(client, segments)
        except Exception:  # unreachable, key rejected, quota, odd reply: use the rules instead
            pass
        finally:
            client.close()
    return notes_from_rules(segments)


def notes_from_gemini(client, segments: list[ParsedSegment]) -> Notes:
    transcript = "\n".join(f"[{clock(s.start_ms)}] {s.speaker}: {s.text}" for s in segments)
    response = client.models.generate_content(
        model=get_settings().gemini_model,
        contents=PROMPT + transcript[:MAX_TRANSCRIPT_CHARS],
        config=types.GenerateContentConfig(
            response_mime_type="application/json", response_schema=Notes, temperature=0.2
        ),
    )
    if not isinstance(response.parsed, Notes):
        raise ValueError("the reply did not contain notes")
    return response.parsed


# --- without a key ----------------------------------------------------------

COMMITMENT = re.compile(
    r"\b(i'll|i will|we'll|we will|i need to|we need to|going to|action item)\b", re.IGNORECASE
)
FIRST_PERSON = re.compile(r"\b(i'll|i will|i need to)\b", re.IGNORECASE)
SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


@dataclass
class Sentence:
    text: str
    speaker: str
    keywords: list[str]
    score: float = 0


def score(sentence: Sentence, weight: Counter) -> float:
    """Sentences full of the meeting's most repeated words score highest."""
    length = len(words(sentence.text))
    if not 8 <= length <= 40:
        return 0
    return sum(weight[word] for word in set(sentence.keywords)) / length**0.5


def best(sentences: list[Sentence], count: int) -> list[Sentence]:
    """The highest scoring sentences, in the order they were said."""
    chosen = {id(s) for s in nlargest(count, sentences, key=lambda s: s.score) if s.score > 0}
    return [s for s in sentences if id(s) in chosen]


def top_words(sentences: list[Sentence], count: int) -> list[str]:
    counts = Counter(word for s in sentences for word in s.keywords)
    return [word for word, _ in counts.most_common(count)]


def notes_from_rules(segments: list[ParsedSegment]) -> Notes:
    names = frozenset(part for s in segments for part in words(s.speaker))  # not worth a topic
    per_segment = [
        [Sentence(text, s.speaker, keywords(text, names)) for text in SENTENCE_END.split(s.text)]
        for s in segments
    ]
    sentences = [sentence for group in per_segment for sentence in group]
    weight = Counter(word for s in sentences for word in s.keywords)
    for sentence in sentences:
        sentence.score = score(sentence, weight)

    topics = top_words(sentences, 4)
    overview = f"The meeting covered {', '.join(topics)}." if topics else ""
    overview = " ".join([overview, *(s.text for s in best(sentences, 2))]).strip()

    turns_per_chapter = max(8, -(-len(segments) // 4))  # at most four chapters
    chapters = []
    for start in range(0, len(segments), turns_per_chapter):
        group = [s for turn in per_segment[start : start + turns_per_chapter] for s in turn]
        chapters.append(
            ChapterNotes(
                title=", ".join(word.capitalize() for word in top_words(group, 3)) or "Discussion",
                start_seconds=segments[start].start_ms // 1000,
                bullets=[f"{s.speaker}: {s.text[:160]}" for s in best(group, 2)],
            )
        )

    action_items = [
        ActionItemNotes(
            text=s.text[:300], assignee=s.speaker if FIRST_PERSON.search(s.text) else None
        )
        for s in sentences
        if COMMITMENT.search(s.text) and len(words(s.text)) >= 5
    ]
    return Notes(
        overview=overview or segments[0].text, chapters=chapters, action_items=action_items[:6]
    )
