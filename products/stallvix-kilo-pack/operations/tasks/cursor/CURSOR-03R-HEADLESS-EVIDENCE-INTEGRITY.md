# CURSOR-03R — Headless Harness Evidence-Integrity Repair

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repo:** Granaide  
**Risk:** Medium — evidence collection around an external agent runtime  
**Gate:** must PASS before Gate E can be claimed

## Goal

Upgrade the existing Kilo proof harness from a useful capture skeleton into evidence that can independently support Gate B/E claims.

## Read first

- `scripts/proof-kilo.mjs`
- `scripts/proof-kilo.test.mjs`
- `products/stallvix-kilo-pack/operations/tasks/cursor/CURSOR-03-HEADLESS-PROOF-HARNESS.md`
- `products/stallvix-kilo-pack/operations/CLINE-AUDIT-CURSOR-03.md`
- `products/stallvix-kilo-pack/operations/SPIKE-AUDIT-2026-08-10.md`
- current official Kilo CLI help/docs for the installed runtime; do not guess flags

## Required corrections

1. **Streaming evidence**
   - replace the live Kilo `spawnSync` path with asynchronous `spawn`/equivalent;
   - parse JSONL/event output incrementally as bytes arrive;
   - record local receipt timestamps or monotonic offsets for event arrival;
   - evidence must distinguish `events arrived during execution` from `events parsed after process exit`.
2. **Committed changed paths**
   - when before/after HEAD differ, derive actual committed paths using operator-side Git (`git diff --name-only <before>..<after>` or equivalent);
   - combine those with dirty-path changes without replacing them with only a synthetic HEAD marker.
3. **Environment inheritance contract**
   - stop silently inheriting the entire operator environment by default;
   - define a minimal child environment needed for process launch and Kilo's configured authentication path;
   - if provider credentials must be inherited from environment, require an explicit opt-in flag/list and record only variable **names**, never values;
   - never write environment values into the proof bundle.
4. **Path privacy**
   - evidence bundle should use repo-relative or sanitized workspace/prompt/binary identifiers where practical;
   - do not persist the user's full home path unless required for a failure diagnosis.
5. **Activation facts**
   - before live execution, capture Kilo version and verify the requested agent is visible/loaded using the installed CLI's supported commands;
   - capture `kilo config check` if supported;
   - activation failure must stop the live proof rather than fall through.
6. **Runtime absence**
   - preserve loud `KILO_NOT_AVAILABLE`; do not install Kilo automatically.
7. **Timeout and cleanup**
   - preserve non-zero timeout behavior;
   - ensure child process cleanup is attempted on timeout/error;
   - cap captured output/events to a documented safe size.
8. **Redaction**
   - apply redaction incrementally before persistence;
   - tests must inject realistic fake secret values and prove stored bundle/events do not contain them.
9. **Session evidence**
   - capture session id from live JSON events when exposed;
   - do not fabricate one if absent.
10. Keep `kilo run` as the primary v0 path unless installed-runtime evidence proves another interface is necessary.

## Allowed paths

- `scripts/proof-kilo.mjs`
- `scripts/proof-kilo.test.mjs`
- focused fixture files under `scripts/fixtures/kilo-proof/**`
- product-local proof docs/output schemas
- `package.json` / lockfile only if a narrowly justified dependency is unavoidable

## Forbidden paths

- StallVix repo mutation by Cursor
- Granaide UI/DB/auth/schema
- provider credentials or secret values
- automatic Kilo installation/update
- deploy/CI changes
- weakening Agent 001 permissions to make harness tests pass

## Acceptance criteria

- H1: help works without Kilo.
- H2: missing Kilo fails loud/non-zero.
- H3: fixture subprocess proves incremental event capture with distinct arrival offsets before exit.
- H4: fixture with HEAD change reports exact committed changed paths.
- H5: dirty working-tree path delta is still captured correctly.
- H6: proof bundle contains no full environment dump and no injected fake-secret value.
- H7: default live child environment is explicitly constructed; provider-env inheritance is opt-in if supported.
- H8: absolute user-home paths are sanitized in persisted evidence where feasible.
- H9: activation failure prevents a live proof run.
- H10: timeout terminates/cleans child and returns non-zero.
- H11: focused tests plus relevant lint/type/build checks pass.
- H12: sample sanitized bundle is sufficient for GPT/Codex to distinguish runtime facts from agent narrative.

## Proof

Return:

- `--help` output;
- missing-runtime proof;
- incremental mock/fixture proof;
- changed-HEAD path proof;
- secret-redaction proof;
- timeout proof;
- focused tests;
- relevant lint/type/build results;
- `git diff --check`;
- exact changed paths;
- dependency delta;
- remaining limitations of `kilo run` vs `kilo serve` for Gate E.

## Stop conditions

Stop if live testing would require exposing a real secret, silently installing Kilo, weakening the consumer agent, or mutating StallVix outside an explicitly later Kilo packet.

Do not claim Gate E PASS in this Cursor packet.