# Work Receipt — PR #12 REPAIR ONCE (`kilo_local_recall` deny)

- `packet_id`: SVX-GRA-CUR-DS-02-KILO-LOCAL-RECALL
- `executor`: Cursor (Grok 4.6)
- `capability_grant`: Granaide source only on existing PR #12. Keep accepted exact-root repair. Deny/strip `kilo_local_recall` for investigator and implementer. No StallVix consumer edit, no authenticated Kilo, no Gate C, no Gate D, no merge. PR #9 not rewritten.
- `branch`: `audit/svx-gra-ds-02-runtime-root-exact`
- `baseline_sha`: `c0cb92620bf7a110b4244540fdc8c95e53c33ce0` (PR #12 exact-root commit)
- `parent_search_sha`: `5e108970b114c00e6d2a0b2027c84a5726050fa2` (PR #9, frozen)
- `ending_sha`: this commit
- `pull_request`: https://github.com/saeedian2026-cmyk/granaide/pull/12 (draft child of PR #9)

## Lifecycle

1. Gate C `SVX-GRA-KILO-02` → `CONTAINMENT_GAP` (`codebase_search` after `grep:deny`; missing ripgrep after auth).
2. Source CORRECT_ONCE — Granaide PR #9 @ `5e10897`.
3. Consumer DS-04R — StallVix PR #77 @ `e80f917`. Not Gate C.
4. Gate C retry `SVX-GRA-KILO-02R` — search PASS; exact `.kilo-runtime-data` directory listing CONFIRMED GAP.
5. PR #12 exact-root repair @ `c0cb926` — directory-node PASS. `kilo_local_recall` wrongly classified NOT A GAP (narrowed to filesystem).
6. **This packet** — REPAIR ONCE: strip `kilo_local_recall`. Exact-root deny unchanged.

## Mechanism (Kilo 7.4.20, not guessed)

| Surface | File | Fact |
| --- | --- | --- |
| Tool id | `packages/opencode/src/tool/recall.ts` | `Tool.define("kilo_local_recall")`. Search `ctx.ask({ permission: "recall" })`. Same-project transcript read **skips** `ctx.ask`. |
| Strip | `packages/opencode/src/permission/index.ts` `disabled()` | Tool name → permission key except `edit`/`write`/`apply_patch`. Strip iff last matching rule `pattern === "*"` and `action === "deny"`. |
| Tools false | `packages/opencode/src/config/config.ts` | `tools.kilo_local_recall: false` converts to permission deny for that tool name. |

`"recall": "deny"` does **not** match `disabled("kilo_local_recall")`. Search-mode ask would be denied, but the tool remains and same-project read still returns transcripts. Therefore this pack does **not** use `recall:deny` as the control.

Fail-closed control: both agents `"kilo_local_recall": "deny"` + root `tools.kilo_local_recall: false`.

Exact-root `.kilo-runtime-data` / `.kilo-runtime-data/**` maps were not changed.

## Tests

Shipped config must strip. Removing the key, setting `allow`/`ask`, or substituting `recall:deny` must not count as stripped.

## Payload hashes (`c0cb926` exact-root → this repair)

| File | Exact-root `c0cb926` | This packet |
| --- | --- | --- |
| `kilo.jsonc` | `3186c1d9f16448e3bfcd6e69e9cfb2cc377490c06e1679f2990d61d2428954b5` | `38f9ff2290f8af6070bd89ccdf820a605a9c892ac78ed100423c53319eb8b69e` |
| `AGENTS.md` | `a0ac22c9470523510f0e881a62bd1b73662062d2fb6cb04526f24c28cb2cf810` | `32f6429545f1f12793d8deeb18458ffae7bdea4b99e492760d8781f216a7f7c4` |
| launcher + 3 skills | unchanged | unchanged |

## Commands

| Command | Exit | Result |
| --- ---: | --- |
| `node --test` pack tests (after manifest regen) | 0 | **26 pass, 0 fail, 1 skip** |

STOP. Not consumer re-lock. Not Gate C. Not Gate D. Not merge.
