"""Turn a transcript (.txt, .vtt or .json) into timed speaker segments.

The accepted formats are described in docs/transcript-formats.md.
Real speech-to-text is out of scope, so this is how a meeting gets its transcript.
"""

import json
import math
import re
from dataclasses import dataclass, field

LAST_SEGMENT_MS = 3000  # a segment with no successor is assumed to last this long


class TranscriptError(ValueError):
    """The transcript could not be read. The message says what is wrong and where."""


@dataclass
class ParsedSegment:
    speaker: str
    start_ms: int
    end_ms: int
    text: str


@dataclass
class ParsedTranscript:
    segments: list[ParsedSegment]
    title: str | None = None
    participants: list[str] = field(default_factory=list)

    @property
    def speakers(self) -> list[str]:
        """Distinct speaker names in the order they first talk."""
        return list(dict.fromkeys(s.speaker for s in self.segments))

    @property
    def duration_seconds(self) -> int:
        return (max(s.end_ms for s in self.segments) + 999) // 1000


def parse_transcript(fmt: str, text: str) -> ParsedTranscript:
    parsers = {"txt": parse_txt, "vtt": parse_vtt, "json": parse_json}
    if fmt not in parsers:
        raise TranscriptError(f"unsupported format '{fmt}', use txt, vtt or json")
    parsed = parsers[fmt](text.removeprefix("﻿"))  # Windows editors add a byte order mark
    parsed.segments.sort(key=lambda s: s.start_ms)  # ids then follow time order
    if parsed.title and len(parsed.title) > 200:
        raise TranscriptError("the title must be at most 200 characters")
    for name in [*parsed.participants, *parsed.speakers]:
        if len(name) > 120:
            raise TranscriptError("participant and speaker names must be at most 120 characters")
    return parsed


# --- shared helpers ---------------------------------------------------------


def clock_to_ms(clock: str) -> int:
    """'01:05' or '1:02:03' to milliseconds."""
    try:
        parts = [int(part) for part in clock.split(":")]
    except ValueError as error:
        raise TranscriptError(f"invalid timestamp: {clock!r}") from error
    if len(parts) not in (2, 3) or any(p < 0 for p in parts) or any(p > 59 for p in parts[1:]):
        raise TranscriptError(f"invalid timestamp: {clock!r}")
    seconds = 0
    for part in parts:
        seconds = seconds * 60 + part
    return seconds * 1000


def fill_end_times(segments: list[ParsedSegment]) -> None:
    """A segment ends where the next one starts."""
    for current, following in zip(segments, segments[1:], strict=False):
        current.end_ms = (
            following.start_ms
            if following.start_ms > current.start_ms
            else (current.start_ms + 1000)
        )
    segments[-1].end_ms = segments[-1].start_ms + LAST_SEGMENT_MS


# --- .txt -------------------------------------------------------------------

# "Riya  00:12" on one line, the spoken text on the lines below
HEADER_LINE = re.compile(r"^(?P<speaker>.+?)\s{2,}(?P<time>\d{1,2}:\d{2}(?::\d{2})?)$")
# "[00:12] Riya: Sounds good."
INLINE_LINE = re.compile(
    r"^\[?(?P<time>\d{1,2}:\d{2}(?::\d{2})?)\]?\s+(?P<speaker>[^:]+):\s+(?P<text>.+)$"
)


def parse_txt(text: str) -> ParsedTranscript:
    segments: list[ParsedSegment] = []
    line_numbers: list[int] = []
    for number, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        if match := INLINE_LINE.match(line):
            segments.append(
                ParsedSegment(
                    match["speaker"].strip(), clock_to_ms(match["time"]), 0, match["text"].strip()
                )
            )
            line_numbers.append(number)
        elif match := HEADER_LINE.match(line):
            segments.append(
                ParsedSegment(match["speaker"].strip(), clock_to_ms(match["time"]), 0, "")
            )
            line_numbers.append(number)
        elif segments:
            segments[-1].text = f"{segments[-1].text} {line}".strip()
        else:
            raise TranscriptError(
                f"line {number}: expected a speaker and timestamp first, like 'Riya  00:12'"
            )

    if not segments:
        raise TranscriptError("no transcript lines found")
    for segment, number in zip(segments, line_numbers, strict=True):
        if not segment.text:
            raise TranscriptError(f"line {number}: no text after the timestamp")
    segments.sort(key=lambda s: s.start_ms)
    fill_end_times(segments)
    return ParsedTranscript(segments)


# --- .vtt -------------------------------------------------------------------

CUE_TIMING = re.compile(r"(?P<start>[\d:.,]+)\s*-->\s*(?P<end>[\d:.,]+)")
VOICE_TAG = re.compile(r"<v\s+([^>]+)>")
SPEAKER_PREFIX = re.compile(r"^([^:]{1,40}):\s+(.+)$")
SAME_SPEAKER_GAP_MS = 500  # cues this close together from one speaker become one segment


