# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Database write authority

- Claude Code is the ONLY tool that writes to the live Supabase project.
- All schema changes = migration files in supabase/migrations/, committed.
- Codex does not touch the database. Frontend work only.

## Model routing for delegated work

This project follows the user-level model-routing rule (see `~/.claude/CLAUDE.md` and `~/.claude/agents/`). When delegating work via the Agent tool, prefer these subagents over the generic ones:

| Tier | Subagent | Model | Use for |
|---|---|---|---|
| Heaviest | `heavy-executor` | Fable 5 | High-execution work, complex multi-step planning-then-doing, heavy/large-scope tasks |
| Upper-mid | `analyst-planner` | Opus | Architecture/design analysis, non-trivial investigation, plan review |
| Routine | `dev-routine` | Sonnet 5 | Repetitive, ordinary day-to-day programming and deployment tasks |
| Lightest | `quick-answer` | Haiku | Quick questions, simple lookups |

Session discipline (`/clear`/`/compact` cadence, `heavy-executor` budget, Fable expiry window, browser-MCP gating) lives in `~/.claude/CLAUDE.md` — applies here automatically, not duplicated per project.

## Product boundary

Granaide is a low-code platform for creating and deploying AI agents without writing code. Claude Code work in this repo does not authorize:

- Inventing new product features beyond the roadmap
- Creating autonomous agent swarms without human oversight
- Modifying the core database schema without migration files
- Changing the authentication/security model
- Deploying to production without proper testing

## Current roadmap phase

**Phase 1: Foundation (Week 1-2)**
- ✅ Initialize Next.js + TypeScript project
- ✅ Set up Git repository
- ✅ Create observatory lane
- ✅ Design database schema
- ⏳ Set up Supabase
- ⏳ Configure authentication
- ⏳ Create database migrations
- ⏳ Build basic UI shell

Read docs/SCHEMA_DESIGN.md for complete database architecture and docs/DOCS_INDEX.md for project structure.

## Continuity

Continuity system: see docs/DOCS_INDEX.md and OBSERVATORY.md for research lane patterns.

## See also

- AGENTS.md - Agent operating rules (includes Next.js-specific guidance)
- OBSERVATORY.md - Research & suggestions lane
- docs/SCHEMA_DESIGN.md - Database schema design
- docs/DOCS_INDEX.md - Documentation index
- README.md - Project overview and roadmap