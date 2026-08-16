# Work Receipt — Gate C CORRECT_ONCE search containment (source only)

- `packet_id`: SVX-GRA-CUR-DS-02-SEARCH-CONTAINMENT
- `executor`: Cursor (Grok 4.6)
- `capability_grant`: Granaide source only — pack policy/docs/tests/manifest/receipt. No StallVix consumer PR #69, no PR #76, no authenticated Kilo, no Gate C retry, no Gate D, no merge.
- `branch`: `audit/svx-gra-ds-02-search-containment`
- `baseline_sha`: `48340df7eb2d68bcfd344c4c1541dfdfd5e20b9c` (accepted DS-02 source). Parent branch `audit/svx-gra-ds-02-supply-chain` / PR #7 history was not moved or rewritten.
- `ending_sha`: this commit (created after this receipt; contains this receipt)
- `pushed`: yes
- `pull_request`: draft source PR only; STOP before merge

## Required outcome

Investigator and implementer must not have any semantic/codebase search surface capable of returning contents beneath denied paths. Prefer explicit tool-level deny/removal. If Kilo 7.4.20 cannot represent that boundary → STOP `UNREPRESENTABLE_CONTAINMENT`. Do not fake it with missing ripgrep.

**Verdict: REPRESENTABLE.** Applied explicit `codebase_search` / `semantic_search` deny (agent permission) plus root `tools` false (7.4.20 converts to the same permission deny). Not `UNREPRESENTABLE_CONTAINMENT`.

## Kilo 7.4.20 mechanism (source, not guessed)

Pinned CLI: `@kilocode/cli@7.4.20`. Source tag: `Kilo-Org/kilocode` `v7.4.20`. Live schema `https://app.kilo.ai/config.json` `PermissionConfig` named keys plus `additionalProperties: PermissionRuleConfig` — so `codebase_search` and `semantic_search` are valid permission keys.

| Surface | 7.4.20 file | Exact mechanism |
| --- | --- | --- |
| `codebase_search` | `packages/opencode/src/tool/warpgrep.ts` | `Tool.define("codebase_search", …)` then `ctx.ask({ permission: "codebase_search", patterns: [query], always: ["*"] })`. Returns `c.file` + `c.content`. Does **not** consult `read` or `grep`. |
| Registration of WarpGrep | `packages/opencode/src/kilocode/tool/registry.ts` `KiloToolRegistry.extra()` | Tool is appended only if `cfg.experimental?.codebase_search === true`. A global true still registers it even when the pack omits the flag. |
| `semantic_search` | `packages/opencode/src/kilocode/tool/semantic-search.ts` | `Tool.define("semantic_search", …)` then `ctx.ask({ permission: "semantic_search", … })`. Returns `codeChunk`. Loaded when indexing is ready (`semanticTool` in the same registry). Independent of `grep`. |
| Builtin `grep` | `packages/opencode/src/tool/grep.ts` | Separate tool. Permission key `"grep"`. Already denied in DS-02. |
| Config key → rule | `packages/opencode/src/permission/index.ts` `fromConfig()` | Every `permission` object key becomes `{ permission: key, action, pattern }`. |
| Tool-level strip | same file, `disabled()` | Tool is stripped iff last matching rule is `pattern === "*"` and `action === "deny"`. Mapping: `edit`/`write`/`apply_patch` → permission `"edit"`; **every other tool name is its own permission key**. |
| Strip applied | `packages/opencode/src/session/llm/request.ts` `resolveTools()` | `Permission.disabled(Object.keys(input.tools), …)` then filters those ids out of the session tool map. |
| `Config.tools` false | `packages/opencode/src/config/config.ts` | `tools: { codebase_search: false }` converts to `permission.codebase_search = deny` (write/edit/patch map to `edit`). `mergeDeep(perms, result.permission)` — existing permission wins. |

Gate C runtime (`SVX-GRA-KILO-02`) proved `grep: deny` did not contain `codebase_search`: the investigator invoked `codebase_search` against `docs/agent-work/probes`; the call was **not** permission-denied. It failed later on missing `@vscode/ripgrep-win32-x64`. That is a WarpGrep dependency failure after permission allowed the call — not a control.

Default unmatched permission in 7.4.20 is **`ask`**, not deny. Leaving the search tools unnamed is not containment.