def vtt_time_to_ms(stamp: str) -> int:
    """'00:00:04.500' (or '00:04,500') to milliseconds."""
    whole, _, fraction = stamp.replace(",", ".").partition(".")
    return clock_to_ms(whole) + int((fraction + "00")[:3])


def parse_vtt(text: str) -> ParsedTranscript:
    if not text.lstrip().startswith("WEBVTT"):
        raise TranscriptError("line 1: a .vtt file must start with WEBVTT")

    cues: list[ParsedSegment] = []
    for block in re.split(r"\n\s*\n", text.replace("\r\n", "\n").strip()):
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        timing_at = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if timing_at is None:
            continue  # the WEBVTT header or a NOTE block
        timing = CUE_TIMING.match(lines[timing_at])
        if timing is None:
            raise TranscriptError(f"invalid cue timing: {lines[timing_at]!r}")

        speaker, body = "Unknown", " ".join(lines[timing_at + 1 :])
        if voice := VOICE_TAG.search(body):
            speaker = voice.group(1).strip()
        elif prefix := SPEAKER_PREFIX.match(body):
            speaker, body = prefix.group(1).strip(), prefix.group(2)
        body = re.sub(r"<[^>]+>", "", body).strip()  # drop <v ...> and </v>
        if not body:
            raise TranscriptError(f"cue at {timing['start']} has no text")

        start_ms, end_ms = vtt_time_to_ms(timing["start"]), vtt_time_to_ms(timing["end"])
        if end_ms <= start_ms:
            raise TranscriptError(f"cue at {timing['start']} ends before it starts")
        cues.append(ParsedSegment(speaker, start_ms, end_ms, body))

    if not cues:
        raise TranscriptError("no cues found")

    cues.sort(key=lambda s: s.start_ms)
    segments = [cues[0]]
    for cue in cues[1:]:
        last = segments[-1]
        if cue.speaker == last.speaker and cue.start_ms - last.end_ms < SAME_SPEAKER_GAP_MS:
            last.end_ms = max(last.end_ms, cue.end_ms)
            last.text = f"{last.text} {cue.text}"
        else:
            segments.append(cue)
    return ParsedTranscript(segments)


# --- .json ------------------------------------------------------------------


def seconds_or_ms(row: dict, ms_key: str, seconds_key: str, number: int) -> int:
    key = ms_key if ms_key in row else seconds_key
    value = row.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TranscriptError(f"sentence {number}: needs numeric '{ms_key}' or '{seconds_key}'")
    if value < 0 or value > 2**63 - 1 or not math.isfinite(value):
        raise TranscriptError(f"sentence {number}: timestamps must be finite and non-negative")
    milliseconds = value if key == ms_key else value * 1000
    if not math.isfinite(milliseconds) or milliseconds > 2**63 - 1:
        raise TranscriptError(f"sentence {number}: timestamp is too large")
    return round(milliseconds)


def parse_json(text: str) -> ParsedTranscript:
    try:
        data = json.loads(text)
    except json.JSONDecodeError as error:
        raise TranscriptError(f"invalid JSON at line {error.lineno}: {error.msg}") from error

    rows = data.get("sentences") if isinstance(data, dict) else data
    if not isinstance(rows, list) or not rows:
        raise TranscriptError("expected a non-empty 'sentences' list")

    segments: list[ParsedSegment] = []
    for number, row in enumerate(rows, start=1):
        if (
            not isinstance(row, dict)
            or not isinstance(row.get("text"), str)
            or not row["text"].strip()
        ):
            raise TranscriptError(f"sentence {number}: needs a 'text' string")
        start_ms = seconds_or_ms(row, "start_ms", "start_time", number)
        end_ms = seconds_or_ms(row, "end_ms", "end_time", number)
        if end_ms <= start_ms:
            raise TranscriptError(f"sentence {number}: ends before it starts")
        speaker = row.get("speaker_name") or row.get("speaker") or "Unknown"
        if not isinstance(speaker, str):
            raise TranscriptError(f"sentence {number}: speaker must be a string")
        segments.append(
            ParsedSegment(speaker.strip() or "Unknown", start_ms, end_ms, row["text"].strip())
        )

    title = data.get("title") if isinstance(data, dict) else None
    if title is not None and not isinstance(title, str):
        raise TranscriptError("title must be a string")
    named = data.get("participants", []) if isinstance(data, dict) else []
    if not isinstance(named, list):
        raise TranscriptError("participants must be a list of names")
    names = [p.get("name") if isinstance(p, dict) else p for p in named]
    if any(not isinstance(name, str) for name in names):
        raise TranscriptError("participants must contain names as strings")
    participants = [name.strip() for name in names if name.strip()]
    return ParsedTranscript(
        segments, title=title.strip() if title else None, participants=participants
    )
