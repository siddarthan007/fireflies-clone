# Database schema

SQLite, eight tables including the tag join table, defined in `backend/app/models.py`. `meetings` is the root. Participants, transcript segments, comments, chapters, action items, and tag links are deleted with the meeting. Shared tag rows remain available to other meetings.

```
meetings 1---* participants           who was in the meeting
meetings 1---* transcript_segments    one row per spoken turn
transcript_segments 1---* comments    notes left on a line
meetings 1---* chapters               the outline
meetings 1---* action_items           tasks, editable by the user
meetings *---* tags                   through meeting_tags
```

## Tables

### meetings

| Column             | Type           | Notes                                                                               |
| ------------------ | -------------- | ----------------------------------------------------------------------------------- |
| `id`               | integer PK     |                                                                                     |
| `title`            | varchar(200)   |                                                                                     |
| `meeting_at`       | datetime       | Indexed. Stored as UTC and returned with a `Z`. Used to sort and to filter by date. |
| `duration_seconds` | integer        | Taken from the last transcript line when the meeting is created.                    |
| `overview`         | text, nullable | The summary paragraph.                                                              |

### participants

| Column       | Type                | Notes                         |
| ------------ | ------------------- | ----------------------------- |
| `id`         | integer PK          |                               |
| `meeting_id` | FK to `meetings.id` | Indexed, `ON DELETE CASCADE`. |
| `name`       | varchar(120)        |                               |

A participant is a name, not an account. The same person in two meetings is two rows. The Filters popover lists people with `SELECT DISTINCT name`.

### transcript_segments

| Column               | Type                | Notes                                               |
| -------------------- | ------------------- | --------------------------------------------------- |
| `id`                 | integer PK          |                                                     |
| `meeting_id`         | FK to `meetings.id` | Indexed, `ON DELETE CASCADE`.                       |
| `speaker`            | varchar(120)        | The label shown on the line.                        |
| `start_ms`, `end_ms` | integer             | Milliseconds from the start of the meeting.         |
| `text`               | text                |                                                     |
| `highlighted`        | boolean             | Defaults to false. Set when someone stars the line. |

### comments

| Column       | Type                           | Notes                         |
| ------------ | ------------------------------ | ----------------------------- |
| `id`         | integer PK                     |                               |
| `segment_id` | FK to `transcript_segments.id` | Indexed, `ON DELETE CASCADE`. |
| `text`       | varchar(500)                   |                               |
| `created_at` | datetime                       | UTC.                          |

There is one user, so a comment has no author column.

### chapters

| Column       | Type                 | Notes                                                                   |
| ------------ | -------------------- | ----------------------------------------------------------------------- |
| `id`         | integer PK           |                                                                         |
| `meeting_id` | FK to `meetings.id`  | Indexed, `ON DELETE CASCADE`.                                           |
| `title`      | varchar(200)         |                                                                         |
| `start_ms`   | integer              | Clicking the chapter seeks the player here. Chapters are ordered by it. |
| `bullets`    | JSON list of strings | Shown with the chapter.                                                 |

### action_items

| Column       | Type                   | Notes                                      |
| ------------ | ---------------------- | ------------------------------------------ |
| `id`         | integer PK             |                                            |
| `meeting_id` | FK to `meetings.id`    | Indexed, `ON DELETE CASCADE`.              |
| `text`       | varchar(500)           |                                            |
| `assignee`   | varchar(120), nullable | A name, not an account.                    |
| `due_date`   | date, nullable         | A calendar date, so there is no time zone. |
| `done`       | boolean                | Defaults to false.                         |

### tags and meeting_tags

| Column                    | Type                | Notes                                                         |
| ------------------------- | ------------------- | ------------------------------------------------------------- |
| `tags.id`                 | integer PK          |                                                               |
| `tags.name`               | varchar(60), unique | Shared between meetings. A new name is matched ignoring case. |
| `meeting_tags.meeting_id` | FK, part of the PK  | `ON DELETE CASCADE`.                                          |
| `meeting_tags.tag_id`     | FK, part of the PK  | `ON DELETE CASCADE`.                                          |

## Why it looks like this

- **A table for each thing the UI shows or edits on its own.** Anything only read next to its meeting became a column.
- **`overview` is a column.** There is one summary per meeting and it is always read with the meeting.
- **No speakers table.** A speaker is a label on a line. Renaming speakers is not a feature, so a join would cost something and give nothing.
- **`highlighted` is a flag, `comments` is a table.** A line is either starred or not. A line can have any number of comments.
- **`bullets` is JSON.** A chapter's bullets are never queried or edited one by one.
- **Milliseconds as integers.** The player, chapters and transcript share one unit, with no float rounding.
- **Cascades twice.** SQLAlchemy relationships use `cascade="all, delete-orphan"`, and the foreign keys use `ON DELETE CASCADE`. SQLite ignores foreign keys unless asked, so `database.py` runs `PRAGMA foreign_keys=ON` on every connection.
- **UTC in the database.** `UTCDateTime` in `database.py` stores a naive UTC value and returns an aware one. SQLite has no time zone type, and without this a value could come back without a zone and be shifted by the browser.
- **Indexes.** `meetings.meeting_at` for sorting and date filters, and the foreign key on each child table for the per-meeting reads.

## Loading and querying

- `Meeting.participants`, `Meeting.tags` and `TranscriptSegment.comments` use `lazy="selectin"`. A page of 20 meetings takes a handful of queries instead of 41, and a transcript with its comments takes two.
- Title and transcript search use a case-insensitive `icontains` with `autoescape=True`, so `%` and `_` in a search are plain characters.
- Startup seeds only a newly created database (`app/main.py` and `app/seed.py`). Restarting preserves an intentionally empty library as well as edits. The explicit seed command can refill an empty disposable database.