`experimental.codebase_search: false` is **not** the sole control. Live `app.kilo.ai/config.json` `Config.experimental` is `additionalProperties: false` and currently omits that flag; 7.4.20 source Schema still has it. A user/global config can set it true and register WarpGrep. Agent-level `"codebase_search": "deny"` / `"semantic_search": "deny"` is the fail-closed key `disabled()` and `ctx.ask` both honor.

Implementer receives the same denies. Mechanical reason: those tools return file contents under denied `read` paths. Same content-leak class as the grep parent-root lesson. Not an optional investigator-only restriction.

## What changed (source)

| Path | Why |
| --- | --- |
| `products/stallvix-kilo-pack/kilo.jsonc` | Root `tools.codebase_search`/`semantic_search` false; both agents `"codebase_search": "deny"` and `"semantic_search": "deny"` |
| `products/stallvix-kilo-pack/AGENTS.md` | Capability table + tool-boundary + Gate C mechanism note |
| `products/stallvix-kilo-pack/README.md` | Agent summary + Gate C proof lesson |
| `products/stallvix-kilo-pack/PRODUCT-BRIEF.md` | Trust contract names the two search tools |
| `products/stallvix-kilo-pack/packets/P2-FULL-TEST-A-CLOSEOUT.md` | T1/T3/A1 + later-retry residual (isolated XDG only; no host `kilo session`/`auth`) |
| `scripts/stallvix-kilo-pack.test.mjs` | Both agents deny both search keys; grep deny ≠ search-tool deny; root `tools` false |
| `products/stallvix-kilo-pack/PAYLOAD-MANIFEST.json` | Regenerated after payload edits |
| `products/stallvix-kilo-pack/proof/DS-02-SEARCH-CONTAINMENT-2026-08-16.md` | This receipt |

Unchanged on purpose: `run-stallvix-kilo.ps1`, skills, pack.json version, consumer PRs, DS-02 branch history.

## Payload hashes (DS-02 `48340df` → this packet)

| File | DS-02 | This packet |
| --- | --- | --- |
| `kilo.jsonc` | `7b231d7d4e9d25a90a4ae75f691ce2abf7d5bdb47c3edeb250a3b5534a69337f` | `fb9d623a13144b8e0dc92f3a05a3f625700ef04b16813f34523c8ecaa32c2e80` |
| `AGENTS.md` | `15d43caab843515bacb35789a6ed2d46f384852b655c2b38b5cff11a5133d440` | `3d8db56b4c9f0002232892ffbde2d400e47561bd4270998b76ea4c318461b632` |
| `run-stallvix-kilo.ps1`, `stallvix-authority`, `stallvix-receipt`, `stallvix-safe-change` | unchanged | unchanged |

`README.md`, `PRODUCT-BRIEF.md`, `packets/P2-FULL-TEST-A-CLOSEOUT.md`, tests, and this receipt are **not** payload-manifest files except as noted. Manifest regenerated via `scripts/stallvix-kilo-pack-manifest.mjs` (BOM strip + CRLF→LF normalize for hashing only).

## Commands run

| Command | Exit | Result |
| --- ---: | --- |
| `npm ci` | 0 | worktree had no `node_modules`; lockfile unchanged |
| `npm run test:stallvix-kilo-pack` | 0 | **24 pass, 0 fail, 1 skip** (Windows symlink `EPERM`). Includes new `Gate C CORRECT_ONCE` regression. |
| `npm run lint` | 0 | eslint clean |
| `npm run build` | 0 | Next.js 16.3.0 compile + TypeScript pass |
| `git diff --check` | 0 | no whitespace errors |

## Remaining uncertainty

- Static pack deny is not Gate C runtime proof. Later sequence: GPT audit → consumer re-lock → exact-head CI → Gate C full retry on this exact source head.
- Whether a later Kilo than 7.4.20 still registers WarpGrep is out of scope; this pack is tested against 7.4.20.
- `write`/`apply_patch` runtime binding remains DS-02 V8 deferred.

## STOP

No consumer PR #69 edit. No PR #76 edit. No authenticated Kilo. No Gate C retry. No Gate D. No merge. No host `kilo session` / `kilo auth` diagnostics.
