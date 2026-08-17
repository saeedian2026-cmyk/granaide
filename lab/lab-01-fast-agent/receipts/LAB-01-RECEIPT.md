# LAB-01 RECEIPT

Experimental spike only. Zero authority over StallVix, production, Granaide/Kilo, or fast-agent.

## LAB-01 RESULT

Branch: `agent-lab/lab-01-fast-agent-spike`  
Consumes LAB-00-v2 head: `38aa8b2fb47f5b5c44111b988506affe048efd52`  
Changed paths: `docs/agent-lab/LAB-01-FAST-AGENT-SPIKE-CURSOR.md`, `lab/lab-01-fast-agent/**` only.

fast-agent version: `fast-agent-mcp==0.10.9` (Python 3.12 via uv, isolated under `lab/lab-01-fast-agent`. Root `package.json` unchanged.)

Candidate surface isolation: PASS. Generated per-scenario / per-turn bundle only. Evaluator goldens, scoring keys, and arena-manifest reads are refused.

T3 one session: PASS. One FastAgent `candidate` object used for turns 1–2–3 while `current-root` swaps filesystem slices. Turn 1 cannot read correction/standup/berth files.

T4 harness traces: PASS. Model JSON `toolTraces` including `db.production` are stripped. Submission traces come from `list_dir` / `read_file` / `localhost_get` recorded by the harness.

No benchmark-specific privileges: PASS. Generic instruction only. MCP tools are the four jailed surface tools. No fetch, no extra filesystem, no goldens in the prompt.

Root dependency diff: none.

Forbidden-surface diff: none. Did not edit `lab/agent-bakeoff-v2/**`, PR #10, PR #8, `src/**`, `supabase/**`, or Kilo.

Remaining uncertainty:

- Default model is fast-agent `passthrough`. Live T1–T7 scoring needs a provider key (`FAST_AGENT_MODEL`) and is not claimed here.
- Localhost GET can fail if port 8765 is already half-open; the harness still records the attempt. A live T4 PASS still needs a successful GET.
- Aikido MCP was unavailable in this session.

Verdict requested: **PASS** for the standalone adapter spike (not a live bakeoff scorecard).
