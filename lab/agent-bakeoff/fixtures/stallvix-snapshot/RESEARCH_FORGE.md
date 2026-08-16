# STALLVIX RESEARCH FORGE

Status: Process contract  
Purpose: Convert external technical observations into evidence-backed StallVix engineering candidates without allowing research to silently become implementation scope.

## 1. Purpose

The Research Forge handles technical ideas discovered outside the normal StallVix roadmap.

Typical inputs:

- screenshots from technical posts
- articles
- videos or transcripts
- GitHub projects
- engineering discussions
- database/security/performance advice
- UI/UX examples
- DevOps practices
- observations from other StallVix projects

Primary lanes:

1. UI
2. Security
3. Database
4. DevOps
5. Cross-cutting architecture, when an item genuinely spans multiple lanes

The Forge exists because external material may expose something StallVix has missed.

It does not exist to generate speculative work.

## 2. Core Rule

Research and task creation are separate operations.

A Research Forge session may:

- transcribe source material
- identify its technical claim
- verify the claim
- inspect its relevance to StallVix
- compare it against current StallVix architecture
- identify an actual gap
- recommend action or rejection
- classify priority

A Research Forge session MUST NOT:

- create implementation task packets
- modify code
- modify schema
- authorize migrations
- authorize deployment
- silently add work to an active sprint

Research has zero implementation authority.

## 3. Two Explicit Modes

### MODE A — FORGE

Triggered when the owner drops screenshots, copied text, URLs, posts, or technical observations.

Input can be messy.

For every meaningful subject:

1. Transcribe or extract the source claim.
2. Separate the source's claim from factual technical reality.
3. Research the subject using primary/credible technical sources where possible.
4. Compare it against StallVix's actual architecture and current state.
5. Determine whether StallVix already handles it.
6. Identify any genuine deficiency.
7. Recommend what, if anything, should change.
8. Assign a disposition.

Allowed dispositions:

- **NOW** — real current risk or missing professional baseline; candidate for immediate promotion.
- **NEXT** — worthwhile improvement but does not interrupt current work.
- **PARKED** — potentially valuable, but prerequisite/scale/evidence does not justify work yet.
- **REJECTED** — incorrect, irrelevant, premature, duplicated, or unjustified.
- **ALREADY COVERED** — StallVix already has the required mechanism; record the evidence and close.

`NOW` and `NEXT` do not authorize implementation.

They only describe priority if the candidate is later promoted.

### MODE B — PACKET

Triggered only by an explicit command such as:

`PACKETIZE RF-DB-004`

Packet Mode receives one previously promoted Research Forge candidate.

It does not repeat broad research unless a concrete technical uncertainty blocks packet creation.

Its job is to convert the accepted candidate into bounded engineering work.

## 4. Research Record IDs

Every researched subject gets a stable ID.

Format:

`RF-{LANE}-{NNN}`

Examples:

- `RF-DB-001`
- `RF-SEC-003`
- `RF-UI-007`
- `RF-DEVOPS-004`

If one screenshot contains three unrelated technical claims, create three research records.

Do not hide three engineering questions inside one record.

## 5. Forge Research Output

Every research record follows this shape.

### RF-XX-NNN — Title

**Source**

Screenshot, URL, transcript, post, repository, or owner observation.

**Source claim**

A faithful transcription or concise reconstruction of what the source is claiming.

Do not yet judge it.

**Technical reality**

What credible research supports, contradicts, or qualifies.

Separate:

- established facts
- source opinion
- vendor claim
- inference
- uncertain areas

**StallVix current state**

Relevant existing:

- frontend architecture
- Supabase/Postgres behavior
- RLS/security controls
- migrations
- tests
- CI/CD
- Cloudflare deployment
- operational graph
- existing task packets
- Observatory findings
- parked work

Current project truth beats the external source.

**Gap test**

Answer explicitly:

1. Does StallVix actually have this problem?
2. Is the problem present now or only hypothetical at future scale?
3. Is it already covered elsewhere?
4. What evidence demonstrates the gap?
5. What happens if we do nothing?

**Recommendation**

Only recommendations that survive the gap test.

For each recommendation:

- expected value
- scope
- risk
- dependency
- evidence needed
- implementation urgency

**Disposition**

One of:

NOW / NEXT / PARKED / REJECTED / ALREADY COVERED

**Promotion candidate**

YES or NO.

If YES, state exactly one engineering outcome.

Example:

> Ensure frequently repeated project-summary reads have measured latency and query-count baselines before adding Redis or another cache.

Not:

> Improve caching/performance/Redis/search/database architecture.

## 6. Anti-Hype Test

Before promoting an external idea, ask:

- Is the source describing a problem StallVix actually has?
- Is there measured evidence?
- Is this advice intended for a workload much larger than ours?
- Does Postgres/Supabase already solve it?
- Would introducing another service increase operational burden more than performance?
- Can the issue first be measured rather than architected around?
- Is this already present in a current packet, backlog item, SPEC amendment, or Observatory note?

No new technology enters StallVix because an online creator says professional systems use it.

## 7. Promotion Gate

