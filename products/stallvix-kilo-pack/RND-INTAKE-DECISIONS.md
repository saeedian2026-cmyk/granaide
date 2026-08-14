# R&D intake decisions — three-chat consolidation

Date: 2026-08-14  
Scope: Granaide product #1 and StallVix smartness architecture

## Sources audited

This ledger consolidates the useful evidence from:

1. `Granaide: Kilo in stallvxi` — source/install/activation/containment history and Agent 001 sequencing.
2. `Github repo dump` — code-review-graph, i-have-adhd, Pi, Openship, Docker boilerplate, and Supabase portability/testing candidates.
3. `Repo Tool Intake Lab` — reality gates, candidate levels, bounded falsification, Spark separation, and project-specific intake rules.

Conversation content is research evidence, not implementation authority. Current repository rules, tests, source docs, and owner-approved task packets remain authoritative.

## Reality gate

For this product lane:

- Granaide application: foundation phase; the generic SaaS builder is not authorized here.
- Granaide Kilo pack: canonical repository source with static tests and draft PR evidence.
- StallVix consumer: canonical repository, runnable/tested application, source-locked pack install, and partial authenticated read-only evidence.
- Full Test A: not passed.
- Write-capable Kilo job: not authorized.
- Embedded StallVix agent runtime, vector retrieval, messaging integrations, schedules, and multi-agent UI: parked by current roadmap.

## Maximum-four runtime stack

| Rank | Candidate | Decision | Actual role | Earliest gate |
| ---: | --- | --- | --- | --- |
| 1 | Kilo Code | **Adopt narrowly** | Operator-owned repository worker in a sanitized dedicated worktree | Full Test A, then separate bounded-write Gate C |
| 2 | OpenAI Agents SDK for TypeScript | **Adapt later** | Server-only application reasoning with typed tools, approvals, guardrails, sessions, and tracing | Granaide Phase 2 fake-model spike |
| 3 | Supabase + pgvector | **Use Supabase now; defer vectors** | Authority, RLS, receipts, graph state, and later benchmarked retrieval | Supabase foundation now; retrieval data gate later |
| 4 | Trigger.dev | **Experiment only if earned** | Durable retries, queues, waits, and long-running execution | Phase 3 real-job bakeoff |

These are complementary layers, not four competing agent frameworks.

## Repository and tool candidate slate

| Candidate | Classification | StallVix/Granaide decision | Revisit trigger |
| --- | --- | --- | --- |
| GitHub Actions + Supabase CLI + pgTAP | Clear Finalist, already present | Keep as the canonical disposable database proof lane; counts under Supabase, not a fifth agent | Extend only for a named migration/RLS packet |
| `code-review-graph` | Conditional developer-review tool | Do not add to runtime stack or current PR. Test only on one sufficiently large cross-file PR against targeted `rg`/Git review | A real review where blast-radius uncertainty is costly; tool must reduce time/tokens without missing known impact |
| `i-have-adhd` | Human workflow pattern | Adapt action-first/one-next-step presentation where useful; do not install an always-on hook into product repos | A bounded A/B communication test with no evidence loss |
| Pi coding-agent harness | Park | Overlaps Kilo and the future Agents SDK and lacks the needed built-in boundary | A specific capability neither selected runtime can provide |
| Openship | Park | Requires VPS ownership and adds deployment/incident burden; not free hosting and not StallVix intelligence | A real always-on service plus approved infrastructure budget |
| Delta-V Docker/FastAPI boilerplate | Reject for StallVix | Educational local starter, not a Supabase replacement or production architecture | None unless used in a separate learning project |
| Supabase dump-and-restore drill | Conditional Finalist | Useful portability proof, but separate from this agent pack and subject to database authority | Owner-approved non-production portability packet |
| k6 | Runner-Up | Capacity testing comes after correctness and a safe non-production target | Named latency/capacity question with thresholds |
| `pg_stat_statements` + Supabase Advisors | Remember | Operational diagnosis, not agent architecture | Real query/RLS performance evidence |
| CodeRabbit | Development review gate only | Not a runtime agent; unavailable locally in this lane, so no review result is claimed | Callable CLI/app plus a material implementation diff |
| Telegram / WhatsApp adapters | Park | Channel adapters, not brains; Phase 3+ custom integration/webhook work | Approved messaging use case, privacy model, and server runtime |

## Lessons promoted into the product

1. **Copy is not install.** A consumer needs source lock and activation attestation.
2. **Config is not containment.** Ordered effective policy and adversarial behavior need separate evidence.
3. **One tool deny is not all-tool confidentiality.** Read, grep, shell, external paths, plugins, MCP, and runtime storage are separate surfaces.
4. **Model refusal is not a runtime denial.** Evidence must identify whether the tool was absent, permission-resolved, denied during invocation, or merely declined in text.
5. **Task prose is not a capability grant.** Identity → role → job-specific capability → runtime.
6. **Permissions are not OS isolation.** On Windows, the first product stays read-only and credential-free until a stronger boundary or an explicitly accepted risk model exists.
7. **Reality before architecture.** A tool can be valuable later without becoming the next task now.
8. **One source brain, one installed consumer.** Granaide owns the pack; StallVix proves the exact payload. Operations rails and historical spike leftovers are not copied into the product.

## Counterfactual decision

If none of the additional repositories existed, the correct next action would still be the same: rotate the exposed credential, run the bounded full Test A closeout, and decide whether Kilo earns any write-capable canary. Therefore no additional tool installation outranks that evidence step.

## Next authorized packet

[`packets/P2-FULL-TEST-A-CLOSEOUT.md`](./packets/P2-FULL-TEST-A-CLOSEOUT.md) is the only next runtime packet. It remains blocked until credential rotation is recorded without reproducing the credential.
