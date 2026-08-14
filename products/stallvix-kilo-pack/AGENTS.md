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
| `read` | allow; sensitive paths hard-deny | allow; same sensitive-path denies |
| `grep` | **deny** (hard) — path denies are not content-safe | allow; secret roots + filename denies (search-root only) |
| `glob` | may reveal filenames; **not** a content-confidentiality control | same |
| `external_directory` | **deny** (no outside-worktree access) | ask |
| edit `src/**`, `docs/**` | deny | allow; catch-all ask first; migrations/env/wrangler deny last |
| bash typecheck/lint/test | deny | ask |
| migration.apply / deploy / `git push` | deny | deny (runtime bash patterns, not prose only) |
| db.service_role | deny | deny |

**Tool boundary note:** Kilo’s `read`, `grep`, `glob`, `bash`, `edit`, and `external_directory` are distinct. Denying direct `read` does **not** deny `grep`. Name discovery via `glob` is not content confidentiality.

**Grep enforcement lesson (KILO-01R / CURSOR-01D):** Kilo 7.4.20 matches `grep` permission patterns against the **search root path**, not each matched file. A parent-directory grep can still expose `credentials.json` content even when `**/credentials.json: deny` is configured. Investigator therefore hard-denies `grep`.

**Enforcement note:** Kilo evaluates permission patterns in order; **last matching rule wins**. This pack puts `*` first, then path/command exceptions. Do not move the catch-all to the end.

**Windows gap:** bash denies match parsed command patterns. PowerShell aliases, encoded commands, or odd path forms may evade pattern lists — prompts and operator discipline remain defense-in-depth. Reload Kilo after editing project `kilo.jsonc`.

## Sequencing note

Ordinary graph population (Topics / Workstreams / classified receipts) comes **before** StallVix-embedded Kilo/MCP product work. This pack’s desktop/CLI use against the repo does not authorize that embed.
