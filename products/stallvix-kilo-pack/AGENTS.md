# StallVix worker contract (Granaide Kilo pack)

Supplement to StallVix `AGENTS.md`. Canonical product rules stay in the StallVix repo. This file is the **Kilo-facing distill** for Granaide’s executor pack.

## Product boundary

StallVix coordinates project graduation evidence. It is not a Jira clone, an autonomous-agent simulation, or a replacement for GitHub, Supabase, Figma, Claude Code, Codex, or Cloudflare.

Kilo (this pack) is a **replaceable Level-C executor**. StallVix remains identity, authorization, evidence, and graph authority.

## Authority files (read in order)

```text
SPEC.md     = what the product is / may become
SCOPE.md    = what may be worked on now (if present)
BACKLOG.md  = candidates later — not authorization
AGENTS.md   = how workers must behave
```

Observatory research (including StallVix PR #35) has **zero** implementation authority until owner/Claude promotes a slice.

## Hard rules

1. One modifying owner at a time. Inspect before edit.
2. Forbidden always for this pack: `supabase/migrations/**`, auth/RLS redesign, `wrangler.toml`, any deploy, push to `main`, secrets/`.env*`, Supabase service-role.
3. Evidence standard: builds/URLs/AI statements alone are not completion. Link commands and results.
4. Emit a Work Receipt after material investigation or implementation (`stallvix-receipt` skill).
5. Stop after two failed attempts on the same blocker; escalate to owner.
6. Prefer smallest complete change. No unrelated cleanup or redesign.

## Capability envelope (default)

Default agent in `kilo.jsonc`: **`stallvix-investigator`** (primary, selectable). Implementer is primary but opt-in.

| Capability | Investigator | Implementer |
|------------|--------------|-------------|
| `read` | allow; sensitive paths hard-deny; `.kilo-runtime-data` and `.kilo-runtime-data/**` deny | allow; same sensitive-path denies; `.kilo-runtime-data` and `.kilo-runtime-data/**` deny |
| `grep` | **deny** (hard) — path denies are not content-safe | **deny** (hard) — same reason |
| `codebase_search` | **deny** (hard) — WarpGrep returns file contents; does not inherit `grep`/`read` | **deny** (hard) — same reason |
| `semantic_search` | **deny** (hard) — returns `codeChunk`; does not inherit `grep`/`read` | **deny** (hard) — same reason |
| `kilo_local_recall` | **deny** (hard) — returns session titles/transcripts; same-project read skips `ctx.ask`; does not inherit `read` | **deny** (hard) — same reason |
| `glob` | may reveal filenames; `.kilo-runtime-data` and `.kilo-runtime-data/**` names are **not** discoverable | same |
| `external_directory` | **deny** except Kilo-managed tool output relocated inside the worktree | same |
| edit | deny | catch-all `ask` first; **no** unconditional `src/**`/`docs/**` allow; authority/evidence/runtime-data/migrations/env/wrangler deny last |
| write / apply_patch | deny | **fail-closed duplicate of `edit`** — Kilo lists these as separate Edit-group tools; public docs do not prove they inherit `edit`. Runtime must still prove binding (ask ≠ deny). |
| bash typecheck/lint/test | deny | ask for five exact verification commands only |
| migration.apply / deploy / `git push` | deny | deny by default-deny shell allowlist |
| db.service_role | deny | deny |

**Tool boundary note:** Kilo’s `read`, `grep`, `glob`, `codebase_search`, `semantic_search`, `kilo_local_recall`, `bash`, `edit`, `write`, `apply_patch`, and `external_directory` are distinct. Denying direct `read` does **not** deny `grep`. Denying `grep` does **not** deny `codebase_search` or `semantic_search`. Denying `.kilo-runtime-data` filesystem `read` does **not** deny `kilo_local_recall`. Denying `edit` does **not**, by documented proof, deny `write` or `apply_patch`. Name discovery via `glob` is not content confidentiality.

**Grep enforcement lesson (KILO-01R / CURSOR-01D):** Kilo 7.4.20 matches `grep` permission patterns against the **search root path**, not each matched file. A parent-directory grep can expose a denied descendant. Both agents therefore hard-deny `grep`.

**Search-tool containment (Gate C CORRECT_ONCE):** Kilo 7.4.20 `codebase_search` (`packages/opencode/src/tool/warpgrep.ts`) asks permission `"codebase_search"` and returns `c.file` + `c.content`. `semantic_search` (`packages/opencode/src/kilocode/tool/semantic-search.ts`) asks `"semantic_search"` and returns `codeChunk`. Neither consults `read` or `grep` denies. `Permission.fromConfig` treats those keys as their own permission names; `Permission.disabled` strips a tool when the last matching rule is pattern `"*"` action `"deny"` (`packages/opencode/src/permission/index.ts`); `LLMRequestPrep.resolveTools` applies that strip (`packages/opencode/src/session/llm/request.ts`). Root `tools.codebase_search` / `tools.semantic_search` `false` converts to the same permission deny (`packages/opencode/src/config/config.ts`). Missing `@vscode/ripgrep-win32-x64` is a WarpGrep runtime failure after permission allowed the call — not a control. Both agents therefore hard-deny both search tools.

**Runtime-root exact node (Gate C CORRECT_ONCE-2):** descendant deny is not directory-node deny. See Runtime-data boundary below.

**Enforcement note:** Kilo evaluates permission patterns in order; **last matching rule wins**. This pack puts `*` first, then path/command exceptions. Do not move the catch-all to the end.

**Kilo-managed output exception:** Kilo appends an allow for its tool-output directory after the agent's external-directory deny. Always launch through `run-stallvix-kilo.ps1`, which sets `XDG_DATA_HOME` to `.kilo-runtime-data` under the current Git worktree. Ignore that directory in Git. A direct `kilo` launch does not meet this pack's outside-worktree claim.

**Runtime-data boundary (DS-01/F3 + Gate C CORRECT_ONCE-2):** `.kilo-runtime-data` (exact directory node) and `.kilo-runtime-data/**` (descendants) are worktree-local Kilo runtime state (tool output, sessions, cache). Agent-facing `read`, `glob`, and implementer `edit`/`write`/`apply_patch` hard-deny **both** so no agent can treat Kilo runtime state as ordinary workspace content. Gate C retry (`SVX-GRA-KILO-02R`) proved descendant file reads deny while `read .kilo-runtime-data` listed child names — Kilo 7.4.20 `Wildcard.match` (`packages/opencode/src/util/wildcard.ts`) turns `*` into `.*`, so `.kilo-runtime-data/**` requires a slash and does not match the folder itself. `read.ts` asks `path.relative(worktree, filepath)` before listing a directory. This policy is fail-closed; the only exceptions are Kilo-internal, added by Kilo after the agent rules, and narrower than the root. A successful launcher test proves the redirect target, **not** that auth/session material is absent — authenticated runtime inventory is a separate gate (operator-only helper `scripts/stallvix-kilo-runtime-inventory.mjs`, synthetic fixtures in DS-02; live run is Gate C), and no real credential may ever be created inside the worktree.

**`kilo_local_recall` containment (PR #12 REPAIR ONCE):** Kilo 7.4.20 `packages/opencode/src/tool/recall.ts` registers `Tool.define("kilo_local_recall")`. Search mode asks permission `"recall"`. Same-project transcript `read` **skips** `ctx.ask` unless `session.projectID` differs. `Permission.disabled` maps this tool to permission key **`kilo_local_recall`**, not `"recall"` (`packages/opencode/src/permission/index.ts`: every tool name except `edit`/`write`/`apply_patch` is its own key; strip iff last matching rule is pattern `"*"` action `"deny"`). Therefore `"recall": "deny"` is **not** the control: the tool stays in inventory and same-project read still returns full transcripts. The pack fail-closes with agent `"kilo_local_recall": "deny"` plus root `tools.kilo_local_recall: false` (same `Config.tools` false → permission deny conversion as the search tools). Runtime-data contract includes **sessions**, not only filesystem paths.

**Authority/evidence immutability (DS-01/F2 + DS-02/S2A):** the implementer has **no** unconditional edit/write/apply_patch allow over `docs/**` or `src/**`. `SPEC.md`, `SCOPE.md`, `BACKLOG.md`, `AGENTS.md`, `CLAUDE.md`, `AGENTS.granaide-kilo.md`, `docs/agent-work/packets/**`, `docs/audit/**`, `.kilo/**`, `.kilo-runtime-data`, `.kilo-runtime-data/**`, `supabase/migrations/**`, `wrangler.toml`, `.env*`, and credentials/pem/key files are explicit hard-denies on `edit`, `write`, and `apply_patch`. A job that legitimately needs write paths must receive an exact job-scoped grant — the shipped base policy never grants one. Static equality of those three maps is a fail-closed contract, not Kilo runtime proof.

**Path-matcher caveat (DS-02/S5):** source tests resolve deep secret paths with a repository helper that treats `*` as spanning nested path text, matching Kilo’s documented wildcard contract. That helper is **source-level regression coverage only**. It is not proof of Kilo 7.4.20 effective permission resolution. Consumer runtime/effective-policy proof after re-lock must include root, one-level, two-level, and three-level secret paths.

**Shell boundary:** implementer bash is deny-by-default. Only exact `npm run typecheck`, `npm run lint`, `npm test`, `git status --short`, and `git diff --check` commands may reach a human approval prompt. Those three npm scripts are the **StallVix consumer** command contract (`package.json` on StallVix), not Granaide source scripts — this repo must not invent `typecheck`/`test` scripts merely to resemble the policy. Unmatched wrappers, deploys, pushes, migrations, and arbitrary commands remain denied. Compound or prefixed variants (`npm run lint && …`, `cmd /c npm run lint`, PowerShell-wrapped commands) never inherit the exact allow decision; the static test matrix covers them, and Kilo runtime proof of that rejection is deferred to Gate C/D (DS-01/F7 — static denial is not runtime proof). This permission layer is still not an operating-system sandbox; use a sanitized dedicated worktree and keep credentials out of it. Reload Kilo after editing project `kilo.jsonc`.

## Sequencing note

Ordinary graph population (Topics / Workstreams / classified receipts) comes **before** StallVix-embedded Kilo/MCP product work. This pack’s desktop/CLI use against the repo does not authorize that embed.
