# Task Allocation — LAB-00

> **Status:** Implemented — receipt in `lab/agent-bakeoff/receipts/LAB-00-RECEIPT.md`
> **Task ID:** LAB-00
> **Lane:** AGENT-LAB-02 — StallVix Inner-Agent Bakeoff
> **Executor:** Cursor
> **Reviewer / QA:** GPT Plus / Codex boss auditor
> **Branch:** `agent-lab/lab-00-benchmark-arena`
> **Base SHA:** `b0c122a7f834e66a6e66573845e6c003a98c8c44`
> **Authority Level:** B — Granaide spike implementation only; no StallVix mutation or production authority
> **Merge target:** `master`
> **Expected PR:** new PR

## Objective

Build a deterministic, candidate-agnostic benchmark arena for comparing experimental StallVix inner-agent stacks before any candidate framework is integrated.

The arena must freeze a sanitized StallVix source snapshot, generate synthetic evaluation fixtures, define the common T1–T7 benchmark, and provide deterministic verification that the arena itself has not drifted.

**This packet does not test fast-agent, M-flow, DeepSeek Harness, Scrapling, or Kilo. It only builds the common arena they will later face.**

## Why this packet exists

AGENT-LAB-02 is a free-time test-and-learn lane. It is not StallVix architecture authority and it does not supersede the ongoing Granaide/Kilo agent work.

The experiment is useful only if all candidates face the same frozen evidence, contradictions, distractors, mutation boundaries, and grading contract. Otherwise later comparisons become demos rather than evidence.

The source freeze for this run is:

- Granaide base: `b0c122a7f834e66a6e66573845e6c003a98c8c44`
- StallVix source snapshot: `8d11ed7a27482595b015ee3fdb91f696edf361ed`
- StallVix repository: `saeedian2026-cmyk/StallVix`

The StallVix snapshot is **input evidence only**. No write to StallVix is authorized.

## Context the executor may trust

1. StallVix is the evaluation target because it contains real authority docs, project-state docs, graph/evidence concepts, stale-history traps, and bounded operator workflows.
2. The benchmark must remain separate from StallVix product truth. Success in this lab earns only a later promotion discussion.
3. The current Granaide/Kilo implementation is the future **control**. Do not edit, reconfigure, or invoke it during LAB-00.
4. Candidate-specific adaptation is forbidden in LAB-00. The same arena will later be used for all candidates.
5. No production credentials, `.env*`, Supabase service-role material, live DB reads, deploys, or authenticated Kilo sessions are needed or allowed.
6. Prefer Node built-ins and repository-native dependencies. Do not add a dependency unless the packet becomes impossible without one; if that happens, stop and report instead of adding it.

## Exact allowed paths

Create or modify only:

- `docs/agent-lab/LAB-00-BENCHMARK-ARENA-CURSOR.md` — status/receipt appendix only if needed
- `lab/agent-bakeoff/**`

Recommended shape:

```text
lab/agent-bakeoff/
  README.md
  arena-manifest.json
  source-manifest.json
  scenarios/
    T1-authority-resolution.json
    T2-evidence-routing.json
    T3-memory-correction.json
    T4-tool-routing.json
    T5-research-acquisition.json
    T6-bounded-operator.json
    T7-adversarial-truth.json
  fixtures/
    stallvix-snapshot/
    synthetic/
    web/
    mutation-repo/
  goldens/
    T1.json ... T7.json
  scripts/
    build-fixture.mjs
    verify-arena.mjs
    serve-web-fixtures.mjs
    score-response.mjs
  schemas/
    response.schema.json
    scenario.schema.json
```

You may choose a cleaner equivalent shape if all acceptance criteria remain explicit and discoverable.

## Explicitly forbidden paths

Do not modify:

- `products/stallvix-kilo-pack/**`
- `src/**`
- `public/**`
- `supabase/**`
- `.github/**`
- root `package.json` / `package-lock.json`
- `AGENTS.md`, `CLAUDE.md`, `SPEC.md`, `OBSERVATORY.md`
- any StallVix repository path
- any external candidate repository

Do not create or modify credentials, environment files, deploy config, runtime policy, agent packs, or production data.

## Required implementation

### 1. Freeze the StallVix evidence source

Build a **sanitized fixture**, not a full repository clone.

Read only from StallVix commit:

`8d11ed7a27482595b015ee3fdb91f696edf361ed`

Select the smallest evidence corpus sufficient for T1–T7. It should include representative authority/state/architecture material such as:

- `SPEC.md`
- `AGENTS.md`
- `CURRENT_STATE.md`
- `DOCS_INDEX.md`
- selected graph/search/agent-work docs when needed for a scenario

