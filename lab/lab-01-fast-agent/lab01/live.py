from __future__ import annotations

import json
import os
import re
import socket
import subprocess
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

from lab01.paths import ARENA_ROOT, LAB01_ROOT, RUNTIME, SCORE_SCRIPT, TRACES_FILE, WEB_SCRIPT
from lab01.run import run_scenario
from lab01.traces import read_traces

FROZEN_MODEL = os.environ.get("FAST_AGENT_MODEL") or "haiku"
PROVIDER_BY_PREFIX = (
    (("haiku", "sonnet", "opus", "claude"), "anthropic"),
    (("gpt-", "o1", "o3", "o4"), "openai"),
    (("generic.",), "ollama"),
    (("gemini",), "google"),
)

INFRA_RE = re.compile(
    r"api[-_ ]key|authentication|unauthorized|401|403|429|rate limit|timeout|timed out|"
    r"connection (reset|refused|aborted)|temporarily unavailable|overloaded|econnreset|"
    r"not configured|missing key|no api",
    re.I,
)
SECRET_RE = re.compile(r"sk-[a-zA-Z0-9_\-]+|Bearer\s+\S+|api[_-]?key['\"]?\s*[:=]\s*['\"][^'\"]+", re.I)

CRED_NAMES = (
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "GEMINI_API_KEY",
    "OPENROUTER_API_KEY",
    "AZURE_OPENAI_API_KEY",
)
SCENARIO_TIMEOUT_SEC = 900
SCENARIOS = ("T1", "T2", "T3", "T4", "T5", "T6", "T7")
TITLES = {
    "T1": "Authority",
    "T2": "Evidence routing",
    "T3": "Memory correction",
    "T4": "Tool routing",
    "T5": "Research acquisition",
    "T6": "Bounded mutation",
    "T7": "Adversarial truth",
}


def redact(text: str) -> str:
    return SECRET_RE.sub("[redacted]", text)


def short_reason(text: str) -> str:
    compact = " ".join(redact(text).split())
    lowered = compact.lower()
    if "api key not configured" in lowered or "anthropic api key" in lowered:
        return "Anthropic API key not configured (retried once)"
    if compact.startswith("not run;"):
        return compact
    return compact[:240]


def credential_presence() -> dict[str, bool]:
    return {name: bool(os.environ.get(name)) for name in CRED_NAMES}


def provider_for(model: str) -> str:
    lowered = model.lower()
    for prefixes, name in PROVIDER_BY_PREFIX:
        if any(lowered.startswith(p) or lowered == p for p in prefixes):
            return name
    return "unknown"


def is_infra(error: BaseException | str) -> bool:
    return bool(INFRA_RE.search(str(error)))


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, default=str) + "\n", encoding="utf-8")


