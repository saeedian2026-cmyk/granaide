# CURSOR-03 — Build Headless Proof Harness

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repo:** Granaide  
**Risk:** Medium  
**Gate:** after CURSOR-01; may proceed in parallel with KILO-01 if paths do not overlap

## Goal

Build a small Granaide-owned harness that can launch/capture a Kilo proof run programmatically and turn runtime evidence into a reviewable artifact.

This packet does **not** prove Kilo itself works. It builds the instrument used to observe Kilo.

## Why this matters

Granaide cannot become an agent-making business if every generated agent must be manually watched in an IDE. Agent Pack #001 needs a reproducible operator path.

Target shape:

```text
pack + workspace + test prompt
        -> proof harness
        -> Kilo CLI/server
        -> captured stdout/events/session id
        -> before/after git facts
        -> proof bundle
```

## Requirements

1. Inspect the installed/current Kilo version's supported programmatic interfaces before coding.
2. Support one real available path:
   - `kilo run`, or
   - `kilo serve` + documented HTTP/SSE client,
   - preferably both if the installed version makes this cheap.
3. Never hardcode credentials or provider keys.
4. Capture before/after workspace facts **outside the agent**:
   - branch;
   - baseline HEAD;
   - final HEAD;
   - dirty path list;
   - changed paths.
5. Capture runtime facts where exposed:
   - Kilo version;
   - agent selected;
   - session identifier;
   - exit/result;
   - streamed/event output or saved transcript path.
6. Generate an evidence bundle under the product proof area rather than inventing StallVix product data.
7. Redact obvious secret-like values from captured environment/output where feasible; do not dump full environment variables.
8. Timeout/failure must produce a non-zero harness result with a useful error.

## Suggested interface

Adapt after inspection:

```bash
npm run proof:kilo -- \
  --workspace ../StallVix \
  --agent stallvix-investigator \
  --prompt-file products/stallvix-kilo-pack/PROOF-TEST-A.md
```

The harness may require Kilo to already be installed/authenticated. If absent, fail clearly with `KILO_NOT_AVAILABLE`; do not install it silently.

## Allowed paths

- `products/stallvix-kilo-pack/operations/**`
- `products/stallvix-kilo-pack/proof/**`
- new product-local script/test files
- `package.json` / lockfile only for a justified script/dependency

## Forbidden

- modifying StallVix as part of this Cursor packet
- Granaide DB/auth/UI
- provider/API secrets
- deploying anything

## Acceptance

- H1: `--help` or equivalent documents inputs without requiring Kilo.
- H2: missing Kilo fails loud and non-zero.
- H3: a mocked or fixture subprocess/event source proves capture parsing without using live credentials.
- H4: before/after Git facts come from the operator process, not the agent's narrative.
- H5: output is sufficient for GPT Plus/Codex to independently review KILO-01 and later Kilo packets.
- H6: no hidden installation, no environment dump, no mutation outside proof paths.

## Proof

Return:

- interface examples;
- missing-runtime failure proof;
- focused tests;
- lint/type/build checks relevant to changed files;
- sample sanitized proof output;
- remaining differences between `kilo run` and `kilo serve` that matter for Granaide.