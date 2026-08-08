<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Agent operating rules for Granaide repository.

## Product boundary

Granaide is a low-code platform for creating and deploying AI agents without writing code. Agent work in this repo does not authorize:

- Inventing new product features beyond the roadmap
- Creating autonomous agent swarms without human oversight
- Modifying the core database schema without migration files
- Changing the authentication/security model
- Deploying to production without proper testing

For design decisions, treat the roadmap in README.md and schema design in docs/SCHEMA_DESIGN.md as authoritative.

## Modification ownership

- Inspect the live repo state before editing
- Only one modifying owner may touch overlapping paths at a time
- Preserve all worktrees and dirty files unless explicitly assigned
- Database writes require migration files in supabase/migrations/
- Frontend changes must follow the component structure defined in src/app/
- All changes must pass type checking and linting before commit

## Database authority

- Claude Code is the ONLY tool that writes to the live Supabase project
- All schema changes = migration files in supabase/migrations/, committed
- RLS policies must be tested before deployment
- Proprietary data tables have restricted access (system-only writes)

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

## Evidence standard

AI statements, successful builds, or local tests are not enough for completion claims. Significant changes require:

- Command results showing successful execution
- Database verification for schema changes
- Browser evidence for UI changes
- Test results for new features
- Diff review for code changes

## Scope boundaries

Do not implement features beyond the current roadmap phase. The following are explicitly out of scope until Phase 3+:

- Web search integration (Phase 3)
- Scheduled triggers (Phase 3)
- Webhook triggers (Phase 3)
- Custom API integrations (Phase 3)
- Visual builder (Phase 5+)
- Template marketplace (Phase 5+)
- Multi-agent teams (Phase 5+)
- Billing integration (Phase 5+)

## Continuity

Continuity system: see docs/DOCS_INDEX.md and OBSERVATORY.md for research lane patterns.
