"""Small text helpers shared by the notes generator, AskFred and the export."""

import re

STOP_WORDS = frozenset(
    """a about after all also an and any are as at be because been but by can could did do does
    for from get got had has have he her him his how i if in into is it its just like me my no not
    of off ok okay on one or our out over right she so some than that the their them then there
    these they this to too up us very was we were what when where which who why will with would
    yeah you your""".split()
)


def words(text: str) -> list[str]:
    return re.findall(r"[a-z']+", text.lower())


def keywords(text: str, ignore: frozenset[str] = frozenset()) -> list[str]:
    """The words worth matching on: not too short, not filler, not a contraction."""
    return [
        word
        for word in words(text)
        if len(word) > 3 and "'" not in word and word not in STOP_WORDS and word not in ignore
    ]


def clock(ms: int) -> str:
    """Milliseconds as 'm:ss', or 'h:mm:ss' for long meetings."""
    minutes, seconds = divmod(ms // 1000, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours}:{minutes:02d}:{seconds:02d}" if hours else f"{minutes}:{seconds:02d}"
