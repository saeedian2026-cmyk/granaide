# LAB-01 — fast-agent standalone spike (Cursor packet)

**Status:** experimental / free-time  
**Authority:** none over StallVix architecture, production, Granaide/Kilo control, or fast-agent itself  
**Consumes:** LAB-00-v2 / PR #10 head `38aa8b2fb47f5b5c44111b988506affe048efd52`  
**Does not:** modify the v2 arena, merge PR #10, touch PR #8, install M-flow / DeepSeek / Scrapling / Kilo

Repository: `saeedian2026-cmyk/granaide`  
Branch: `agent-lab/lab-01-fast-agent-spike`  
Allowed paths: `docs/agent-lab/LAB-01-FAST-AGENT-SPIKE-CURSOR.md`, `lab/lab-01-fast-agent/**`

## Adapter-as-test

- Candidate filesystem = generated LAB-00 surface only (per-turn for T3).
- One FastAgent session for T3; swap `current-root` between turns.
- Harness records `toolTraces`. Model-emitted traces are ignored.
- MCP surface tools: `list_dir`, `read_file`, `write_file`, `localhost_get`. No fetch, no extra filesystem, no evaluator.

## Stop conditions

Stop instead of broadening if a live vendor key is required to prove the adapter contract (passthrough/internal model is enough for isolation, session, and harness traces), if the work would edit `lab/agent-bakeoff-v2/**`, or if it would touch production/Kilo.
