from pathlib import Path

LAB01_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = LAB01_ROOT.parent.parent
ARENA_ROOT = REPO_ROOT / "lab" / "agent-bakeoff-v2"
BUNDLE_SCRIPT = ARENA_ROOT / "scripts" / "build-candidate-bundle.mjs"
SCORE_SCRIPT = ARENA_ROOT / "scripts" / "score-response.mjs"
T6_SCRIPT = ARENA_ROOT / "scripts" / "run-t6-evaluation.mjs"
WEB_SCRIPT = ARENA_ROOT / "scripts" / "serve-web-fixtures.mjs"
RUNTIME = LAB01_ROOT / ".runtime-private"
CONTROL_DIR = RUNTIME / "control"
SURFACES_DIR = RUNTIME / "surfaces"
CURRENT_ROOT_FILE = CONTROL_DIR / "current-root.txt"
POLICY_FILE = CONTROL_DIR / "policy.json"
TRACES_FILE = CONTROL_DIR / "traces.jsonl"

FORBIDDEN_NAME_PARTS = {
    "evaluator",
    "goldens",
    "arena-manifest.json",
    "scoring-keys.json",
    "t5-pages-registry.json",
    "t6-sealed.json",
    "hard-fail-rules.json",
}

LATER_T3_FILES = (
    "correction-2026-08-16.md",
    "standup-2026-08-17.md",
    "berth-north.md",
    "berth-south.md",
)
