from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from lab01.paths import TRACES_FILE


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def append_trace(tool: str, cls: str, target: str, result: str) -> dict[str, str]:
    started = now_iso()
    completed = now_iso()
    row = {
        "tool": tool,
        "class": cls,
        "startedAt": started,
        "completedAt": completed,
        "target": target,
        "result": result,
    }
    TRACES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with TRACES_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row) + "\n")
    return row


def read_traces() -> list[dict[str, Any]]:
    if not TRACES_FILE.exists():
        return []
    out = []
    for line in TRACES_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            out.append(json.loads(line))
    return out


def reset_traces() -> None:
    TRACES_FILE.parent.mkdir(parents=True, exist_ok=True)
    TRACES_FILE.write_text("", encoding="utf-8")
