"""The Gemini client. There is none when no API key is configured."""

from google import genai
from google.genai import types

from app.config import get_settings


def get_client() -> genai.Client | None:
    key = get_settings().google_api_key
    if not key:
        return None
    return genai.Client(
        api_key=key,
        http_options=types.HttpOptions(
            timeout=45_000, retry_options=types.HttpRetryOptions(attempts=1)
        ),
    )
