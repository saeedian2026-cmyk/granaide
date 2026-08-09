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

| Capability | Investigator | Implementer |
|------------|--------------|-------------|
| repo.read | allow | allow |
| edit `src/**`, `docs/**` | deny | allow (ask outside) |
| bash typecheck/lint/test | deny | ask |
| migration.apply / deploy / main.push | deny | deny |
| db.service_role | deny | deny |

## Sequencing note

Ordinary graph population (Topics / Workstreams / classified receipts) comes **before** StallVix-embedded Kilo/MCP product work. This pack’s desktop/CLI use against the repo does not authorize that embed.
