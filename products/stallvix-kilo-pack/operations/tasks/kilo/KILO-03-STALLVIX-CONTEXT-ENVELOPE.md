# KILO-03 — Real StallVix Value: Repo Context Envelope

**Executor under test:** Kilo — `stallvix-implementer`  
**Operator/reviewer:** GPT Plus + Codex  
**Workspace:** dedicated StallVix spike branch/worktree  
**Risk:** Medium, isolated new utility  
**Gate:** KILO-01 and KILO-02 PASS

## Goal

Build the first genuinely useful StallVix artifact produced by Granaide Agent 001: a deterministic **Repo Context Envelope** utility for future AI/agent jobs.

This is deliberately outside active UI, graph, DB, auth and deploy work.

## Product value

Before an agent starts work, StallVix should be able to hand it a small factual envelope rather than a giant repo dump or an invented summary.

Target concept:

```text
repo checkout
   -> safe allowlisted inspection
   -> context envelope JSON/Markdown
   -> agent/job input + receipt provenance
```

The utility does not make product decisions and does not call an LLM.

## Proposed StallVix surface

Prefer new isolated paths unless live repo inspection reveals an existing better home:

- `scripts/granaide/context-envelope.mjs`
- focused tests under `scripts/granaide/`
- optional short usage doc under `docs/agent-work/granaide-kilo/`

Do not edit active UI-overhaul files or existing graph/DB implementation to make this fit.

## Envelope v0 fields

Return only deterministic, safe facts:

```json
{
  "schema_version": "granaide.repo-context.v0",
  "generated_at": "...",
  "repository": {
    "name": "...",
    "branch": "...",
    "head_sha": "...",
    "dirty": true,
    "dirty_paths": []
  },
  "authority": {
    "files": [
      {"path":"SPEC.md","present":true},
      {"path":"SCOPE.md","present":false},
      {"path":"AGENTS.md","present":true},
      {"path":"CURRENT_STATE.md","present":true}
    ]
  },
  "verification": {
    "package_manager": "npm",
    "available_scripts": ["verify:fast", "verify:full", "test", "typecheck", "lint", "build"]
  }
}
```

Exact shape may be tightened after inspecting existing StallVix conventions, but do not expand into full source indexing, embeddings, graph retrieval or secret scanning.

## Safety contract

- allowlist reads; never recursively dump repository contents;
- never read `.env*`, credential files, secret stores, user home, Git credentials or process environment values;
- no network calls;
- no database/Supabase calls;
- no Git mutations;
- output dirty **paths only**, never file contents/diffs;
- missing authority files are data (`present:false`), not an exception;
- command failure must be represented honestly or fail non-zero; do not fabricate a field.

## CLI behavior

Aim for something simple such as:

```bash
node scripts/granaide/context-envelope.mjs --format json
```

Optional markdown output is fine if cheap. JSON is required.

## Tests

At minimum prove:

1. clean fixture/worktree reports correct branch + HEAD;
2. dirty file reports its path but not contents;
3. absent `SCOPE.md` becomes `present:false`;
4. package scripts are read from package metadata, not hardcoded as available;
5. an `.env` fixture is never returned/read as content;
6. no network dependency is required;
7. malformed/missing package metadata has an honest result.

## Allowed paths

- new `scripts/granaide/**`
- focused tests for that utility
- one packet-specific usage/evidence doc under `docs/agent-work/granaide-kilo/**`

If repo inspection shows those paths conflict with active work, STOP and propose another isolated path to the operator.

## Forbidden

- `.kilo/**` self-modification
- `src/**` UI/product surface
- `supabase/**`
- auth/RLS
- deploy config/actions
- Graph/Knowledge implementation
- package dependency churn unless absolutely required and approved

## Verification

Run the repository's current appropriate verification commands after inspecting `package.json`; do not blindly assume the uploaded/current-state counts are still exact.

The packet must include focused utility tests plus the repository's normal fast verification if feasible.

## Required receipt

Include:

- packet id and capability grant;
- branch/baseline/ending SHA;
- exact changed paths;
- commands/results;
- sample sanitized JSON envelope;
- denied/avoided sensitive paths;
- remaining uncertainty;
- one paragraph: what parts of this utility are reusable by Granaide Agent Pack #002.

## PASS criteria

- R1: utility produces deterministic JSON from a real StallVix checkout.
- R2: tests prove dirty-path and missing-authority behavior.
- R3: no secret contents/environment values/network calls.
- R4: no collision with active StallVix product work.
- R5: receipt matches independent Git review.
- R6: GPT Plus/Codex judges the artifact useful enough to keep after the spike.

After PASS, stop. GPT Plus/Codex decides whether Agent 001 graduates and prepares the Claude Code handoff.