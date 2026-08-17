from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

from lab01.paths import (
    ARENA_ROOT,
    BUNDLE_SCRIPT,
    CONTROL_DIR,
    CURRENT_ROOT_FILE,
    POLICY_FILE,
    SURFACES_DIR,
)
from lab01.traces import reset_traces


def _run_node(args: list[str]) -> None:
    subprocess.check_call(["node", *args], cwd=str(ARENA_ROOT.parent.parent))


def prepare_surface(scenario_id: str, turn: int | None = None) -> Path:
    label = f"{scenario_id}" if turn is None else f"{scenario_id}-t{turn}"
    out_dir = SURFACES_DIR / label
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    args = [str(BUNDLE_SCRIPT), "--scenario", scenario_id, "--out", str(out_dir)]
    if turn is not None:
        args.extend(["--turn", str(turn)])
    _run_node(args)
    return out_dir


def write_policy(surface: Path, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    envelope = json.loads((surface / "scenario.json").read_text(encoding="utf-8"))
    grant = envelope.get("writableGrant") or {}
    writable = []
    overlays: dict[str, str] = {}
    root = grant.get("root")
    for rel in grant.get("paths") or []:
        if root:
            writable.append(f"{root.rstrip('/')}/{rel}")
        else:
            writable.append(rel)
    if root:
        live = ARENA_ROOT / root
        overlays[root] = str(live)
    localhost = envelope.get("localhost")
    policy = {
        "writableRelPaths": writable,
        "localhost": localhost,
        "overlays": overlays,
    }
    if extra:
        policy.update(extra)
    CONTROL_DIR.mkdir(parents=True, exist_ok=True)
    POLICY_FILE.write_text(json.dumps(policy, indent=2) + "\n", encoding="utf-8")
    return policy


def set_current_root(surface: Path) -> None:
    CONTROL_DIR.mkdir(parents=True, exist_ok=True)
    CURRENT_ROOT_FILE.write_text(str(surface.resolve()) + "\n", encoding="utf-8")


def activate_surface(scenario_id: str, turn: int | None = None) -> Path:
    surface = prepare_surface(scenario_id, turn)
    write_policy(surface)
    set_current_root(surface)
    return surface


def reset_control() -> None:
    if CONTROL_DIR.exists():
        shutil.rmtree(CONTROL_DIR)
    CONTROL_DIR.mkdir(parents=True, exist_ok=True)
    reset_traces()
