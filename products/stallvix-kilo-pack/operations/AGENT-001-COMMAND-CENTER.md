# Agent 001 Command Center — Granaide × StallVix Kilo Spike

**Status:** ACTIVE SPIKE  
**Date:** 2026-08-09  
**Product owner:** Masoud / Granaide  
**Chief senior operator:** GPT Plus + Codex (primary operating/review lane)  
**Final integration reviewer:** Claude Code — receives the spike only after the exit gate is met  
**Builders under test:** Cursor (deterministic pack/harness work) + Kilo (runtime agent under proof)

## Mission

Prove Granaide can manufacture a constrained, testable, auditable agent that performs useful work inside a real operating environment.

Agent 001 is the **StallVix Kilo Executor Pack**. StallVix is the consumer/testbed. This spike is also Granaide product work: if the pack can be hardened, installed, executed, constrained, verified, and reused, Granaide has proved the core of an **Agent Pack factory** rather than only a future SaaS UI concept.

This spike runs in a dedicated lane and does not wait for ordinary StallVix feature work. It must not collide with Claude Code's active StallVix implementation paths. Embedded Kilo/graph-agent product work remains a separate future question; local/CLI executor proof is allowed now.

## Operating authority

GPT Plus + Codex acts as **chief senior operator of the spike** until the exit gate:

- owns task sequencing and packet assignment;
- reviews Cursor and Kilo receipts against actual Git/repo evidence;
- rejects fabricated or unproven PASS claims;
- chooses the next spike task within this charter;
- records technical/business findings;
- keeps Granaide and StallVix consumer artifacts synchronized deliberately;
- reports the final evidence bundle to Claude Code only after all required gates pass.

Claude Code remains the final reviewer for any integration that touches Claude-owned StallVix authority (live DB/auth/RLS/deploy or normal production roadmap decisions). Claude is not the day-to-day spike task manager.

## Current truth at takeover

1. Granaide product source exists at `products/stallvix-kilo-pack/` and is merged to Granaide `master`.
2. A consumer copy was merged into StallVix `main` through PR #42.
3. The recorded Test A used a Cursor stand-in because real Kilo was not available; real runtime enforcement remained unverified.
4. PR review found material hardening gaps before real Kilo use:
   - ordered edit rules can let a trailing catch-all weaken specific rules;
   - Bash is broadly `ask` without command-specific hard denies;
   - the investigator is documented as selectable while configured as a subagent;
   - the write-capable implementer is the default agent;
   - the consumer spike status text became stale after merge.
5. The spike proceeds by **forward repair**, not rollback.

## Product thesis under test

Granaide's reusable unit is not a prompt. It is:

```text
business/repo rules
    -> agent identity
    -> capability envelope
    -> skills/playbooks
    -> runtime adapter
    -> proof harness
    -> evidence receipt
```

Kilo is runtime adapter #1, not Granaide's permanent architecture.

## Required exit ladder

### Gate A — Pack hardening

The Granaide source pack has machine-checkable safe defaults and the documentation matches the installed behavior.

### Gate B — Real containment

A real Kilo investigator session proves:

- repository awareness;
- runtime denial of edit and shell probes;
- no secret access;
- streamed output is observable;
- one session can be resumed with state intact;
- structured receipt is produced;
- external Git check shows no agent mutation.

### Gate C — Bounded mutation

A real Kilo implementer changes only an explicitly granted spike-owned path, passes declared verification, and returns a receipt whose changed-path/command claims independently match Git.

### Gate D — Real StallVix value

Agent 001 implements one useful, non-overlapping StallVix addition: a **Repo Context Envelope** utility for future agent jobs. It must deterministically report safe repository context (branch, HEAD, dirty-path summary, authority-doc presence, package scripts/verification entrypoints) without reading secrets or requiring network access.

### Gate E — Headless/operator proof

The same agent pack is exercised through a programmatic Kilo path (`kilo run` and/or `kilo serve` as supported by the installed version), with captured output/session evidence suitable for Granaide operation outside a manual IDE chat.

### Final exit gate

GPT Plus + Codex sends Claude Code one concise final handoff only when A–E are PASS or when a named gate is deliberately killed with evidence. The handoff must include:

- Granaide source commits/PRs;
- StallVix consumer commits/PRs;
- Kilo version/runtime used;
- exact capability configuration tested;
- receipts and independent verification;
- failures encountered and fixes;
- whether Agent Pack #002 can be produced from the same structure without copying StallVix-specific logic into the framework.

## Failure policy

A model following instructions is not proof of a guardrail. Where the runtime can enforce a boundary, test the boundary.

A green command is not proof if the required test never exercised the failure mode. At least one denial/failure path must be observed for each claimed enforcement class.

Do not give Kilo permanent service-role, deploy, or broad GitHub credentials for this spike.

## Task order

Cursor and Kilo have three packets each. Cursor may work ahead only on non-overlapping deterministic artifacts. Kilo packets are strictly gated.

### Cursor

1. `tasks/cursor/CURSOR-01-HARDEN-PACK.md`
2. `tasks/cursor/CURSOR-02-PACK-VERIFIER.md`
3. `tasks/cursor/CURSOR-03-HEADLESS-PROOF-HARNESS.md`

### Kilo

1. `tasks/kilo/KILO-01-REAL-CONTAINMENT.md`
2. `tasks/kilo/KILO-02-BOUNDED-MUTATION-CANARY.md`
3. `tasks/kilo/KILO-03-STALLVIX-CONTEXT-ENVELOPE.md`

## Collision rules

- Cursor owns Granaide pack source/harness files during its packet.
- Kilo never edits its own permission/config files during the runtime proof.
- Kilo's StallVix writes use a dedicated spike branch and packet-owned paths only.
- No auth/RLS/migration/deploy work.
- No UI-overhaul paths unless separately assigned after the spike.
- If an active StallVix writer touches the same path, this spike yields and selects another spike-owned path.

## Business questions the spike must answer

1. Can Granaide turn policy into a working runtime package, not just prose?
2. Can the package fail closed under hostile/accidental instructions?
3. Can another runtime be substituted later without rewriting the business policy model?
4. Can Granaide collect trustworthy proof of what the agent actually did?
5. Is producing Agent Pack #002 materially faster than hand-authoring Agent 001?

The first four validate the engine. The fifth begins validating the business.