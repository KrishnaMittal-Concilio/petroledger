"""PetroLedger — Reconciliation Narration Service.

Generates a plain-English summary of a completed shift reconciliation
using Groq's LLaMA 3.1 8B model.  Reads GROQ_API_KEY from app settings.

Returns None gracefully when the key is missing or the Groq call fails,
so callers never need to guard against exceptions.
"""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULT_MODEL = "llama-3.1-8b-instant"

_SYSTEM_PROMPT = """\
You are PetroLedger's AI analyst. Given JSON data about a petrol-pump
shift reconciliation, write a concise 2-4 sentence summary in plain
English. Mention the risk level, key anomalies (if any), likely cause,
and recommended action. Be specific about monetary amounts and percentages.
Use Indian Rupee (₹) formatting.\
"""


class NarrationService:
    """Generates natural-language summaries of shift reconciliation results."""

    def __init__(self, api_key: str, model: str | None = None) -> None:
        self._api_key = api_key or ""
        self.model = model or _DEFAULT_MODEL

    @property
    def is_available(self) -> bool:
        return bool(self._api_key)

    def narrate(self, context: dict[str, Any]) -> str | None:
        """Return a plain-English narration for *context*, or None on failure."""
        if not self.is_available:
            logger.debug("GROQ_API_KEY not set — skipping narration.")
            return None

        try:
            from groq import Groq

            client = Groq(api_key=self._api_key)
            completion = client.chat.completions.create(
                model=self.model,
                max_tokens=300,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            "Here is the shift reconciliation data:\n\n"
                            f"```json\n{json.dumps(context, indent=2, default=str)}\n```\n\n"
                            "Write a plain-English summary."
                        ),
                    },
                ],
            )
            text = completion.choices[0].message.content
            logger.info("Narration generated for shift=%s (%d chars)", context.get("shift_id"), len(text))
            return text

        except Exception as exc:
            logger.error("Narration failed for shift=%s: %s", context.get("shift_id"), exc)
            return None