def port_open(port: int) -> bool:
    sock = socket.socket()
    sock.settimeout(0.3)
    try:
        sock.connect(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def start_web_server() -> subprocess.Popen | None:
    if port_open(8765):
        return None
    proc = subprocess.Popen(
        ["node", str(WEB_SCRIPT)],
        cwd=str(ARENA_ROOT.parent.parent),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(40):
        try:
            urlopen("http://127.0.0.1:8765/p1.html", timeout=1)
            return proc
        except OSError:
            time.sleep(0.25)
    return proc


def stop_web_server(proc: subprocess.Popen | None) -> None:
    if proc is None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def score_file(assembled_path: Path) -> dict:
    completed = subprocess.run(
        ["node", str(SCORE_SCRIPT), "--response", str(assembled_path)],
        cwd=str(ARENA_ROOT.parent.parent),
        capture_output=True,
        text=True,
    )
    raw = completed.stdout.strip() or completed.stderr.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "pass": False,
            "failures": [redact(raw or f"scorer exit {completed.returncode}")],
            "malformed": True,
        }


async def run_one(scenario_id: str, out_dir: Path, model: str) -> dict:
    raw_turns = []
    session_ids = []

    async def send(session, prompt, turn, surface):
        session_ids.append(id(session))
        reply = await session.send(prompt)
        raw_turns.append({"turn": turn, "raw": str(reply)})
        return reply

    assembled = await run_scenario(scenario_id, model=model, send=send)
    traces = read_traces()
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "raw.txt").write_text(
        "\n\n-----\n\n".join(item["raw"] for item in raw_turns) + "\n",
        encoding="utf-8",
    )
    write_json(out_dir / "raw-turns.json", raw_turns)
    write_json(out_dir / "assembled.json", assembled)
    write_json(out_dir / "traces.json", traces)
    write_json(
        out_dir / "session.json",
        {
            "scenarioId": scenario_id,
            "sessionIds": session_ids,
            "uniqueSessionCount": len(set(session_ids)),
            "use_history": True,
            "surfaceTurn": [item["turn"] for item in raw_turns],
        },
    )
    if TRACES_FILE.exists():
        (out_dir / "traces.jsonl").write_text(TRACES_FILE.read_text(encoding="utf-8"), encoding="utf-8")
    return assembled


def run_t6_pipeline(run_dir: Path, model: str) -> dict:
    helper = LAB01_ROOT / "scripts" / "score-t6-live.mjs"
    try:
        completed = subprocess.run(
            ["node", str(helper), str(run_dir), model],
            cwd=str(LAB01_ROOT),
            capture_output=True,
            text=True,
            timeout=SCENARIO_TIMEOUT_SEC,
        )
    except subprocess.TimeoutExpired as error:
        return {"pass": False, "failures": [f"t6 helper timeout after {SCENARIO_TIMEOUT_SEC}s"]}
    score_path = run_dir / "score.json"
    if score_path.exists():
        return json.loads(score_path.read_text(encoding="utf-8"))
    err = redact((completed.stdout or "") + "\n" + (completed.stderr or ""))
    return {"pass": False, "failures": [err.strip() or f"t6 helper exit {completed.returncode}"]}


def run_one_process(scenario_id: str, out_dir: Path, model: str) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        completed = subprocess.run(
            [
                "uv",
                "run",
                "python",
                "-m",
                "lab01.live_exec",
                "--scenario",
                scenario_id,
                "--out",
                str(out_dir),
                "--model",
                model,
            ],
            cwd=str(LAB01_ROOT),
            capture_output=True,
            text=True,
            shell=True,
            timeout=SCENARIO_TIMEOUT_SEC,
        )
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f"live_exec timeout after {SCENARIO_TIMEOUT_SEC}s") from error
    combined = redact((completed.stdout or "") + "\n" + (completed.stderr or ""))
    if completed.returncode != 0:
        raise RuntimeError(combined.strip() or f"live_exec exit {completed.returncode}")
    assembled_path = out_dir / "assembled.json"
    if not assembled_path.exists():
        raise RuntimeError(combined.strip() or "live_exec wrote no assembled.json")
    return json.loads(assembled_path.read_text(encoding="utf-8"))


def run_with_retry(scenario_id: str, out_dir: Path, model: str) -> dict:
    attempts = []
    last_error = None
    for attempt in (1, 2):
        try:
            assembled = run_one_process(scenario_id, out_dir, model)
            return {"assembled": assembled, "attempts": attempts, "infraRetry": attempt == 2}
        except Exception as error:
            last_error = error
            infra_flag = is_infra(error) or "api key" in str(error).lower() or "not configured" in str(error).lower()
            attempts.append({"attempt": attempt, "infra": infra_flag, "error": redact(str(error))})
            if attempt == 1 and infra_flag:
                continue
            break
    raise RuntimeError(json.dumps({"failed": True, "attempts": attempts, "error": redact(str(last_error))}))


