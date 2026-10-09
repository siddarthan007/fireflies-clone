"""The three transcript formats and the errors they raise."""

import json

import pytest

from app.services.transcript_parser import TranscriptError, parse_transcript


@pytest.mark.parametrize("start", [-1, float("nan"), float("inf"), True, 10**400])
def test_invalid_json_timestamps_are_rejected(start):
    content = json.dumps([{"speaker": "Asha", "start_time": start, "end_time": 2, "text": "Hi"}])
    with pytest.raises(TranscriptError):
        parse_transcript("json", content)


@pytest.mark.parametrize("participants", [None, "Asha", [None], [42]])
def test_invalid_json_participants_are_rejected(participants):
    content = json.dumps(
        {
            "participants": participants,
            "sentences": [{"speaker": "Asha", "start_ms": 0, "end_ms": 250, "text": "Hi"}],
        }
    )
    with pytest.raises(TranscriptError):
        parse_transcript("json", content)


def test_fractional_duration_keeps_the_last_line_inside_the_player():
    parsed = parse_transcript(
        "json", '[{"speaker":"Asha","start_ms":1000,"end_ms":1250,"text":"Hi"}]'
    )
    assert parsed.duration_seconds == 2


def test_out_of_order_txt_lines_get_correct_end_times():
    parsed = parse_transcript("txt", "[00:20] Asha: Later.\n[00:00] Ben: First.")
    assert [(s.start_ms, s.end_ms) for s in parsed.segments] == [(0, 20_000), (20_000, 23_000)]


def test_bad_vtt_timestamps_raise_a_transcript_error():
    with pytest.raises(TranscriptError):
        parse_transcript("vtt", "WEBVTT\n\n00::01.000 --> 00:00:02.000\nAsha: Hi")


class TestTxt:
    def test_speaker_header_style(self):
        parsed = parse_transcript(
            "txt", "Riya  00:04\nLet us start.\nWith the demo.\n\nTom  00:12\nSounds good.\n"
        )
        assert parsed.speakers == ["Riya", "Tom"]
        first, second = parsed.segments
        assert (first.start_ms, first.end_ms) == (4000, 12000)  # ends where the next begins
        assert first.text == "Let us start. With the demo."
        assert second.end_ms == 15000  # the last one gets a default length

    def test_inline_style_and_hours(self):
        parsed = parse_transcript("txt", "[00:04] Riya: Hello.\n[1:02:03] Tom: Late reply.\n")
        assert [s.speaker for s in parsed.segments] == ["Riya", "Tom"]
        assert parsed.segments[1].start_ms == 3_723_000

    def test_text_before_any_speaker(self):
        with pytest.raises(TranscriptError, match="line 1"):
            parse_transcript("txt", "just some words")

    def test_speaker_without_text(self):
        with pytest.raises(TranscriptError, match="line 1: no text"):
            parse_transcript("txt", "Riya  00:04\n")

    def test_empty(self):
        with pytest.raises(TranscriptError):
            parse_transcript("txt", "   \n")


class TestVtt:
    def test_voice_tags_prefixes_and_merging(self):
        parsed = parse_transcript(
            "vtt",
            "WEBVTT\n\n"
            "00:00:04.000 --> 00:00:09.300\n<v Riya>Let us start.</v>\n\n"
            "00:00:09.500 --> 00:00:12.000\n<v Riya>Quick follow up.</v>\n\n"
            "00:00:14.000 --> 00:00:18.000\nTom: Sounds good.\n",
        )
        assert len(parsed.segments) == 2  # the first two cues merge: same speaker, 200 ms gap
        assert parsed.segments[0].text == "Let us start. Quick follow up."
        assert parsed.segments[0].end_ms == 12000
        assert parsed.segments[1].speaker == "Tom"

    def test_missing_speaker_is_unknown(self):
        parsed = parse_transcript("vtt", "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nhello\n")
        assert parsed.segments[0].speaker == "Unknown"

    def test_needs_the_header(self):
        with pytest.raises(TranscriptError, match="WEBVTT"):
            parse_transcript("vtt", "00:00:01.000 --> 00:00:03.000\nhello\n")


class TestJson:
    def test_seconds_and_milliseconds(self):
        parsed = parse_transcript(
            "json",
            '{"title": "Demo", "participants": ["Sid", {"name": "Riya"}], "sentences": ['
            '{"speaker_name": "Sid", "start_time": 4.0, "end_time": 9.3, "text": "hi"},'
            '{"speaker": "Riya", "start_ms": 12000, "end_ms": 15000, "text": "yo"}]}',
        )
        assert parsed.title == "Demo"
        assert parsed.participants == ["Sid", "Riya"]
        assert [(s.start_ms, s.end_ms) for s in parsed.segments] == [(4000, 9300), (12000, 15000)]

    def test_segments_are_sorted_by_time(self):
        parsed = parse_transcript(
            "json",
            '[{"speaker": "B", "start_ms": 5000, "end_ms": 6000, "text": "second"},'
            '{"speaker": "A", "start_ms": 1000, "end_ms": 2000, "text": "first"}]',
        )
        assert [s.text for s in parsed.segments] == ["first", "second"]

    @pytest.mark.parametrize(
        "content",
        [
            "{not json",
            '{"title": "no sentences"}',
            '{"sentences": [{"start_ms": 0, "end_ms": 5, "text": ""}]}',
            '{"sentences": [{"start_ms": 9, "end_ms": 5, "text": "backwards"}]}',
            '{"sentences": [{"text": "no times"}]}',
        ],
    )
    def test_bad_input(self, content):
        with pytest.raises(TranscriptError):
            parse_transcript("json", content)


def test_unknown_format():
    with pytest.raises(TranscriptError, match="unsupported"):
        parse_transcript("docx", "x")


@pytest.mark.parametrize(
    ("fmt", "content"),
    [
        ("txt", "﻿Riya  00:04\nHello."),
        ("vtt", "﻿WEBVTT\n\n00:00:04.000 --> 00:00:06.000\n<v Riya>Hello.</v>"),
        (
            "json",
            '﻿{"sentences": [{"speaker": "Riya", "start_ms": 4, "end_ms": 6, "text": "Hi"}]}',
        ),
    ],
)
def test_byte_order_mark_is_ignored(fmt, content):
    assert parse_transcript(fmt, content).speakers == ["Riya"]
