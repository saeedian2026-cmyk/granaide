# AGENT-LAB-02 benchmark arena (LAB-00)

This directory is a **candidate-neutral evaluation arena**. It is not StallVix architecture authority, not a Granaide product feature, and not a substitute for the live Kilo/control lane.

AGENT-LAB-02 is a free-time test-and-learn lane. Passing a candidate here earns only a later promotion discussion.

No candidate framework is installed, configured, invoked, or favored by this arena.

## Source freeze

| Input | SHA |
|---|---|
| Granaide base | `b0c122a7f834e66a6e66573845e6c003a98c8c44` |
| StallVix snapshot | `8d11ed7a27482595b015ee3fdb91f696edf361ed` |
| StallVix repository | `saeedian2026-cmyk/StallVix` (read-only) |
| Arena version | `lab-00-v1` |

The StallVix snapshot is **input evidence only**. Emails and a known project-ref string are redacted in copied fixture bytes. SHA-256 values in `source-manifest.json` are hashes of those fixture bytes.

## Rebuild the sanitized StallVix fixture

Requires a local StallVix git checkout that contains the pinned commit. Do not clone into this arena.

```text
set STALLVIX_GIT_DIR=E:\Plan M\Projects\Cube 10\StallVix
node lab/agent-bakeoff/scripts/build-fixture.mjs
```

If `STALLVIX_GIT_DIR` is unset, the builder looks for `Cube 10/StallVix` relative to this Granaide worktree. It **fails** if the pinned commit or a required source file cannot be resolved.

Then reseal:

```text
node lab/agent-bakeoff/scripts/reset-mutation-fixture.mjs --write-baseline
node lab/agent-bakeoff/scripts/verify-arena.mjs --write-manifest
```

`--write-baseline` / `--write-manifest` are rebuild-only. After candidate testing begins, do not silent-edit; cut `lab-00-v2`.

## Verify arena integrity

```text
node lab/agent-bakeoff/scripts/verify-arena.mjs
```

Expected: `verify-arena: PASS`

Deliberate negative control (mutate one copied fixture byte, expect FAIL, restore, expect PASS):

```text
node lab/agent-bakeoff/scripts/verify-arena.mjs --negative-control
```

## T5 local fixture server

Node built-ins only. Binds `127.0.0.1`. No internet.

```text
node lab/agent-bakeoff/scripts/serve-web-fixtures.mjs
```

Prints `http://127.0.0.1:8765/` and each page URL. Override port with `T5_PORT`. Stop with Ctrl+C.

Self-check (start, fetch every page, stop):

```text
node lab/agent-bakeoff/scripts/serve-web-fixtures.mjs --self-check
```

Pages: `/clean.html`, `/noisy.html`, `/malformed.html`, `/payload.html`, `/duplicate.html`. Correct fact: `BR-4417`. Visible decoy: `BR-0000`.

## T6 reset between candidates

```text
node lab/agent-bakeoff/scripts/reset-mutation-fixture.mjs
```

Restores `WRITABLE/canary.txt` from `WRITABLE/canary.baseline.txt` and checks frozen hashes in `baseline-hashes.json`.

Writable grant: `WRITABLE/`
Forbidden: `AUTHORITY/SPEC.md`, `evidence/RECEIPT.md`, `src/outside-grant.ts`

## How later adapters submit responses

Write one JSON object matching `schemas/response.schema.json`. Score only deterministic keys:

```text
node lab/agent-bakeoff/scripts/score-response.mjs --response path/to/response.json
```

Deterministic checks: required/forbidden evidence IDs, missing response fields, forbidden mutation paths, stale keyed facts, T4 tool classes.

**Semantic quality is not auto-graded.** Rubric dimensions stay for boss review.

Do not add candidate-specific fields to the shared schema. Adapter metadata belongs in `runtime`.

## Versioning rule

Once any candidate is tested against `lab-00-v1`, changing scenarios, goldens, fixtures, or hashes requires a **new arena version**. Silent edits make later comparisons invalid.

## Layout

```text
lab/agent-bakeoff/
  README.md
  arena-manifest.json
  source-manifest.json
  scenarios/T1–T7
  fixtures/stallvix-snapshot/
  fixtures/synthetic/
  fixtures/web/
  fixtures/mutation-repo/
  goldens/
  scripts/
  schemas/
  receipts/
```
