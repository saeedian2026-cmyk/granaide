# Docs Index

The one map of what every root-level doc is and what class it belongs to. Tempted to write a new
"here's where things are" doc? Update this one instead. Classification follows the
project-continuity one-rule: STATE (one live copy, edited in place), LOG (append-only, one dated
section per event), EPHEMERAL (time-boxed, archived to `docs/history/<year>-<month>/` when
resolved), INDEX (this file).

## STATE (one live copy — regenerate/edit in place)
| File | Purpose |
|---|---|
| AGENTS.md | Governance rules for this repo (product boundary, modification ownership, codex lanes, evidence standard, scope). This repo's equivalent of CLAUDE.md — Codex's naming convention, kept as-is since it's genuinely useful and the ownership-handoff record lives there. |
| CLAUDE.md | Claude Code guidance on top of AGENTS.md: database write authority, scope discipline, model routing for delegated work. |
| README.md | Project description and local setup. |
| DOCS_INDEX.md | This file. |
| PROJECT_STATUS_REPORT.md | Full project snapshot, including the 2026-07-11 ownership handoff and verification notes. Regenerated in place per session. |
| DEV_GUIDE.md | Developer guide (added via PR #12, 2026-08-01). |
| LINT_BASELINE.md | Baseline lint error count convention. Currently zero. |
| docs/SUPABASE_SETUP.md | Supabase project setup notes (pre-existing, from the Codex build). Predates CLAUDE.md's HTTPS-CLI workflow; kept as historical setup reference. |
| SPEC.md | Locked r3 (`658bb3c`, 2026-07-12; status label corrected to LOCKED 2026-07-13) — the product spec, now with an amendment mechanism (2026-07-14) for numbered r4+ changes. Ground truth for `spec-truth-auditor`. |
| BACKLOG.md | Intake for proposed work (PROPOSED / IN FLIGHT / SHIPPED). Nothing builds from PROPOSED directly — must become a numbered SPEC.md amendment first. Added 2026-07-14. |
| RESEARCH_FORGE.md | Process contract for turning external technical observations into evidence-backed candidates — `RF-{LANE}-{NNN}` records, dispositions, the anti-hype test, the promotion gate and the Claude authority gate. Research has zero implementation authority; only the owner promotes. `RF-SRCH-001` (the operator search lane) came through this pipeline. |
| OPENROUTER_INTEGRATION.md | OpenRouter integration documentation (runs, presets, conventions). |
| CONSOLE_OVERHAUL_CONTEXT.md | Reference context for the SVX-AUTH-01 → SVX-PROJECT-IDENTITY-09 packet series. Packets cite this doc for the reasoning behind their rules. |
| .claude/agents/spec-truth-auditor.md | Project-local subagent, ground-truthed against locked SPEC.md. Audits proposed/existing work against spec, flag-and-defer (never blocks). |

## LOG (append-only — one dated section per real event)
| File | Purpose |
|---|---|
| LEARNING_LOG.md | Durable concepts learned, by session. |
| QA_LEDGER.md | QA results and blockers ledger. |
| CLEANUP_LEDGER.md | Append-only record of quarantine runs into `.dumpster/` (see the dumpster-diver skill). |

## EPHEMERAL / still open (check content before archiving)
| File | Purpose |
|---|---|
| OPENROUTER_PRODUCT_CANVAS_QA.md | Completed OpenRouter QA run (2026-07-30) over the full repo. Read-only audit output; archive candidate once superseded. |
| docs/agent-work/packets/SVX-SCOPE-FOUNDATION-01-MASTER.md | Canonical product and execution contract for issue #28: the proposed SPEC/SCOPE/BACKLOG authority model, architectural fit, boundaries, phases, and ownership. Documentation only; not implementation authorization. |
| docs/agent-work/packets/SVX-SCOPE-FOUNDATION-01-CLAUDE-PHASE-0.md | Active read-only Claude Code audit packet. Produces the authority contract, draft scope format, fixtures, and a proceed/narrow/stop recommendation. |
| docs/agent-work/packets/SVX-SCOPE-FOUNDATION-01-CURSOR-PHASE-1.md | Dormant logic-only Cursor packet for parser, validation, typed JSON, task-reference checks, and tests. Requires approved Claude Phase 0 before activation. |
| docs/agent-work/packets/SVX-KNOWLEDGE-HUB-01-MASTER.md | Full product and execution contract for the proposed cross-project Knowledge Hub. Preserves all phases, boundaries, and proof gates; not implementation authorization. |
| docs/agent-work/packets/SVX-KNOWLEDGE-HUB-01-PHASE-0.md | Active next-phase entry. Authorizes repository audit and SPEC-amendment preparation only; no code, migration, live-data, or deployment changes. |
| docs/lanes/SVX-PLATFORM-LANE-01-MASTER.md | Charter for the SVX-PLATFORM lane — scoped to the single owner-promoted candidate `RF-SRCH-001` (operator search): audit of the 2026-08-11 Research Forge intake, per-record dispositions, binding decisions, the open storage question, sequencing, kill conditions. Documentation only; authorizes nothing. |
| docs/lanes/SVX-PLATFORM-LANE-01-BRIEFING.md | Cold-start briefing for Claude Desktop and other AI actors: what the 2026-08-11 GPT research said and concluded (9 records, search architecture verdict), what Claude Code ruled, what the correction pass narrowed, and where the lane stands. Read this first. |
| docs/lanes/SVX-PLATFORM-SEARCH-CONTRACT-01.md | Operator search contract from `RF-SRCH-001`: candidate v1 entity set, one RLS-invoker `search_console` RPC, Postgres-native lexical baseline with the physical storage shape left open to the `SRCH-00B` design gate (no derived store), result shape, security contract, and the measurement triggers that would unpark external/semantic search. |
| docs/lanes/SVX-PLATFORM-LANE-01-PACKETS.md | Broad packet map for the lane — one lineage `SRCH-00` → decision gate → `SRCH-00B` → `SRCH-01` → UX, with scope, non-goals and acceptance shape per packet, traceability to the promoted record, and the parked list. Supersedes the advisory packet series in Observatory PR #50. |
| docs/lanes/SVX-PLATFORM-LANE-01-GATE-A-VERDICT.md | Claude Code's Research Forge §8 authority-gate response to PR #50: `ACCEPT WITH CORRECTION`, with the six corrections (C1 revised, C5/C6 added in the correction pass) and what the verdict does not authorize. |
| docs/BACKLOG-MIGRATION-STRATEGY.md | SVX-BACKLOG-001: how the backlog feature moves from `BACKLOG.md` to project-scoped database state, with verification and recovery gates. Guidance only; authorizes nothing. |
| docs/MIGRATION-STRATEGY-GATE-EVIDENCE-ATTACH.md | SVX-GATE-EVIDENCE-ATTACH-01: rollout and rollback strategy for the verified-gate evidence lock migrations. Renamed from `BACKLOG-MIGRATION-STRATEGY.md`, which two unrelated documents had both claimed. |
| docs/architecture/OPERATIONAL-GRAPH.md | Canonical graph contract (SR-1): nodes, edges, cardinality, optionality and enforced invariants, verified against production. `SPEC.md` §F links here rather than duplicating it. |
| docs/architecture/SCOPE-AUTHZ-SEQUENCING.md | Ratified two-field scope vocabulary (`authz` × `when_seq` + `condition`), and why the third axis (mutation) is deliberately not a column. Spec only; no table exists yet. |
| docs/architecture/AUTHZ-NULL-HANDLING.md | `authz` null/invalid resolves to least access. Explicit carve-out from the classification-field coercion rule. Spec only, written before implementation. |
| docs/architecture/CLASSIFICATION-FIELD-COERCION.md | Identity fields gate (reject or quarantine); classification fields coerce (null-safe, visible). Generalizes verdict §A.12.1. |
| docs/architecture/STATE-VOCABULARY-CONTRADICTIONS.md | Durable contradictions extracted from the retired state-vocabulary census: two `console_access.role` versions, seven "verified" vocabularies, the 41/83 enforcement split, eight Now/Next/Parked lists. |

## Archived
| File | Superseded by | Note |
|---|---|---|
| docs/archive/CLAUDE-CODE-KICKOFF.md | SPEC.md r3 | Targeted the old, pre-consolidation `Console`/`graduation-console` scaffold (frontend-only, IndexedDB-only). Never applied to this repo. Archived 2026-07-13. Deleted 2026-08-07, see git history. |
| docs/history/2026-08/SVX-RECEIPT-TITLE-AUDIT.md | — | Resolved read-only audit (2026-07-30) — contains backfill proposals that were pending owner approval; see the file before re-acting on them. Archived 2026-08-01. |
| docs/history/2026-08/TRUTH_AUDIT_SVX-TRUTH-01.md | — | Completed lineage + de-mocking audit (2026-07-29). Archived 2026-08-01. |
| docs/history/2026-08/TRUTH_AUDIT_SVX-TRUTH-12.md | — | Task packet for the TRUTH-12 session, CLOSED 2026-07-30 (see PROJECT_STATUS_REPORT.md). Archived 2026-08-01. |
| docs/history/2026-08/RECOVERY_CHECKPOINT.md | — | 2026-07-31 recovery snapshot; recovery resolved. Archived 2026-08-01. |
| docs/history/2026-08/NAILSALON_DISCIPLINE_AUDIT.md | — | Resolved read-only audit (2026-07-30). Archived 2026-08-01. |
| docs/history/2026-08/strategynotes.md | — | Dated personal strategy note (2026-07-29), not ported anywhere — owner-private. Archived 2026-08-01. |
| docs/agent-work/handoffs/SVX-PROJECT-STRUCTURE-TREE-01-HANDOFF.md (quarantined to `.dumpster/2026-08-01_duplicate-handoff-fork/`) | SVX-PROJECT-STRUCTURE-TREE-01-HANDOFF-2026-07-31.md | Duplicate fork of the session handoff; the dated completion record (feature shipped, commits listed) is the single live file. Quarantined 2026-08-01. |
| Deployment QA skill (`.claude/skills/stallvix-deployment-qa`) | — | Delivered 2026-08-01 (previously listed under Planned). |
