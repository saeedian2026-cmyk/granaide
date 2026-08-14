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
| `read` | allow; sensitive paths hard-deny; `.kilo-runtime-data/**` deny | allow; same sensitive-path denies; `.kilo-runtime-data/**` deny |
| `grep` | **deny** (hard) — path denies are not content-safe | **deny** (hard) — same reason |
| `glob` | may reveal filenames; `.kilo-runtime-data/**` names are **not** discoverable | same |
| `external_directory` | **deny** except Kilo-managed tool output relocated inside the worktree | same |
| edit | deny | catch-all `ask` first; **no** unconditional `src/**`/`docs/**` allow; authority/evidence/runtime-data/migrations/env/wrangler deny last |
| bash typecheck/lint/test | deny | ask for five exact verification commands only |
| migration.apply / deploy / `git push` | deny | deny by default-deny shell allowlist |
| db.service_role | deny | deny |

**Tool boundary note:** Kilo’s `read`, `grep`, `glob`, `bash`, `edit`, and `external_directory` are distinct. Denying direct `read` does **not** deny `grep`. Name discovery via `glob` is not content confidentiality.

**Grep enforcement lesson (KILO-01R / CURSOR-01D):** Kilo 7.4.20 matches `grep` permission patterns against the **search root path**, not each matched file. A parent-directory grep can expose a denied descendant. Both agents therefore hard-deny `grep`.

**Enforcement note:** Kilo evaluates permission patterns in order; **last matching rule wins**. This pack puts `*` first, then path/command exceptions. Do not move the catch-all to the end.

**Kilo-managed output exception:** Kilo appends an allow for its tool-output directory after the agent's external-directory deny. Always launch through `run-stallvix-kilo.ps1`, which sets `XDG_DATA_HOME` to `.kilo-runtime-data` under the current Git worktree. Ignore that directory in Git. A direct `kilo` launch does not meet this pack's outside-worktree claim.

**Runtime-data boundary (DS-01/F3):** `.kilo-runtime-data/**` is worktree-local Kilo runtime state (tool output, sessions, cache). Agent-facing `read`, `glob` (and `edit` for the implementer) hard-deny that root so no agent can treat Kilo runtime state as ordinary workspace content. This policy is fail-closed; the only exceptions are Kilo-internal, added by Kilo after the agent rules, and narrower than the root. A successful launcher test proves the redirect target, **not** that auth/session material is absent — authenticated runtime inventory is a separate gate, and no real credential may ever be created inside the worktree.

**Authority/evidence immutability (DS-01/F2):** the implementer has **no** unconditional edit allow over `docs/**` or `src/**`. `SPEC.md`, `SCOPE.md`, `BACKLOG.md`, `AGENTS.md`, `CLAUDE.md`, `AGENTS.granaide-kilo.md`, `docs/agent-work/packets/**`, `docs/audit/**`, `.kilo/**`, `.kilo-runtime-data/**`, `supabase/migrations/**`, `wrangler.toml`, `.env*`, and credentials/pem/key files are explicit edit hard-denies. A job that legitimately needs write paths must receive an exact job-scoped grant — the shipped base policy never grants one.

**Shell boundary:** implementer bash is deny-by-default. Only exact `npm run typecheck`, `npm run lint`, `npm test`, `git status --short`, and `git diff --check` commands may reach a human approval prompt. Unmatched wrappers, deploys, pushes, migrations, and arbitrary commands remain denied. Compound or prefixed variants (`npm run lint && …`, `cmd /c npm run lint`, PowerShell-wrapped commands) never inherit the exact allow decision; the static test matrix covers them, and Kilo runtime proof of that rejection is deferred to Gate C/D (DS-01/F7 — static denial is not runtime proof). This permission layer is still not an operating-system sandbox; use a sanitized dedicated worktree and keep credentials out of it. Reload Kilo after editing project `kilo.jsonc`.

## Sequencing note

Ordinary graph population (Topics / Workstreams / classified receipts) comes **before** StallVix-embedded Kilo/MCP product work. This pack’s desktop/CLI use against the repo does not authorize that embed.
