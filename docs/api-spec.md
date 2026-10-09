# API spec

Base path `/api/v1`. JSON in and out, except the two AskFred routes, which stream plain text. Interactive docs are at `/docs` when the backend is running. The shapes match `backend/app/schemas.py`.

Errors look like `{"detail": "..."}`. Validation errors from FastAPI return `422` with a `detail` list. A transcript that cannot be read returns `422` with a message that names the line.

| Status        | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| 200, 201, 204 | Success. `201` for creates, `204` for deletes (no body).       |
| 404           | Meeting, line, comment or action item not found.               |
| 413           | Uploaded file is larger than 2 MB.                             |
| 422           | Bad input: validation, unreadable transcript, wrong file type. |

## Meetings

### `GET /meetings`

The library. All parameters are optional.

| Parameter              | Meaning                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `q`                    | Title contains this text, ignoring case.                        |
| `participant`          | Repeat for several. A meeting matches if any of them took part. |
| `tag`                  | Repeat for several. A meeting matches if it has any of them.    |
| `date_from`, `date_to` | `YYYY-MM-DD`, both inclusive (UTC days).                        |
| `sort`                 | `newest` (default) or `oldest`.                                 |
| `skip`, `limit`        | Paging. `limit` is 1 to 100, default 20.                        |

```json
{
  "items": [
    {
      "id": 1,
      "title": "Sprint 14 planning",
      "meeting_at": "2026-10-08T05:00:00Z",
      "duration_seconds": 434,
      "participants": ["Siddartha Nepal", "Harshita Rao", "Aditya Verma"],
      "tags": ["engineering", "planning"]
    }
  ],
  "total": 8
}
```

`total` counts every match, not just this page, so the UI knows when to offer "Show more".

### `GET /meetings/filter-options`

What the Filters popover offers: the names and tags that exist.

```json
{
  "participants": ["Aditya Verma", "Harshita Rao", "Siddartha Nepal"],
  "tags": [{ "name": "planning", "meeting_count": 1 }]
}
```

### `POST /meetings`

Create a meeting from pasted text.

```json
{
  "title": "Launch checklist review",
  "meeting_at": "2026-10-09T12:43:00Z",
  "participants": ["Siddartha Nepal", "Harshita Rao"],
  "transcript": {
    "format": "txt",
    "content": "Siddartha Nepal  00:00\nLet us start."
  }
}
```

`title`, `meeting_at` and `participants` are optional. The defaults are the title inside the transcript (or "Untitled meeting"), the current time, and the speakers found in the transcript. The duration comes from the last line. Formats are described in [transcript-formats.md](transcript-formats.md).

The summary, outline and action items are generated while the meeting is created: by Gemini when `GOOGLE_API_KEY` is set, by simple rules otherwise. Returns `201` with a `MeetingDetail` (below).

### `POST /meetings/upload`

The same, from a file. `multipart/form-data` with `file` (`.txt`, `.vtt` or `.json`, UTF-8, up to 2 MB) and optional `title` and `meeting_at`. With no title, the title inside the file is used, then the file name. Participants are the speakers in the file.

### `GET /meetings/{id}`

```json
{
  "id": 3,
  "title": "Incident review: slow transcript uploads",
  "meeting_at": "2026-10-05T11:30:00Z",
  "duration_seconds": 374,
  "participants": [
    "Siddartha Nepal",
    "Aditya Verma",
    "Karthik Nair",
    "Meera Pillai"
  ],
  "tags": ["engineering", "incident"],
  "overview": "Review of Tuesday's incident, when transcript uploads waited up to 47 minutes ...",
  "chapters": [
    {
      "id": 9,
      "title": "What happened",
      "start_ms": 4000,
      "bullets": ["Support reported stuck uploads ..."]
    }
  ],
  "action_items": [
    {
      "id": 17,
      "meeting_id": 3,
      "text": "Add an alert when the oldest queued upload is older than five minutes",
      "assignee": "Meera Pillai",
      "due_date": "2026-10-11",
      "done": false
    }
  ]
}
```

