from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[1]
DEVICE_FILE = ROOT / "data" / "mobile_devices.json"
_lock = threading.Lock()


def _load() -> list[dict[str, Any]]:
    if not DEVICE_FILE.exists():
        return []
    try:
        data = json.loads(DEVICE_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def _save(devices: list[dict[str, Any]]) -> None:
    DEVICE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = DEVICE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(devices, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(DEVICE_FILE)


def register_device(device_id: Optional[str], name: str, model: str, os_version: str) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        devices = _load()
        existing = next((d for d in devices if d["device_id"] == device_id), None) if device_id else None
        if existing:
            existing.update({"name": name, "model": model, "os_version": os_version, "status": "ONLINE", "last_seen": now})
            result = existing
        else:
            result = {
                "device_id": device_id or str(uuid.uuid4()),
                "name": name,
                "model": model,
                "os_version": os_version,
                "status": "ONLINE",
                "registered_at": now,
                "last_seen": now,
            }
            devices.insert(0, result)
        _save(devices)
        return result


def heartbeat(device_id: str) -> Optional[dict[str, Any]]:
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        devices = _load()
        for d in devices:
            if d["device_id"] == device_id:
                d["status"] = "ONLINE"
                d["last_seen"] = now
                _save(devices)
                return d
    return None


def list_devices() -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    with _lock:
        devices = _load()
        changed = False
        for d in devices:
            try:
                last = datetime.fromisoformat(d["last_seen"].replace("Z", "+00:00"))
                if (now - last).total_seconds() > 90 and d.get("status") == "ONLINE":
                    d["status"] = "OFFLINE"
                    changed = True
            except Exception:
                pass
        if changed:
            _save(devices)
        return devices
