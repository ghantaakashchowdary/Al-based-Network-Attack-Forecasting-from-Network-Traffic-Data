from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT_FILE = ROOT / "data" / "security_events.jsonl"
_lock = threading.Lock()


def _read_events(limit: int = 50) -> list[dict]:
    if not AUDIT_FILE.exists():
        return []
    lines = AUDIT_FILE.read_text(encoding="utf-8").splitlines()
    events = []
    for line in lines[-limit:]:
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return list(reversed(events))


def record_event(payload: dict) -> dict:
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    event = {
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **payload,
    }
    with _lock:
        with AUDIT_FILE.open("a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
    return event


def list_events(limit: int = 50) -> list[dict]:
    return _read_events(max(1, min(limit, 200)))