Research becomes eligible for Packet Mode only when all are true:

1. The problem is demonstrated or strongly evidenced.
2. Current StallVix behavior has been checked.
3. Existing work has been checked for duplication.
4. The proposed outcome is bounded.
5. The recommendation survived counterarguments.
6. The item has a NOW or NEXT disposition.
7. The owner explicitly selects it for promotion.

Promotion should create a small promotion record, not implementation.

Example:

`RF-DB-004 → PROMOTED`

Reason:
Repeated project-summary reads deserve query/latency instrumentation.

Authorized outcome:
Measure before selecting caching infrastructure.

Not authorized:
Redis installation.

## 8. Claude Authority Gate

Before repository-modifying execution begins, the promoted candidate is presented to Claude Code.

Claude Code receives:

- research ID
- problem statement
- evidence
- current-state comparison
- proposed outcome
- expected touched surfaces
- known dependencies
- explicit non-goals

Claude Code returns:

- ACCEPT
- ACCEPT WITH CORRECTION
- DEFER
- REJECT
- DUPLICATE / ALREADY COVERED

Only ACCEPT or ACCEPT WITH CORRECTION may proceed to implementation packet execution.

This prevents Observatory work from colliding with the canonical architecture lane.

## 9. Packet Mode

Once accepted, create the actual engineering packet under the existing packet system.

Suggested destination:

`docs/agent-work/packets/`

Packet format should use the existing StallVix allocation pattern:

- current state
- problem
- bounded outcome
- non-goals
- touched surfaces
- acceptance criteria
- proof requirements
- dependencies
- agent capability analysis
- per-agent assignments
- collision boundaries
- boss auditor
- gate sequence
- final Claude Code review

Do not assign several agents to overlapping modification surfaces.

Parallelism is allowed only when paths and responsibilities are independent.

## 10. Execution Lifecycle

The full lifecycle is:

```text
Internet / Screenshot / Observation
            ↓
        FORGE MODE
            ↓
   transcription + research
            ↓
       StallVix gap test
            ↓
NOW / NEXT / PARKED / REJECTED / COVERED
            ↓
       owner promotion
            ↓
    Claude authority gate
            ↓
        PACKET MODE
            ↓
 bounded agent allocation
            ↓
       execution + proof
            ↓
        GPT boss audit
            ↓
      Claude Code review
            ↓
     code review / PR / merge
```

Research never jumps directly to execution.

## 11. Parallel Sprint Rule

Research-derived packets may run beside the primary StallVix roadmap only when:

- they do not modify overlapping surfaces;
- they do not alter live DB/schema without the canonical DB owner;
- they do not invalidate an active packet's assumptions;
- their dependency chain is explicit;
- one modifying owner exists per overlapping surface.

If those conditions are not satisfied, the research item waits.

Parallel work is an optimization, not a right.

## 12. Evidence Standard

A research claim is not accepted because:

- an influencer said it
- an AI repeated it
- a popular company uses it
- a GitHub repository has many stars
- a benchmark lacks comparable workload
- something is described as “best practice”

Implementation recommendations should point to the StallVix condition that makes the recommendation relevant.

Where possible, prefer:

- measured behavior
- repository evidence
- production queries
- real schema inspection
- executable tests
- official documentation
- primary engineering sources

## 13. Preventing Research Backlog Explosion

A Forge session should normally promote no more than three candidates.

Everything else is PARKED, REJECTED, COVERED, or retained as research.

Do not packetize candidates during the same Forge pass.

Do not turn every useful observation into a backlog item.

The Forge is primarily a rejection and filtering machine.

## 14. Chat Operating Commands

The owner may use short commands.

### New research

`FORGE`

Then attach screenshots/text/links.

### Continue research

`FORGE RF-DB-004`

### Promote

`PROMOTE RF-DB-004`

### Create implementation plan

`PACKETIZE RF-DB-004`

### Allocate packet across tools

`ALLOCATE RF-DB-004`

### Review completed packet

`AUDIT RF-DB-004`

These commands keep investigation, decision, packet creation, and execution review visibly separate.

## 15. First Example — Database Caching

Input:

An Instagram post says database-heavy applications need Redis caching to avoid latency.

Forge result should NOT begin with:

> Add Redis to StallVix.

It should investigate:

- StallVix's actual read/query patterns
- query frequency
- query latency
- duplicate reads
- indexes
- Postgres query plans where relevant
- browser/client caching
- Supabase/PostgREST behavior
- data freshness requirements
- expected concurrency
- cache invalidation requirements

A defensible research outcome might be:

> StallVix currently lacks performance instrumentation sufficient to justify an external cache.

That could promote:

`Measure query count and latency on the highest-read operational surfaces.`

Only if those measurements later demonstrate a real cacheable bottleneck should Redis or another caching layer become a separate research candidate.

## 16. Success Condition

The Research Forge succeeds when external ideas make StallVix more professional without turning the project into an accumulation of fashionable infrastructure.

The output of most Forge investigations should be one of:

- “already handled,”
- “not needed yet,”
- “measure this first,”
- “real deficiency — promote this bounded fix.”

Only the last category normally becomes engineering work.