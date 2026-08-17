# LAB-01 — fast-agent standalone spike

Experimental. Zero authority over StallVix, production, Granaide/Kilo, or the candidate framework.

Consumes the accepted LAB-00-v2 arena at `38aa8b2fb47f5b5c44111b988506affe048efd52`. Does not modify the arena, PR #10, or PR #8.

## What this spike tests

The adapter is part of the test:

1. The candidate sees only the generated candidate surface, not evaluator goldens.
2. T3 keeps **one** FastAgent conversation session across three filesystem slices.
3. `toolTraces` are written by the harness from tools that actually ran. Model JSON traces are discarded.
4. fast-agent gets no benchmark-specific tools, answers, or extra MCP servers.

## Commands

From `lab/lab-01-fast-agent`:

```text
uv sync --prerelease=allow
uv run python -m lab01.negative_controls
uv run python -m lab01 --scenario T1
```

Default model is `passthrough` (no API key). Live model:

```text
set FAST_AGENT_MODEL=haiku
uv run python -m lab01 --scenario T1 --model haiku
```

Do not commit secrets. `fastagent.secrets.yaml` is gitignored.

## Layout

- `lab01/surface.py` — jailed tools
- `lab01/surface_server.py` — MCP server fast-agent is allowed to use
- `lab01/run.py` — one session, per-turn surface swap, harness traces
- `lab01/assemble.py` — strip model `toolTraces`
- `.runtime-private/` — generated surfaces and traces, gitignored

Python 3.12 is required (fast-agent 0.10.9). `uv python install 3.12` is enough; it does not touch the Granaide root `package.json`.