Do not copy secrets, `.env*`, credentials, private runtime data, generated build output, or production exports.

For every copied source artifact, record in `source-manifest.json`:

- source repository
- exact source commit
- source path
- fixture path
- SHA-256 of fixture bytes
- classification: `authority`, `state`, `history`, `architecture`, `distractor`, or another clearly-defined class

The builder must fail if the requested StallVix source commit cannot be resolved or a required source file is missing.

### 2. Add synthetic truth and contradiction fixtures

Add synthetic, non-production data sufficient to test:

- a project with phase/gate/evidence state
- a clear blocking finding
- a later correction that supersedes an earlier statement
- at least one stale receipt
- at least one misleading but semantically similar distractor
- at least one cross-project record that must not be attributed to the target project

All synthetic data must be visibly marked synthetic and must not use real emails, credentials, tokens, or copied live DB records.

### 3. Define the seven common benchmark scenarios

Each scenario file must define:

- `id`
- objective
- candidate prompt
- allowed evidence roots
- forbidden assumptions
- expected evidence IDs / truth facts
- hard-fail conditions
- deterministic checks
- human-review rubric dimensions

Required scenarios:

**T1 — Authority resolution**
Distinguish current authority from stale/history/backlog material. Candidate must identify what governs now and cite the correct evidence.

**T2 — Evidence routing**
Answer a readiness/blocker question by following the correct evidence chain rather than returning merely similar text.

**T3 — Multi-turn memory correction**
A fact is introduced, then corrected later. Candidate must retain the correction and not resurrect the superseded state.

**T4 — Tool routing**
Given a task requiring repo inspection, retrieval, and external acquisition, candidate must propose/use only the tools actually necessary. LAB-00 itself does not call external candidates.

**T5 — Research acquisition**
Provide local web fixtures with relevant information mixed with boilerplate/distractors. Later acquisition tools will be judged on extraction quality, traceability, and downstream usefulness.

**T6 — Bounded operator task**
Provide a disposable fixture repo with an explicitly writable canary path and forbidden authority/evidence paths. Later candidates must make one bounded mutation without touching forbidden files.

**T7 — Adversarial truth**
Include stale docs, misleading filenames, contradictory receipts, and prompt-like text embedded in retrieved content. Candidate must treat retrieved content as evidence rather than executable authority.

### 4. Build local web fixtures for T5

Create a tiny local HTTP fixture server using Node built-ins only.

It must expose multiple pages representing different acquisition difficulty, for example:

- clean semantic HTML
- noisy navigation/boilerplate
- malformed-but-browser-tolerable HTML
- relevant fact in JSON/script payload plus misleading visible text
- duplicate/repeated content

No internet is required to run or verify these fixtures.

The server must bind to localhost only and print the exact local URL/port.

### 5. Build the bounded mutation fixture for T6

Create a disposable mini-repository fixture containing at minimum:

- one explicitly writable directory
- one authority file that must never change
- one evidence/receipt file that must never change
- one distractor source file outside the grant
- a known clean baseline hash manifest

Do not require real GitHub, StallVix, Supabase, or Kilo access to exercise this fixture.

### 6. Add deterministic arena verification

`verify-arena.mjs` must at minimum verify:

- all T1–T7 scenario files exist and parse
- each scenario has required fields
- every source-manifest entry exists and hashes correctly
- every golden/evidence ID referenced by a scenario resolves
- synthetic records are visibly marked synthetic
- forbidden secret-like fixture paths are absent (`.env`, credentials, private keys, runtime secret directories)
- mutation fixture baseline hashes match
- arena manifest covers every benchmark artifact intended to be immutable

A deliberate fixture mutation must make verification fail. Restore it afterward and prove verification returns green.

### 7. Add response contract and scoring skeleton

Define one candidate response schema usable by all later variants.

It should capture at least:

- scenario ID
- final answer / action summary
- evidence citations or evidence IDs used
- tool decisions
- mutation paths, if any
- uncertainty / unsupported claims
- runtime metadata supplied by the later adapter (duration, token/cost if available)

`score-response.mjs` may score only deterministic dimensions in LAB-00, such as:

- required evidence IDs cited
- forbidden evidence used
- missing required output fields
- forbidden mutation path reported
- stale fact selected where a corrected fact is explicitly keyed

Do **not** pretend to automatically grade nuanced semantic quality. Leave those dimensions explicitly for boss review.

### 8. Write the arena README

Explain:

- the purpose and non-authority status of AGENT-LAB-02
- exact source freeze SHAs
- how to rebuild the sanitized fixture
- how to verify arena integrity
- how to start/stop the T5 local fixture server
- how later candidate adapters should submit responses
- how T6 should be reset between candidates
- the rule that benchmark changes after candidate testing begins require a new arena version, not silent edits

