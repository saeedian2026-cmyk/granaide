# Agent 001 — Execution Rail

**Scope:** Granaide × StallVix Kilo spike only. No StallVix product/data-model/UI work.

**Chief operator:** GPT Plus + Codex  
**Rule:** one active packet at a time. Do not jump ahead. Historical packets remain evidence; this file controls current execution order.

## Current state

- CURSOR-01 / 01B / 01C / 01D: complete.
- CURSOR-04 consumer sync + activation: PASS.
- KILO-01F containment: PARTIAL PASS; permission containment is accepted, but Gate B still needs operator proof for streaming, same-session resume, and external no-mutation state.
- KILO-02 / KILO-03: blocked.

## The only execution rail

### STEP 1 — CLOSE GATE B

**ACTIVE NOW:** `tasks/cursor/CURSOR-06-GATE-B-OPERATOR-EVIDENCE-CLOSEOUT.md`

Purpose: close only the three remaining operator-evidence items:

1. external Git/no-mutation proof;
2. resume the exact KILO-01F session and recover its nonce/context;
3. prove incremental Kilo event streaming from an event-bearing CLI surface.

Stop after CURSOR-06 and return evidence to GPT/Codex.

**Exit:** GPT/Codex records Gate B PASS or FAIL.

---

### STEP 2 — DECIDE RUNTIME ISOLATION

**NEXT ONLY AFTER GATE B:** `tasks/cursor/CURSOR-07-KILO-RUNTIME-ISOLATION-SPIKE.md`

Purpose: compare native Windows Kilo with stronger isolation candidates (WSL/Linux/container/separate OS identity) and decide the minimum viable runtime boundary for Agent #001.

This is the Docker question for this spike. It is NOT database/Docker-Supabase work.

Stop after evidence + recommendation. GPT/Codex decides whether native Windows is acceptable for Agent #001 or whether isolated execution becomes mandatory before write-capable work.

---

### STEP 3 — CLOSE FACTORY TOOLING

**AFTER STEP 2:** `tasks/cursor/CURSOR-08-FACTORY-TOOLING-CLOSEOUT.md`

CURSOR-08 supersedes executing CURSOR-02R and CURSOR-03R separately. Their findings remain evidence, but agents should not run them as separate jobs.

Purpose:

- make the pack verifier truthful against current head;
- make the headless proof harness produce trustworthy event/session/Git evidence;
- prove both tools with tests.

Stop for GPT/Codex audit.

---

### STEP 4 — PROVE JOB-SCOPED WRITE

**AFTER FACTORY TOOLING PASSES:**

1. `tasks/cursor/CURSOR-05-JOB-SCOPED-CANARY-GRANT.md`
2. GPT/Codex byte + activation audit
3. `tasks/kilo/KILO-02R-BOUNDED-MUTATION-CANARY.md`
4. GPT/Codex Gate C verdict

Purpose: prove that a modifying agent receives exactly one job-scoped write root rather than broad `src/**` / `docs/**` authority.

KILO-02R remains blocked until CURSOR-05 is audited and activated.

---

### STEP 5 — PROVE REAL STALLVIX VALUE

**ONLY AFTER GATE C PASS:** `tasks/kilo/KILO-03-STALLVIX-CONTEXT-ENVELOPE.md`

Purpose: first useful bounded repo task under the proven runtime/capability model.

Stop for GPT/Codex Gate D audit.

---

### STEP 6 — EXIT / CLAUDE HANDOFF

After Gates B/C/D and factory-tooling proof are complete:

- GPT/Codex performs the spike exit audit;
- summarize Agent #001 architecture, failures, repairs, receipts, runtime-isolation decision, and remaining risks;
- only then hand to Claude Code for final integration review.

## What not to run now

Until STEP 1 is closed, do not run:

- CURSOR-07
- CURSOR-08
- CURSOR-05
- KILO-02R
- KILO-03
- old CURSOR-02R / CURSOR-03R as standalone jobs
- old KILO-01 / KILO-01R / KILO-01F again

## Status shorthand

```text
NOW       CURSOR-06  → Gate B closeout
NEXT      CURSOR-07  → runtime isolation decision
THEN      CURSOR-08  → factory verifier + harness closeout
THEN      CURSOR-05  → job-scoped write grant
THEN      KILO-02R   → bounded mutation
THEN      KILO-03    → real value
FINALLY   GPT audit → Claude handoff
```

If another document disagrees about current order, this execution rail wins until GPT/Codex updates it.