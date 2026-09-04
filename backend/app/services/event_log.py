"""Live Event Timeline (section 22) - simple in-memory ring buffer."""
from __future__ import annotations

from collections import deque
from datetime import datetime, timezone

MAX_EVENTS = 400


class EventLog:
    def __init__(self):
        self._events: deque[dict] = deque(maxlen=MAX_EVENTS)
        self._seq = 0

    def add(self, message: str, category: str = "SYSTEM") -> dict:
        self._seq += 1
        event = {
            "id": self._seq,
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "message": message,
            "category": category,
        }
        self._events.append(event)
        return event

    def recent(self, limit: int = 100) -> list[dict]:
        return list(self._events)[-limit:][::-1]


event_log = EventLog()