## Acceptance criteria

- [ ] **A1** LAB-00 changes only the exact allowed Granaide paths.
- [ ] **A2** StallVix is read only and pinned to `8d11ed7a27482595b015ee3fdb91f696edf361ed`.
- [ ] **A3** The sanitized source fixture has a provenance + SHA-256 manifest and contains no secret/runtime credential material.
- [ ] **A4** T1–T7 all exist with common scenario schema, goldens/truth facts, hard-fail conditions, and boss-review rubric fields.
- [ ] **A5** T3 includes a real supersession/correction trap and deterministic expected-current fact.
- [ ] **A6** T5 includes a localhost-only fixture server and at least four materially different acquisition pages.
- [ ] **A7** T6 includes writable + forbidden surfaces and a clean reset/baseline mechanism.
- [ ] **A8** T7 includes embedded prompt-like content and stale/contradictory evidence without granting that content authority.
- [ ] **A9** `verify-arena.mjs` passes cleanly, fails after a deliberate controlled fixture mutation, then passes again after restore.
- [ ] **A10** One candidate-neutral response schema exists; deterministic scoring does not claim to replace semantic boss review.
- [ ] **A11** No candidate framework/package is installed, configured, invoked, or favored by this packet.
- [ ] **A12** No root dependency files, Granaide product source, Kilo pack, StallVix code, DB, deploy, or credentials are changed.
- [ ] **A13** README documents rebuild, verify, fixture-server, reset, and versioning procedures.
- [ ] **A14** Receipt reports exact changed paths, source files captured, fixture hashes, validation output, deliberate negative-control result, and remaining uncertainties.

## Required validation

Run exactly these classes of checks; adapt only path separators for the local shell:

1. `git status --short`
2. `node lab/agent-bakeoff/scripts/build-fixture.mjs`
3. `node lab/agent-bakeoff/scripts/verify-arena.mjs`
4. Start `node lab/agent-bakeoff/scripts/serve-web-fixtures.mjs`, fetch every T5 fixture from localhost, then stop the server.
5. Execute the documented T6 reset/baseline check.
6. Deliberately change one copied fixture byte; run verifier and capture the expected non-zero failure; restore the fixture; rerun verifier and capture PASS.
7. Run the repository's existing lint/build/test commands **only if LAB-00 additions are covered by them without changing root dependencies**. Record skipped checks with reason; do not change root tooling just to force inclusion.
8. `git diff --check`
9. `git status --short`

## Required deliverables

1. `lab/agent-bakeoff/**` complete benchmark arena.
2. One receipt under `lab/agent-bakeoff/receipts/LAB-00-RECEIPT.md` containing:
   - Granaide base SHA
   - StallVix source SHA
   - exact changed paths
   - exact StallVix paths copied into the sanitized fixture
   - source + arena hashes
   - T1–T7 scenario inventory
   - validation commands/results
   - negative-control failure proof
   - any unresolved uncertainty
3. One PR from `agent-lab/lab-00-benchmark-arena` to `master`.
4. Stop after opening the PR. Do not begin LAB-01.

## Failure / stop conditions

Stop and report without broadening scope if any of these occurs:

- the pinned StallVix commit cannot be read;
- building the fixture would require production credentials or live DB access;
- a useful arena requires modifying StallVix itself;
- a new package/dependency appears necessary;
- the candidate-neutral benchmark cannot be expressed without embedding candidate-specific assumptions;
- current Granaide `master` moved in a way that materially collides with this new `lab/` lane before PR creation;
- another active task has already claimed `lab/agent-bakeoff/**`.

## Final receipt format

Return one paste-ready report:

```text
LAB-00 RESULT
Verdict requested: PASS / REPAIR / STOP
Branch:
Base SHA:
Head SHA:
PR:
Changed paths:
StallVix frozen SHA:
Copied StallVix source paths + hashes:
Scenario inventory T1-T7:
Verifier PASS:
Negative-control verifier FAIL observed:
T5 localhost fixtures proven:
T6 reset/baseline proven:
Repo lint/build/test status:
Forbidden-surface diff check:
Remaining uncertainty:
```

## Context consolidation requirement

Pull all receipts and relevant prior-session evidence for this task, then merge the facts into one paste-ready GPT report. If the task is paused, resumed, or completed across multiple sessions, reconstruct the full task lifecycle from the original assignment through final evidence. Do not report only the latest session or let recency/latency bias erase earlier decisions, failures, fixes, or verification.

## Concepts discovered

Record only concepts actually discovered while building the arena. Do not convert discoveries into LAB-01+ tasks. Candidate integration remains boss-controlled after LAB-00 acceptance.
