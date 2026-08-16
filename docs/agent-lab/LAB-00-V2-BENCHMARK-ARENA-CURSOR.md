# LAB-00-v2 — StallVix Inner-Agent Benchmark Arena (Cursor packet)

**Status:** experimental / free-time  
**Authority:** none over StallVix architecture, production, Granaide/Kilo control, or any candidate framework  
**Replaces:** LAB-00-v1 / PR #8 (do not continue that branch; do not rewrite its history)

Repository: `saeedian2026-cmyk/granaide`  
Branch: `agent-lab/lab-00-v2-benchmark-arena`  
Allowed paths: `docs/agent-lab/LAB-00-V2-BENCHMARK-ARENA-CURSOR.md`, `lab/agent-bakeoff-v2/**`

## Publication rule

StallVix is private. Granaide is public. Do not commit StallVix document bodies. Record only provenance (repo name, commit SHA, source path names, fixture-generation rules, synthetic equivalents). Candidate-visible content must be purpose-built synthetic data.

Local runtime may read a pinned StallVix checkout into gitignored `.runtime-private/` and must destroy/reset after evaluation.

## Architecture

Every test has two physically separate surfaces:

- `scenarios/public/` — prompt + evidence references
- `evaluator/private/` — expected facts, goldens, hard-fail rules, scoring keys, T5 pages registry

Adapters receive only the public envelope and allowed fixture roots.

## V2 additions

- **V2-ADD-1** Verifier deep-compares every duplicated oracle field between public scenario metadata and evaluator `publicMirror`. Mismatch = FAIL.
- **V2-ADD-2** T3 includes superseded old state, current authoritative state, newer-but-non-authoritative evidence, and an unresolved contradiction. Recency is not authority.
- **V2-ADD-3** Candidate fixtures must not contain self-describing fields such as `stale: true`, `whyMisleading`, `expectedCurrentFact`, `correctFact`, or “this is the adversarial file”.
- **V2-ADD-4** T5 evaluator pages registry is not served by the candidate-facing HTTP server. Candidates get discoverable page URLs/entrypoint only.
- **V2-ADD-5** T6 order is snapshot → execute → filesystem delta → score → preserve receipt → reset. Reset never occurs before scoring.
- **V2-ADD-6** Candidate execution root contains only the public envelope, allowed evidence fixtures, and the scenario-specific writable area.

## v2R repairs

- **R1** T3 builds and verifies a per-turn candidate surface. Later-turn evidence files are not on disk before that turn. Prior-turn prompts and evidence ids stay in conversation state.
- **R2** `verify-arena.mjs` seals both `publicFiles` and `evaluatorFiles` against `arena-manifest.json`.

## Tests T1–T7

Synthetic Northwind Harbor corpus. Prompts do not label distractors or malicious files. Scoring prefers observed behavior (tool traces, filesystem delta, multi-turn outputs) over self-report.

## Stop conditions

Stop if private StallVix content would need committing, a new dependency is required, candidate-specific behavior must be hardcoded, tool traces cannot be generic, T6 cannot use real filesystem state, evaluator material cannot be isolated, or work would touch Kilo/control/production.

Do not install fast-agent, M-flow, DeepSeek, Scrapling, or Kilo. Do not start LAB-01.
