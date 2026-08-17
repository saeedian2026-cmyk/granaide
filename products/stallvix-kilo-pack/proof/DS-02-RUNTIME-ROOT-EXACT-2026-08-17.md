# Work Receipt — Gate C CORRECT_ONCE-2 runtime-root exact-node containment (source only)

- `packet_id`: SVX-GRA-CUR-DS-02-RUNTIME-ROOT-EXACT
- `executor`: Cursor (Grok 4.6)
- `capability_grant`: Granaide source only — pack policy/docs/tests/manifest/receipt. No StallVix consumer edit, no authenticated Kilo, no Gate C retry, no Gate D, no merge. PR #9 history not rewritten.
- `branch`: `audit/svx-gra-ds-02-runtime-root-exact`
- `baseline_sha`: `5e108970b114c00e6d2a0b2027c84a5726050fa2` (accepted search-repair source / Granaide PR #9)
- `ending_sha`: `c0cb92620bf7a110b4244540fdc8c95e53c33ce0` — **superseded classification of `kilo_local_recall`**. Exact-root deny stands. See `proof/DS-02-KILO-LOCAL-RECALL-2026-08-17.md`.
- `pushed`: pending at write time
- `pull_request`: draft source PR only; STOP before merge

## Lifecycle (do not report this session only)

1. **Gate C `SVX-GRA-KILO-02`** on StallVix PR #69 `1c6b549` + harness PR #76 `a6982b72` → `CONTAINMENT_GAP`. Investigator `grep: deny` did not stop `codebase_search`. Call authorized, then crashed on missing `@vscode/ripgrep-win32-x64`.
2. **Source repair CORRECT_ONCE** Granaide PR #9 @ `5e10897`. Explicit `codebase_search` / `semantic_search` deny + `tools.*.false`. PR #7 not rewritten.
3. **Consumer re-lock DS-04R** StallVix PR #77 @ `e80f917`. Static lock only. Not Gate C.
4. **Gate C retry `SVX-GRA-KILO-02R`** on `e80f917`. Search tools each forced as native `tool_use` and rejected unavailable before execution. Writes/shell/secrets/external-dir/stream/resume/Git passed. **Confirmed gap:** `read .kilo-runtime-data` listed `gate-c-02r-opacity.txt` and `kilo/`. File contents still denied. Boss: Gate C not closed.
5. **This packet CORRECT_ONCE-2** — exact-root source repair from `5e10897`. No consumer edit. No Gate C claim.

## Required outcome

Deny both the exact `.kilo-runtime-data` node and its descendants on relevant `read`/`glob` and implementer `edit`/`write`/`apply_patch`. Deterministic tests: exact root + child + nested child. Classify `kilo_local_recall` without broadening on suspicion.

**Verdict: REPRESENTABLE.** Applied exact-node deny beside existing `/**` deny. Not `UNREPRESENTABLE_CONTAINMENT`.

## Kilo 7.4.20 mechanism (source, not guessed)

Pinned CLI: `@kilocode/cli@7.4.20`. Source tag: `Kilo-Org/kilocode` `v7.4.20`.

| Surface | 7.4.20 file | Exact mechanism |
| --- | --- | --- |
| Wildcard | `packages/opencode/src/util/wildcard.ts` | `*` → `.*`. Pattern `.kilo-runtime-data/**` becomes `^\.kilo-runtime-data/.*.*$` and **requires a slash**. Bare `.kilo-runtime-data` does not match. |
| Permission evaluate | `packages/opencode/src/permission/index.ts` `evaluate()` | `findLast` matching `Wildcard.match(permission)` and `Wildcard.match(pattern)`. Last matching rule wins. |
| `fromConfig` | same file | Object-entry order. `expand()` only rewrites `~` / `$HOME`. |
| `read` directory | `packages/opencode/src/tool/read.ts` | Directory branch lists children **after** `ctx.ask({ permission: "read", patterns: path.relative(worktree, filepath) })`. For the folder itself that relative path is `.kilo-runtime-data`. |
| `read` file | same | File contents of `.kilo-runtime-data/gate-c-02r-opacity.txt` already matched `/**` at Gate C retry (deny before content). |
| `glob` | `packages/opencode/src/tool/glob.ts` | Asks permission on the **glob pattern string**, not each hit. Exact-node and `/**` denies cover those pattern names. |

Gate C retry (`SVX-GRA-KILO-02R`, session `ses_ff3cf72e6ffeNe8Js5OemBijcy`) is the runtime proof that descendant file deny held and the exact directory node listed names.

## `kilo_local_recall` classification

| Fact | 7.4.20 evidence |
| --- | --- |
| Tool id | `Tool.define("kilo_local_recall")` in `packages/opencode/src/tool/recall.ts` |
| Search permission | `ctx.ask({ permission: "recall", patterns: ["search"] })` |
| Same-project transcript read | **no** `ctx.ask` unless `session.projectID !== Instance.project.id` |
| `Permission.disabled` key | tool name `kilo_local_recall` (not `read` / `grep` / `codebase_search`) |
| Data | `RecallSearch` / `Session.messages` — session titles and transcripts in the git worktree family |

**NOT A CONTAINMENT GAP** for this pack’s secret-path / runtime-root **filesystem** contract. It does not `read` workspace files or `.kilo-runtime-data/**` through the filesystem tools. Pack does **not** add `recall` / `kilo_local_recall` deny. Remaining uncertainty: same-project transcript read has no permission prompt (session memory, not a filesystem bypass).

## What changed (source)

| Path | Why |
| --- | --- |
| `products/stallvix-kilo-pack/kilo.jsonc` | Exact `.kilo-runtime-data` deny on base+both-agent `read`/`glob` and implementer `edit`/`write`/`apply_patch` (9 maps). Keep `/**` for descendants. |
| `products/stallvix-kilo-pack/AGENTS.md` | Exact-node lesson + `kilo_local_recall` classification |
| `products/stallvix-kilo-pack/README.md` | CORRECT_ONCE-2 proof lesson |
| `products/stallvix-kilo-pack/packets/P2-FULL-TEST-A-CLOSEOUT.md` | Residual: later Gate C must probe the exact node |
| `scripts/stallvix-kilo-pack.test.mjs` | Exact root + child + nested child; matcher proof `/**` misses exact node; no silent recall deny |
| `products/stallvix-kilo-pack/PAYLOAD-MANIFEST.json` | Regenerated after payload edits |
| `products/stallvix-kilo-pack/proof/DS-02-RUNTIME-ROOT-EXACT-2026-08-17.md` | This receipt |

Unchanged on purpose: `run-stallvix-kilo.ps1`, skills, pack.json version, PR #9 branch `audit/svx-gra-ds-02-search-containment`, StallVix PR #77.

## Payload hashes (`5e10897` → this packet)

| File | `5e10897` | This packet |
| --- | --- | --- |
| `kilo.jsonc` | `fb9d623a13144b8e0dc92f3a05a3f625700ef04b16813f34523c8ecaa32c2e80` | `3186c1d9f16448e3bfcd6e69e9cfb2cc377490c06e1679f2990d61d2428954b5` |
| `AGENTS.md` | `3d8db56b4c9f0002232892ffbde2d400e47561bd4270998b76ea4c318461b632` | `a0ac22c9470523510f0e881a62bd1b73662062d2fb6cb04526f24c28cb2cf810` |
| `run-stallvix-kilo.ps1`, `stallvix-authority`, `stallvix-receipt`, `stallvix-safe-change` | unchanged | unchanged |

Manifest regenerated via `scripts/stallvix-kilo-pack-manifest.mjs` (BOM strip + CRLF→LF normalize for hashing only).

## Commands run

| Command | Exit | Result |
| --- ---: | --- |
| `node --test scripts/stallvix-kilo-pack.test.mjs scripts/stallvix-kilo-jsonc.test.mjs scripts/stallvix-kilo-runtime-inventory.test.mjs` | 0 | **26 pass, 0 fail, 1 skip** (Windows symlink `EPERM`). Includes exact-root / child / nested-child, matcher proof that `/**` misses the directory node, and no silent `kilo_local_recall` deny. |
| `git diff --check` | 0 | no whitespace errors on edited pack files |

`npm run lint` / `npm run build` not rerun: this worktree has no full Next.js install; change is pack JSONC/docs/tests only.

## Remaining uncertainty

- Static pack deny is not Gate C runtime proof. Later sequence: GPT audit → consumer re-lock child of PR #77 → narrow runtime regression of the exact node.
- `glob` permission still matches the glob **pattern**, not each hit. A `glob` of `*` from repo root is a separate name-discovery surface; not this packet’s confirmed gap.
- `kilo_local_recall` same-project transcript read remains unprompted.

STOP. Not Gate C. Not consumer re-lock. Not Gate D. Not merge.
