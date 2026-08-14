# P5 — Durable runner bakeoff

Status: **PARKED — PHASE 3+ ONLY**

Candidate: Supabase-native execution versus Trigger.dev

## Release gate

Do not execute until:

1. Phase 3 background/custom-integration work is authorized.
2. One real job needs durability beyond a normal request/response lifecycle.
3. Its maximum duration, retry policy, approval wait, concurrency, payload sensitivity, and cost ceiling are written down.
4. The job can be reproduced with a synthetic side-effect-free adapter.
5. Neither candidate receives production credentials during the bakeoff.

No real need means no runner platform.

## Decision under test

Does Trigger.dev satisfy a real durability/operations requirement that the existing Supabase-native path cannot satisfy reasonably, or materially reduce recovery and operator effort enough to justify another processor and platform?

## Candidates

### A — Supabase-native

Use the smallest currently supported combination of database state, Edge Function or server worker, and existing scheduling/queue primitives appropriate to the authorized phase.

### B — Trigger.dev

Use one pinned SDK/CLI version, one task, one queue, and one environment. No agent framework, schedules, dashboard expansion, or unrelated integrations.

## Synthetic job

The job consumes a synthetic project ID, waits for a simulated approval token, performs one test-double status effect, and writes one receipt keyed by an idempotency key.

The effect adapter exposes a counter so exactly-once behavior is measurable without touching StallVix data.

## Fault matrix

Run the same cases against both candidates:

1. Normal execution.
2. Duplicate delivery with the same idempotency key.
3. Timeout during processing.
4. Worker termination after intent is recorded but before effect.
5. Worker termination after effect but before receipt acknowledgement.
6. Automatic retry.
7. Delayed human approval.
8. Rejected approval.
9. Queue concurrency limit.
10. Redacted error/log path.

## Hard invariants

- Exactly one test-double effect after approved successful execution.
- Exactly one receipt.
- Duplicate/retry/resume cannot repeat the effect.
- Rejection produces zero effects.
- No payload, log, trace, or dashboard field contains a credential or personal datum.
- Every terminal state is queryable and attributable to one source job/idempotency key.
- Cleanup removes all synthetic runs and test state through documented non-production procedures.

## Measurements

- recovery success per injected fault;
- operator steps/time to diagnose and resume;
- execution latency excluding deliberate wait;
- duplicate-effect and duplicate-receipt count;
- observability completeness;
- estimated monthly platform/compute cost at 100, 1,000, and 10,000 representative jobs;
- maintenance, upgrade, privacy, and vendor-lock burden.

## Decision rule

Adopt Trigger.dev only if:

1. Supabase-native fails a named hard requirement, or Trigger.dev materially lowers recovery/operator effort;
2. both candidates preserve all invariants;
3. forecast cost and added processor/privacy burden are explicitly accepted;
4. an exit/rollback path is documented.

Otherwise retain the Supabase-native path and reject Trigger.dev for this job.

## Evidence

Return one comparison receipt with:

- pinned versions and architecture diagrams;
- exact fault-injection commands/tests;
- machine-readable run/effect/receipt counts;
- logs/traces redaction result;
- cost worksheet inputs;
- decision and rejected alternative;
- teardown result.

Passing P5 authorizes one durable execution primitive, not a new reasoning brain, autonomous agent team, or messaging integration.
