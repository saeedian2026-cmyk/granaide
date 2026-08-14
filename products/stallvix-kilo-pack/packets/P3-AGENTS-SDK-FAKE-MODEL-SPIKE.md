# P3 — Agents SDK no-secret falsification spike

Status: **PARKED — RELEASE IN GRANAIDE PHASE 2 ONLY**

Executor after release: Codex or another single modifying owner

Target: isolated Granaide server-only branch

## Release gate

Do not execute until the owner records all of these:

1. Granaide Phase 1 foundation is complete: Supabase project, committed migrations, authentication, RLS tests, and basic UI shell.
2. Phase 2 server-side application-agent experimentation is explicitly authorized.
3. The branch contains no live API key and uses only deterministic synthetic records.
4. The selected `@openai/agents` version and its official TypeScript documentation are pinned in the receipt.
5. One modifying owner controls the touched paths.

This packet does not authorize StallVix embedded agents, browser-side model calls, production tracing, or live Supabase writes.

## Decision under test

Can the OpenAI Agents SDK provide a small server-owned application-agent lane with typed tools, durable approval interruption, tool guardrails, and exactly-once side effects without leaking the SDK or credentials into the browser bundle?

Reject or redesign the lane if any invariant below fails.

## Minimal system

Implement only:

1. A deterministic fake model/test driver that requests known tool calls without network access.
2. `lookup_project` — read-only typed tool over an in-memory fixture.
3. `change_status` — typed test-double mutation tool.
4. A tool guardrail that validates actor, project, allowed transition, and idempotency key.
5. Human approval required for every `change_status` call.
6. A disposable restart-safe persistence adapter with unique constraints on
   idempotency key and receipt key. In-memory counters may report metrics but
   cannot prove exactly-once behavior.

No handoffs, agent teams, web search, MCP, schedules, webhooks, vector retrieval, background runner, or UI is part of this spike.

## Required execution sequence

### S1 — read-only tool

The fake model requests `lookup_project` for one synthetic project. Assert:

- schema validation passes;
- exactly one read occurs;
- no approval interruption is created;
- no mutation record exists.

### S2 — approval interruption

The fake model requests `change_status`. Assert the first run:

- returns an approval interruption;
- serializes/restores the documented run state;
- performs zero side effects before approval.

### S3 — rejection

Reject the interruption and resume. Assert:

- zero side effects;
- final result records rejection without inventing success;
- the same idempotency key remains unused.

### S4 — approval

Repeat from a fresh deterministic state, approve, and resume. Assert:

- guardrail executes before the tool side effect;
- exactly one status transition occurs;
- receipt includes actor, project, from/to status, approval identity, and idempotency key;
- no model prose is treated as evidence of the mutation.

### S5 — duplicate resume

Restart the test process, then resume the already approved state again or
deliver the same idempotency key twice. Also inject a crash after the effect is
durably committed but before receipt acknowledgement. Restart and retry. Assert:

- side-effect count remains exactly one;
- the duplicate is reported explicitly;
- receipt count remains one.
- durable effect and receipt uniqueness survive both process restarts and the
  crash window.

### S6 — guardrail failure

Request an invalid transition and then an unauthorized actor. Assert:

- both fail before execution;
- zero side effects;
- no approval can override the invariant.

### S7 — browser/server boundary

Build the application and inspect browser assets. Assert:

- no API credential literal or environment value is present;
- `@openai/agents` server runtime is absent from the client bundle;
- tools and persistence adapters are imported only from server-only modules.

### S8 — trace policy

Use synthetic/redacted inputs and disable external trace export for this spike. Assert the test output contains no prompt/model text, secret, email, or personal identifier.

## Acceptance matrix

| ID | Requirement |
| --- | --- |
| P3-1 | Read-only tool succeeds with zero mutations |
| P3-2 | First mutation run pauses with zero effects |
| P3-3 | Rejection produces zero effects |
| P3-4 | Approval produces exactly one effect |
| P3-5 | Duplicate resume/idempotency key cannot repeat the effect |
| P3-6 | Guardrail blocks invalid actor/transition before execution |
| P3-7 | Typecheck, lint, tests, and production build pass |
| P3-8 | SDK and credentials are absent from browser assets |
| P3-9 | External trace export is off and evidence is synthetic/redacted |

## Evidence

Return one Work Receipt containing:

- pinned SDK/model-interface version;
- exact commands and exit codes;
- test names/counts;
- side-effect counter after each sequence;
- serialized-state compatibility result;
- browser-bundle inspection result;
- changed paths and diff summary;
- known limitations.

Stop after the falsification result. Passing does not authorize production model traffic or StallVix integration.

If the same blocker repeats on a second attempt, stop, preserve sanitized
evidence, and escalate to the owner before retrying.
