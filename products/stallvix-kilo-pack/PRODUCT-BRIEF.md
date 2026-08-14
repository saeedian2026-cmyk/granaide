# Product brief — Granaide trusted StallVix worker

## Product decision

Granaide product #1 is a versioned, installable **trusted repository worker for StallVix**. It is not the future Granaide SaaS builder and it is not StallVix's embedded brain.

The commercial boundary is:

```text
Granaide owns the reviewed pack source
    → StallVix installs an exact payload
    → a human issues one bounded job
    → Kilo returns a Work Receipt
    → a human reviews before merge or further authority
```

## Customer and problem

The first customer is the StallVix owner/operator: a solo builder who needs useful repository investigation and narrowly scoped implementation without surrendering product authority, credentials, deployment, or database control to an agent.

Current coding agents can be productive, but their prompts, permissions, source version, and evidence are often blended across folders and chats. The product makes those boundaries installable and reviewable.

## Required outcome

A customer can install one source-locked pack into a dedicated sanitized StallVix worktree, run the read-only investigator, and receive a receipt that cites real repository evidence while leaving the worktree unchanged.

The opt-in implementer is present as a future capability but remains unauthorized until an adversarial bounded-write gate passes.

## Trust contract

- `stallvix-investigator` is the default primary agent.
- Investigator denies edit, shell, grep, delegation, and external-directory tools.
- Common secret-bearing reads are denied for root and nested paths.
- Implementer denies grep, delegation, and external-directory access.
- Implementer shell is deny-by-default; only five exact verification commands may ask for human approval.
- Migrations, auth/RLS changes, deploys, pushes, secrets, and live Supabase writes are outside this product's authority.
- Kilo permissions are application guardrails, not an operating-system sandbox. The customer supplies a sanitized dedicated worktree with no credentials.
- Every installed payload is checked against [`PAYLOAD-MANIFEST.json`](./PAYLOAD-MANIFEST.json) after line-ending normalization.

## Evidence and success measures

The candidate is reviewable when all of these are true:

1. Source security regression tests pass, including adversarial path and command cases.
2. The StallVix consumer matches the source-generated manifest on Windows and LF checkouts.
3. Kilo loads the intended investigator as a primary agent.
4. A real read-only session cites StallVix evidence and produces no agent-authored repository mutation.
5. Runtime negative probes, resume evidence, and a sanitized event manifest are captured before calling the full Test A / Gate B passed.
6. No credential value appears in Git, receipts, logs, or PR diffs.

## Non-goals for v0.1

- An embedded Kilo server or public local daemon
- Autonomous multi-agent routing
- StallVix UI, schema, auth, RLS, migration, or deployment work
- Telegram, WhatsApp, schedules, webhooks, search, or vector retrieval
- A generic no-code agent factory

## Four-tool roadmap

| Stage | Tool | Decision and gate |
|---|---|---|
| Phase 1 | Kilo Code | **Adopt narrowly** for the operator-owned repository lane after full Test A negative probes pass. |
| Phase 2 | OpenAI Agents SDK for TypeScript | **Adapt later** for a server-only application agent with typed tools, approvals, guardrails, fake-model tests, and no browser key. |
| Foundation, retrieval later | Supabase + pgvector | **Use Supabase as authority/state now; defer vectors** until real permissioned data and a labelled retrieval benchmark exist. |
| Phase 3+ | Trigger.dev | **Experiment only if needed** for a real durable/long-running job that the Supabase-native path cannot satisfy. |

CodeRabbit remains a development review gate, not a runtime agent. Extra agent frameworks, a second coding agent, integrations, RAG, and multi-agent UI stay parked until their named gates open.

## Promotion gates

- **Gate A — source candidate:** security tests, manifest, lint, build, and independent review pass.
- **Gate B — read-only runtime:** negative tool probes, source-locked install, sanitized durable event evidence, resume proof, and unchanged worktree pass.
- **Gate C — bounded implementer:** one owner-approved canary changes only an allowed test fixture, verification passes, and duplicate/resume behavior creates no extra side effect.
- **Gate D — customer value:** one real StallVix job saves measurable operator effort and its receipt is accepted in review.

No gate automatically authorizes the next one.
