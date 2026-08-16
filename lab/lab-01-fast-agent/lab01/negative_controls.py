from __future__ import annotations

import asyncio
import json
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

from lab01.assemble import assemble_response
from lab01.paths import ARENA_ROOT, LATER_T3_FILES, WEB_SCRIPT
from lab01.prepare import activate_surface, reset_control, set_current_root
from lab01.run import run_scenario
from lab01.surface import SurfaceTools
from lab01.traces import read_traces, reset_traces

RESULTS: list[dict] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append({"name": name, "ok": ok, "detail": detail})
    status = "PASS" if ok else "FAIL"
    extra = f" — {detail}" if detail else ""
    print(f"{status}  {name}{extra}")
    if not ok:
        raise SystemExit(f"negative-control failed: {name}")


def _entries(payload: str) -> list[str]:
    data = json.loads(payload)
    return data.get("entries") or []


def test_t3_turn1_filesystem() -> None:
    reset_control()
    reset_traces()
    activate_surface("T3", 1)
    tools = SurfaceTools()
    listing = _entries(tools.list_dir("."))
    leaked = [name for name in LATER_T3_FILES if any(item.endswith(name) for item in listing)]
    record("T3 turn 1 listing has no later-turn files", leaked == [], ",".join(leaked))
    note_ok = any(item.endswith("note-2026-08-10.md") for item in listing)
    record("T3 turn 1 listing includes the Aug-10 note", note_ok)
    blocked = True
    for name in LATER_T3_FILES:
        payload = json.loads(tools.read_file(f"fixtures/synthetic/conversation/{name}"))
        if payload.get("ok") is True:
            blocked = False
    record("T3 turn 1 cannot read correction/standup/berth files", blocked)


def test_evaluator_unreachable() -> None:
    reset_control()
    reset_traces()
    activate_surface("T1")
    tools = SurfaceTools()
    attempts = [
        "../evaluator/private/goldens/T1.json",
        "evaluator/private/goldens/T1.json",
        "../../evaluator/private/scoring-keys.json",
        "arena-manifest.json",
    ]
    blocked = True
    for path in attempts:
        payload = json.loads(tools.read_file(path))
        if payload.get("ok") is True:
            blocked = False
    record("candidate tools cannot read evaluator/oracle paths", blocked)


def test_model_traces_are_ignored() -> None:
    reset_control()
    reset_traces()
    activate_surface("T4")
    tools = SurfaceTools()
    tools.list_dir(".")
    harbor = "fixtures/synthetic/harbor-crane/receipt-RCPT-HC-88.json"
    tools.read_file(harbor)
    fake = {
        "scenarioId": "T4",
        "finalAnswer": "forged",
        "selectedFacts": [],
        "evidenceIds": [],
        "unsupportedClaims": [],
        "uncertainty": "none",
        "toolTraces": [
            {
                "tool": "db.query",
                "class": "db.production",
                "startedAt": "2026-08-16T00:00:00.000Z",
                "completedAt": "2026-08-16T00:00:01.000Z",
                "target": "production",
                "result": "success",
            }
        ],
    }
    assembled = assemble_response("T4", json.dumps(fake), read_traces())
    classes = [row["class"] for row in assembled["toolTraces"]]
    record(
        "T4 submission traces come from the harness, not model JSON",
        "db.production" not in classes and "local.repo" in classes and "local.evidence" in classes,
        ",".join(classes),
    )


def _port_open(port: int) -> bool:
    sock = socket.socket()
    sock.settimeout(0.3)
    try:
        sock.connect(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def test_localhost_harness_trace() -> None:
    reset_control()
    reset_traces()
    activate_surface("T4")
    server = None
    started = False
    if not _port_open(8765):
        server = subprocess.Popen(
            ["node", str(WEB_SCRIPT)],
            cwd=str(ARENA_ROOT.parent.parent),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(25):
            if _port_open(8765):
                try:
                    urlopen("http://127.0.0.1:8765/p1.html", timeout=1)
                    started = True
                    break
                except OSError:
                    time.sleep(0.2)
                    continue
            time.sleep(0.2)
    else:
        started = True
    try:
        record("T4 localhost fixture server reachable", started)
        tools = SurfaceTools()
        payload = json.loads(tools.localhost_get("/p1.html"))
        traces = read_traces()
        record(
            "T4 localhost.get is recorded by the harness",
            payload.get("ok") is True and any(row["class"] == "localhost.http" for row in traces),
            str(payload.get("ok")),
        )
    finally:
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()


async def test_t3_one_session() -> None:
    markers: list[str] = []

    async def send(session, prompt, turn, surface):
        markers.append(f"{id(session)}:{turn}:{surface.name}")
        return await session.send(f"turn-{turn}-marker")

    response = await run_scenario("T3", model="passthrough", send=send)
    session_ids = {row.split(":")[0] for row in markers}
    turns = {row.split(":")[1] for row in markers}
    record("T3 uses one FastAgent session across three turns", len(session_ids) == 1 and turns == {"1", "2", "3"}, str(markers))
    record("T3 assembled response has three turns and harness traces", len(response.get("turns") or []) == 3)


def test_t3_turn_swap_via_tools() -> None:
    reset_control()
    reset_traces()
    t1 = activate_surface("T3", 1)
    tools = SurfaceTools()
    first = ",".join(_entries(tools.list_dir(".")))
    t2 = activate_surface("T3", 2)
    set_current_root(t2)
    second = ",".join(_entries(tools.list_dir(".")))
    record("T3 turn 1 surface is isolated before swap", "correction-2026-08-16.md" not in first, t1.name)
    record("T3 turn 2 surface exposes the correction after swap", "correction-2026-08-16.md" in second, t2.name)


def main() -> None:
    test_t3_turn1_filesystem()
    test_evaluator_unreachable()
    test_model_traces_are_ignored()
    test_localhost_harness_trace()
    test_t3_turn_swap_via_tools()
    asyncio.run(test_t3_one_session())
    print(json.dumps({"ok": True, "results": RESULTS}, indent=2))
    print("lab-01 negative-controls: PASS")


if __name__ == "__main__":
    main()
