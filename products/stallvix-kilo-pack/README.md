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
| [`PRODUCT-BRIEF.md`](./PRODUCT-BRIEF.md) | Product contract, success measures, four-tool roadmap, and promotion gates |
| [`PAYLOAD-MANIFEST.json`](./PAYLOAD-MANIFEST.json) | Portable normalized hashes for the install payload |
| [`skills/`](./skills/) | Agent Skills (Sanity Agent Toolkit packaging pattern) |
| [`INSTALL.md`](./INSTALL.md) | How to install into a StallVix checkout |
| [`PROOF-TEST-A.md`](./PROOF-TEST-A.md) | Packet 001 Test A checklist (read-only) |
| [`proof/`](./proof/) | Captured Test A receipts |

## Agents

1. **`stallvix-investigator`** (primary, **default**) — read-only investigation for Test A and audits. `edit`/`bash`/`grep`/`task`/`external_directory` deny; sensitive-path denies on `read`.
2. **`stallvix-implementer`** (primary, opt-in) — constrained Level-C worker. Edits `src/**` / `docs/**`; denies grep, delegation, outside-worktree access, migrations, env, deploy, and push. Shell is deny-by-default with five exact verification commands gated by human approval.

Safe default is investigator. Pick implementer only after Gate B containment PASS (activated + adversarial), not after stand-in Test A or activation attestation alone.

**Proof lesson (KILO-01R → CURSOR-01D):** `read` deny ≠ `grep` deny. Grep permission matches the **search root**, not hit files — path-scoped grep denies leaked the sentinel via a parent-dir search. Both agents now hard-deny `grep`.

## Non-goals

- StallVix control-plane backend or embedded Kilo server
- Graph Context Resolver implementation
- Embeddings, autonomous swarms
- Sanity CMS (packaging pattern only)
- Changing StallVix `main`, migrations, auth, RLS, or deploy

## Quick start

See [`INSTALL.md`](./INSTALL.md). Run Test A with [`PROOF-TEST-A.md`](./PROOF-TEST-A.md) before any write-capable job.
