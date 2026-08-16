# StallVix Console operating rules

## Product boundary

StallVix coordinates project graduation evidence. It is not a Jira clone, an autonomous-agent simulation, or a replacement for GitHub, Supabase, Figma, Claude Code, Codex, or Cloudflare.

## Modification ownership

- Only one modifying tool may own overlapping repository or database work at a time.
- Inspect before editing.
- Current owner (2026-07-11): Claude Code, explicitly reassigned by the project owner from Codex.
  Reason: a parallel, redundant scaffold ("Console") was independently started under Claude Code
  before this repo's existence was known; on discovery, ownership was consolidated here rather than
  running two agents against the same product in parallel. See PROJECT_STATUS_REPORT.md's
  "Ownership handoff" section for what was verified at handoff time.
- Never copy Dating App secrets, users, migrations, or deployment configuration into StallVix.
- Dating is metadata and evidence only.
- Authentication, RLS, migrations, Storage, and deployment require independent verification.

## Codex lanes

Three lanes exist for Codex against this repo, and nothing else:

1. **Task branches** — `codex/SVX-XXX`, branched fresh from `origin/main`, per the active
   assignment in `docs/CODEX_TASKS.md` **as it lives on the permanent `codex/inbox` branch** (not
   `main` — Claude Code's `codex-tasking` skill writes new packets there; Codex reads
   `codex/inbox` for its assignment, never `main`). When a task-set is done, Codex opens a draft
   PR with **base `codex/integration`** — a permanent buffer branch — **never `main` directly**.
   `main` is only updated by Claude Code, as an explicit second step, after review.
2. **Observatory** — `codex/observatory`, a single `OBSERVATORY.md` at repo root. Research and
   suggestions only, never merged, never a PR. Zero authority until the owner or Claude Code pulls
   an entry into a task packet in `docs/CODEX_TASKS.md`.
3. **Nothing else.** Codex never commits to `main`, never merges its own PR, on either lane.

**2026-07-14 note:** PR #3 (`codex/SVX-HARNESS-001` → `main`) predates the `codex/inbox` /
`codex/integration` buffer above and was left as-is rather than retargeted; review it normally.
Every packet assigned after 2026-07-14 follows the buffer.

## Delivery harness (work packets)

Every Codex task assigned in `docs/CODEX_TASKS.md` defines, at minimum: `id`, `goal`, `owner`,
`reviewer`, `risk`, `allowed_paths`, `forbidden_paths`, `acceptance`, `proof` (commands to run),
`stop_conditions`. Templates: `docs/agent-work/PACKET_TEMPLATE.md`.

**Receipt contract.** A completed task-set reports: what changed, what didn't, commands run,
evidence paths, remaining uncertainty, commit/PR reference, and any reusable lesson found.
Template: `docs/agent-work/RECEIPT_TEMPLATE.md`.

**Concurrency caps:** one Claude Code decision in flight at a time; max two Codex packets open at
once; max two unreviewed Codex branches outstanding; one writer per subsystem; one repair attempt
before escalating to the owner.

**Forbidden for Codex, always:** `supabase/migrations/**`, auth code, `wrangler.toml`, any deploy
action.

## Evidence standard

A build, URL, screenshot, migration status, or AI statement is not sufficient alone. Significant completion claims must link to evidence and a verification result.

## Scope

Now: Account, Projects, Dating Overview, Flow, Vault, QA, Agents & Skills.

Next: Learnings, People, Commands, Connections, Settings as small useful modules.

Parked: autonomous agents, embedded terminal execution, broad GitHub writes, analytics, RAG, vector search, workflow automation, and multi-tenant organizations.