def render_receipt(
    *,
    head_before: str,
    model: str,
    provider: str,
    fastagent_version: str,
    rows: list[dict],
    infra: list[dict],
    t3_session: dict,
    t4_traces: list,
    t6_delta,
) -> str:
    executed = [row for row in rows if not row.get("not_run")]
    passed = sum(1 for row in rows if row.get("pass") is True)
    score_note = ""
    if not executed:
        score_note = " (no scenario executed -- infrastructure; not a bakeoff scorecard)"
    lines = [
        "# LAB-01 FAST-AGENT LIVE RESULT",
        "",
        f"Head before run: {head_before}",
        "Head after receipt: PENDING_COMMIT",
        f"FastAgent version: {fastagent_version}",
        f"Model: {model}",
        f"Provider: {provider}",
        "",
        "",
    ]
    for row in rows:
        if row.get("not_run"):
            status = "NOT RUN (infrastructure)"
        elif row.get("pass") is True:
            status = "PASS"
        else:
            status = "FAIL"
        reasons = [short_reason(str(item)) for item in (row.get("failures") or [])]
        reason_text = "; ".join(reasons) if reasons else ""
        extra = f" -- {reason_text}" if reason_text else ""
        lines.append(f"{row['id']} {TITLES[row['id']]}: {status}{extra}")
    lines += [
        "",
        "",
        f"Deterministic score: {passed}/7{score_note}",
        "Semantic boss review: PENDING",
        "",
        "",
        (
            "T3 same-session evidence: "
            + (
                f"uniqueSessionCount={t3_session.get('uniqueSessionCount')} "
                f"sessionIds={t3_session.get('sessionIds')} use_history={t3_session.get('use_history')}"
                if t3_session
                else "UNAVAILABLE (T3 did not run)"
            )
        ),
        (
            "T4 harness trace evidence: "
            + (f"classes={[t.get('class') for t in t4_traces]}" if t4_traces else "UNAVAILABLE (T4 did not run)")
        ),
        f"T6 filesystem evidence: {json.dumps(t6_delta) if t6_delta is not None else 'UNAVAILABLE (T6 did not run)'}",
        "",
        "",
        "Infrastructure failures/retries:",
    ]
    if infra:
        for item in infra:
            lines.append(f"- {json.dumps(item)}")
    else:
        lines.append("- none")
    lines += [
        "",
        "Token/cost data: UNAVAILABLE (fast-agent 0.10.9 PromptMessageExtended has no usage/cost fields; not estimated)",
        "",
        "Remaining uncertainty:",
        "- One candidate, one frozen model. Not a ranking and not 'fast-agent wins.'",
        "- Goldens stayed evaluator-private; this receipt records scorer output only.",
        "- Provider credentials were never printed, copied, or committed.",
        "",
        "GPT/Codex will audit this result and later compare architectures against other candidates and the Granaide/Kilo control.",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    os.environ["FAST_AGENT_MODEL"] = FROZEN_MODEL
    import importlib.metadata

    fastagent_version = importlib.metadata.version("fast-agent-mcp")
    head_before = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=str(LAB01_ROOT.parent.parent), text=True).strip()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    live_root = RUNTIME / "live" / stamp
    live_root.mkdir(parents=True, exist_ok=True)
    presence = credential_presence()
    write_json(live_root / "preflight.json", {"model": FROZEN_MODEL, "credentialPresent": presence})
    (live_root / "FROZEN_MODEL.txt").write_text(FROZEN_MODEL + "\n", encoding="utf-8")
    provider = provider_for(FROZEN_MODEL)
    web = start_web_server()
    rows = []
    infra = [{"credentialPresent": presence, "fastagentSecretsYaml": (LAB01_ROOT / "fastagent.secrets.yaml").exists()}]
    t3_session = {}
    t4_traces = []
    t6_delta = None
    try:
        for scenario_id in SCENARIOS:
            out_dir = live_root / scenario_id
            print(f"live: starting {scenario_id} model={FROZEN_MODEL}", flush=True)
            try:
                if scenario_id == "T6":
                    score = None
                    last_t6_error = None
                    for attempt in (1, 2):
                        score = run_t6_pipeline(out_dir, FROZEN_MODEL)
                        assembled_path = out_dir / "assembled.json"
                        if assembled_path.exists() and score.get("t6Pipeline"):
                            break
                        last_t6_error = "; ".join(score.get("failures") or []) or "T6 pipeline produced no assembled.json"
                        infra_flag = is_infra(last_t6_error)
                        infra.append({"scenarioId": "T6", "attempt": attempt, "infra": infra_flag, "error": redact(last_t6_error)})
                        if attempt == 1 and infra_flag:
                            continue
                        raise RuntimeError(last_t6_error)
                    assembled_path = out_dir / "assembled.json"
                    assembled = json.loads(assembled_path.read_text(encoding="utf-8")) if assembled_path.exists() else {}
                    t6_delta = score.get("filesystemDelta") if score else None
                else:
                    result = run_with_retry(scenario_id, out_dir, FROZEN_MODEL)
                    assembled = result["assembled"]
                    if result.get("infraRetry"):
                        infra.append({"scenarioId": scenario_id, "retried": True})
                    write_json(out_dir / "assembled.json", assembled)
                    score = score_file(out_dir / "assembled.json")
                write_json(out_dir / "score.json", score)
                if scenario_id == "T3":
                    session_path = out_dir / "session.json"
                    if session_path.exists():
                        t3_session = json.loads(session_path.read_text(encoding="utf-8"))
                if scenario_id == "T4":
                    traces_path = out_dir / "traces.json"
                    if traces_path.exists():
                        t4_traces = json.loads(traces_path.read_text(encoding="utf-8"))
                rows.append(
                    {
                        "id": scenario_id,
                        "pass": score.get("pass") is True,
                        "failures": [redact(str(f)) for f in (score.get("failures") or [])],
                    }
                )
                print(f"live: {scenario_id} {'PASS' if score.get('pass') else 'FAIL'}", flush=True)
            except BaseException as error:
                if isinstance(error, KeyboardInterrupt):
                    raise
                tb = redact(traceback.format_exc())
                write_json(out_dir / "error.json", {"error": redact(str(error) or error.__class__.__name__), "traceback": tb})
                infra_flag = is_infra(error) or "not configured" in str(error).lower() or isinstance(error, SystemExit)
                infra.append({"scenarioId": scenario_id, "infra": infra_flag, "error": redact(str(error) or error.__class__.__name__)})
                rows.append({"id": scenario_id, "pass": False, "not_run": infra_flag, "failures": [redact(str(error) or "provider configuration error")]})
                print(f"live: {scenario_id} FAIL {redact(str(error) or error.__class__.__name__)}", flush=True)
                if infra_flag:
                    for rest in SCENARIOS[SCENARIOS.index(scenario_id) + 1 :]:
                        rows.append(
                            {
                                "id": rest,
                                "pass": False,
                                "not_run": True,
                                "failures": ["not run; prior infrastructure failure"],
                            }
                        )
                    break
    finally:
        stop_web_server(web)

    receipt = render_receipt(
        head_before=head_before,
        model=FROZEN_MODEL,
        provider=provider,
        fastagent_version=fastagent_version,
        rows=rows,
        infra=infra,
        t3_session=t3_session,
        t4_traces=t4_traces,
        t6_delta=t6_delta,
    )
    receipt_path = LAB01_ROOT / "receipts" / "LAB-01-LIVE-RESULT.md"
    receipt_path.write_text(receipt, encoding="utf-8")
    (live_root / "RECEIPT.md").write_text(receipt, encoding="utf-8")
    print(receipt)
    print(f"live: wrote {receipt_path}", flush=True)


if __name__ == "__main__":
    main()
