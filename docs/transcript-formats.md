# Transcript formats

A meeting is created from a transcript in one of three formats. The parser (`backend/app/services/transcript_parser.py`) turns each one into the same list of segments, and the rest of the app never sees the original format.

```python
ParsedSegment(speaker="Riya", start_ms=4000, end_ms=12000, text="Let us start.")
```

Rules for every format:

- A file may start with a byte order mark. It is ignored.
- A segment ends where the next one starts. The last segment ends 3 seconds after it starts, unless the format gives an end time.
- Segments are sorted by start time.
- The whole file is rejected if any part is unreadable, so nothing is half imported. The error says which line or entry is wrong and comes back as `422 {"detail": "line 3: no text after the timestamp"}`.
- The meeting duration is the end of the last segment.

## .txt

Two line styles are understood. Pick one per file.

**Header style**, which is also what the TXT export writes. A line with the speaker, two or more spaces, then the time. The lines under it are the text, until the next header.

```
Riya  00:04
Let us start with the demo.

Tom  00:12
Sounds good.
```

**Inline style**, with the time first.

```
[00:04] Riya: Let us start with the demo.
[00:12] Tom: Sounds good.
```

Times are `mm:ss` or `h:mm:ss`. Text before the first speaker line is an error.

## .vtt

Standard WebVTT. The file must start with `WEBVTT`. Each cue has a timing line.

```
WEBVTT

00:00:04.000 --> 00:00:09.300
<v Riya>Let us start with the demo.</v>

00:00:09.300 --> 00:00:12.000
Tom: Sounds good.
```

The speaker is read from a voice tag (`<v Riya>`), otherwise from a `Name:` prefix, otherwise it is `Unknown`. Comma milliseconds (`00:04,500`) are accepted. Cues from the same speaker less than half a second apart are merged into one segment, because captions often split a sentence over several cues.

## .json

```json
{
  "title": "Product demo with Acme",
  "participants": ["Riya", "Tom"],
  "sentences": [
    { "speaker_name": "Riya", "start_time": 4.0, "end_time": 9.3, "text": "Let us start with the demo." }
  ]
}
```

- `sentences` is required. A bare list of sentences is also accepted.
- Times are seconds (`start_time`, `end_time`) or milliseconds (`start_ms`, `end_ms`).
- The speaker comes from `speaker_name` or `speaker`, otherwise `Unknown`.
- `title` and `participants` are optional. Participants can be names or `{ "name": "..." }` objects. With none given, the speakers are used.

## Limits

Uploads are limited to 2 MB and must be UTF-8. Pasted text is limited to 2,000,000 characters.
