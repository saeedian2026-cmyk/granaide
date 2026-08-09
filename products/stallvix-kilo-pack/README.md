# StallVix Kilo Executor Pack (Granaide product #1)

**Status:** Spike v0  
**Product owner:** Granaide  
**Consumer:** StallVix repo (install separately; no StallVix schema/RLS/deploy changes)

This is Granaide’s first shippable product: a **Kilo Code config pack** that turns Kilo into a **capability-gated Level-C executor** for StallVix work — not StallVix’s brain.

## Architecture lock (from StallVix OBS PR #35)

Source: [StallVix PR #35](https://github.com/saeedian2026-cmyk/StallVix/pull/35) packets 001–003.

| Layer | Owner | Role |
|-------|--------|------|
| Identity / RBAC / project scope / evidence / graph | StallVix | Authority |
| AI READ | OpenRouter + StallVix tools | Low-authority reasoning |
| REPO OPS | GitHub (narrow) | Branch / PR / CI without full shell |
| AGENT WORK (Level C) | **Kilo (this pack)** | Live workspace: shell, tests, iterative edits |

**Do not:** put Supabase service-role in Kilo, treat Kilo as durable memory, or claim PR #35 grants StallVix implementation authority.

**StallVix-embedded control plane** stays parked until ordinary graph population produces real Topic/Workstream/receipt rows. This pack is the **desktop/CLI consumer** path.

## What’s in the pack

| Path | Purpose |
|------|---------|
| [`kilo.jsonc`](./kilo.jsonc) | Agents `stallvix-implementer` + `stallvix-investigator`, Context7 MCP, permission envelopes |
| [`AGENTS.md`](./AGENTS.md) | Distilled StallVix worker contract for Kilo |
| [`skills/`](./skills/) | Agent Skills (Sanity Agent Toolkit packaging pattern) |
| [`INSTALL.md`](./INSTALL.md) | How to install into a StallVix checkout |
| [`PROOF-TEST-A.md`](./PROOF-TEST-A.md) | Packet 001 Test A checklist (read-only) |
| [`proof/`](./proof/) | Captured Test A receipts |

## Agents

1. **`stallvix-implementer`** (primary) — constrained Level-C worker. Edits only allowed paths; denies migrations/auth/deploy/`main`.
2. **`stallvix-investigator`** (subagent) — read-only investigation for Test A and audits.

## Non-goals

- StallVix control-plane backend or embedded Kilo server
- Graph Context Resolver implementation
- Embeddings, autonomous swarms
- Sanity CMS (packaging pattern only)
- Changing StallVix `main`, migrations, auth, RLS, or deploy

## Quick start

See [`INSTALL.md`](./INSTALL.md). Run Test A with [`PROOF-TEST-A.md`](./PROOF-TEST-A.md) before any write-capable job.