### `PATCH /meetings/{id}`

Send only the fields to change. `title`, `meeting_at`, `participants` and `tags` cannot be `null`. `participants` and `tags` replace the whole list (names are trimmed and de-duplicated, ignoring case). Participant names are at most 120 characters; tag names are at most 60. `overview` accepts `null` to remove the summary.

```json
{ "title": "Incident 142 review", "tags": ["incident", "retro"] }
```

### `DELETE /meetings/{id}`

Removes the meeting with its transcript, comments, chapters, action items and tag links. `204`.

### `GET /meetings/{id}/export?format=markdown|txt`

The meeting (summary, outline, action items, transcript) as a download. `Content-Disposition` carries a file name made from the title.

## Transcript

### `GET /meetings/{id}/transcript`

The lines in time order, each with its highlight flag and comments.

```json
[
  {
    "id": 21,
    "speaker": "Karthik Nair",
    "start_ms": 148000,
    "end_ms": 163300,
    "text": "Most of the wrong answers are on questions where the student pastes a long code snippet.",
    "highlighted": true,
    "comments": [
      {
        "id": 1,
        "text": "Let's add this to the evaluation doc.",
        "created_at": "2026-10-09T08:12:00Z"
      }
    ]
  }
]
```

### `PATCH /segments/{id}`

Star or unstar a line: `{ "highlighted": true }`. Returns the line.

### `POST /segments/{id}/comments`

`{ "text": "Share this with sales" }`, 1 to 500 characters, trimmed. Returns `201` with the comment.

### `DELETE /comments/{id}`

`204`.

## Action items

### `GET /action-items`

Every action item across meetings, newest meeting first, for the Tasks page. Optional `assignee` (exact name, ignoring case) and `done` (`true` or `false`). Each item has the `ActionItem` fields plus `meeting_title`.

### `POST /meetings/{id}/action-items`

```json
{
  "text": "Send the recap",
  "assignee": "Harshita Rao",
  "due_date": "2026-10-12"
}
```

`assignee` and `due_date` are optional. Returns `201` with the item.

### `PATCH /action-items/{id}`

Send only the fields to change: `text`, `assignee`, `due_date`, `done`. `assignee` and `due_date` accept `null` to clear them. `text` and `done` cannot be `null`. Ticking the checkbox in the UI sends `{ "done": true }`.

### `DELETE /action-items/{id}`

`204`.

## Search

### `GET /search?q=`

`q` is required (1 to 100 characters) and is matched ignoring case. Returns up to 5 meetings whose title matches and up to 20 transcript lines that match, newest meetings first.

```json
{
  "meetings": [],
  "segments": [
    {
      "meeting_id": 1,
      "meeting_title": "Sprint 14 planning",
      "speaker": "Aditya Verma",
      "start_ms": 31000,
      "text": "..."
    }
  ]
}
```

## AskFred

Nothing is stored on the server. The browser sends the conversation so far with each question.

### `POST /meetings/{id}/ask` and `POST /ask`

The first asks about one meeting (notes and full transcript). The second asks about the ten most recent meetings (notes only).

```json
{
  "question": "What did we decide about the launch date?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

`question` is 1 to 1,000 characters. `history` is optional, up to 20 turns.

The response is `text/plain` and streams as the answer is written. Read it with `fetch` and `response.body`. The text is light Markdown: `-` bullets, `1.` lists and `**bold**`.

With `GOOGLE_API_KEY` set, the text comes from Gemini. Without a key, or if Gemini fails before the first word, the answer is built from the meeting data and streamed word by word. If Gemini fails part way, the answer ends with a note that it was cut short.

## System

- `GET /health` returns `{ "status": "ok" }`.
- `GET /me` returns `{ "name": "...", "email": "..." }`, the one signed-in user from configuration.
