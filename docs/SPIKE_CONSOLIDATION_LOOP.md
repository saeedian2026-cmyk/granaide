# StallVix-first spike — consolidation loop

**Status:** Operating protocol (authorized to run the loop, not to implement StallVix)  
**Date:** 2026-08-13  
**Owner:** Masoud  
**Players:** Codex (scan/audit) · Cursor (judge / 1/3 build / teach) · Masoud (decide)

This is not Observatory. Observatory is research with zero authority. This file is the **how we work** until the first StallVix agent is a trusted worker, not a pile of tests.

If a later Codex report or Cursor take disagrees with this file, **change this file in a PR** — do not silently grow a second plan.

---

## Mission lock

Granaide’s first real product is **not** the SaaS agent-builder UI.

It is a **working StallVix studio agent**: a factory-made worker that tracks and reports studio work with AI, under StallVix authority.

Shape we already locked, then drifted from:

- StallVix = identity, scope, evidence, graph (the brain)
- Kilo = replaceable Level-C executor (hands), **narrower and deeper**, not omni
- Other tools = **mini-agents**, each one vertical job with depth
- Granaide repo = product/pack source
- StallVix repo = consumer install (mirror of a feature that comes from outside)

Proof of done (whole spike): one narrow StallVix job that runs, leaves a **Work Receipt**, sits in the right repo with a clear install contract, and does not pretend Kilo is StallVix.

Until that exists, more architecture is avoidance.

---

## What this loop is for

| We do | We do not |
|---|---|
| Decision-making on Codex packets | Jump into file edits before a locked decision |
| Coach Codex on the next *one* search/audit | Open eight tools “to be thorough” |
| Cursor does ~1/3 of the real work (code checks, patches, PRs) | Recode the same pack in both repos |
| Teach Cursor + Codex capabilities **on the step that needs them** | Study the skill menu |
| Parallel UI/UX lane into **existing StallVix design system** | Invent a new Granaide visual language |
| Call out drift, redundancy, dreaming | Please the last message |

**Plan mode note:** Cursor “Plan” is a **mode** (Agent / Plan / Ask / Debug), not a skill. If the Plan switch is missing in a Cloud Agent chat, this file *is* the plan. Do not hunt a `plan` skill.

---

## Roles

**Codex** — long scans, stepwise truth, “where we are / what we did / where to go,” extra audit passes we assign, visual/browser QA when the job is look-and-click.

**Cursor (this agent)** — technical judgment, missed sides, one recommended path, ~1/3 implementation after a lock, branch/PR health, one teaching beat per packet, parallel search only when the packet needs it, UI implementation into StallVix’s existing system.

**Masoud** — paste one packet, pick the path, keep one active proof. If the urge is “we should build the system that manages this” while a proof job is waiting, that is procrastination in architecture clothes. Name it and return to the proof.

---

## Packet loop (every Codex paste)

Cursor replies in **this shape only**. No extra essays.

### 0. Paste
One Codex report. Not three. If it is huge, Masoud still pastes it; Cursor will cut it to the decision.

### 1. Take
Agree / disagree / what Codex missed (product, studio ops, ADHD load, two-repo politics — not only code).

### 2. Path
**One** way to go. Then:

- **Codex next (stop here)** — 1–3 more search/ideation/audit steps. Not a new master plan.
- **Codex tools to try** — 1–2 tools/modes to actually click on the next Codex turn (learn + produce, not tourism).

### 3. Cursor teaching (one)
One ability Masoud is not using. How to trigger it. Why this packet needs it. No list.

### 4. Technical zoom
Cursor may do a **narrow** parallel check (one path, one PR, one config). Then:

- patch/fix candidates in Granaide and/or StallVix
- branch health
- what Cursor can do this packet vs later
- one missed **external** tool only if it unblocks the path

### 5. UI/UX split
If the packet touches UI: what Codex does (visual/browser/QA), what Cursor does (design-system implementation, PR-quality UI). Task goes to whoever is better. If the packet has **no UI**, say `UI: idle` and do not open a design side-quest.

**End of packet:** one sentence Masoud does next (almost always: paste Codex step N, or approve one Cursor code check).

---

## Drift alarms (Cursor must fire these)

- **Two-repo recoding** — same agent logic written twice “so it exists in StallVix.” Fix the install contract instead.
- **Omni-agent relapse** — adding jobs to Kilo instead of carving a mini-agent.
- **Factory too early** — Granaide forms, Supabase, auth, marketplace, “agent maker UI” before one trusted StallVix worker.
- **Skill-menu tourism** — opening Cursor/Codex tool lists instead of running the next proof.
- **Receipt-free claims** — “it works” with no command, no Test A/B, no Work Receipt.
- **Planning as the product** — a second strategy doc while Test A is still UNVERIFIED (Kilo missing from PATH is already on record).
- **UI overhaul** — new visual system instead of StallVix’s existing one (StallVix OBS already parked production overhaul).

If two alarms fire in one packet, stop the loop and return to the last proof.

---

## Workstreams (parallel notes, one active proof)

Keep notes in all streams. **Only one is the active proof.**

| ID | Stream | Active proof looks like |
|---|---|---|
| A | Truth | Codex scan accepted or corrected |
| B | Agent shape | Kilo narrower; named mini-agents with one job each |
| C | Two-repo contract | Pack in Granaide → install in StallVix, not a fork |
| D | Proof jobs | Receipt on disk for a real StallVix job |
| E | UI/UX | Screen fits StallVix DS; no new brand |
| F | Literacy | One Codex capability + one Cursor capability used for real |

Default active proof until changed by a packet decision: **D**, fed by **A**.

---

## Codex coaching catalog (assign per packet, do not run as a backlog)

Use this as a **menu for Cursor to pick from**, not a to-do list Masoud must finish.

1. **Inventory of artifacts** — Granaide pack vs StallVix `.kilo` / spike lane vs Cursor chats vs dead tests.
2. **Job map** — what StallVix actually needs (track, report, QA, handoff) vs what Kilo was asked to do.
3. **Split proposal** — Kilo keeps X; mini-agents get Y,Z. Each with a one-line contract.
4. **Two-repo contract audit** — source of truth, copy direction, what must never be duplicated.
5. **Proof gap** — Test A UNVERIFIED items; what Test B should be; what “trusted” means.
6. **Authority / envelope** — permissions too wide, too vague, or already correct.
7. **StallVix DS + IA** — existing components, console patterns, where an agent surface would live.
8. **Branch/PR archaeology** — StallVix PR #35, Granaide PR #1, leftover spike branches.
9. **Kill list** — tests, files, and ideas to freeze so they stop leaking attention.

Each packet: pick **at most three**. Stop.

### Codex capabilities to test on the work (not as homework)

Cursor will name 1–2 per packet from this set. Masoud tries them on the next Codex turn.

| Try | Why it matters here |
|---|---|
| Ask / review vs Agent | Scan and judge without writing files |
| `@` a folder or PR | Force Codex onto one artifact (pack, StallVix PR, receipt) |
| AGENTS.md / skills as law | Same envelope as Kilo pack; stops omni behavior |
| Diff / PR review | Catch two-repo drift on a real change |
| Browser / screenshot QA | UI lane: does the console match StallVix, not a mock |
| Web / repo search | Truth vs memory |
| Plan then wait | Codex should stop at a recommendation the way this loop requires |

If Codex UI labels differ, Masoud names what he sees; Cursor maps it. Do not invent a fake Codex menu.

---

## Cursor curriculum (one beat per packet)

Queue — **do not study ahead**:

1. **Modes** — Agent vs Plan vs Ask. This Cloud chat is Agent; this file replaces Plan.
2. **One-job PRs** — branch → small doc/code → PR. Unit of work, not a chat log.
3. **GitHub as truth** — PRs/issues in Granaide + StallVix beat chat memory.
4. **Cross-repo search** — StallVix is another repo; Tabnine/codebase-search when we must not guess.
5. **Read-only then patch** — Ask/investigate before edit (mirrors `stallvix-investigator` → `implementer`).
6. **UI only when stream E is active** — Magic Patterns / Figma skills stay closed until then.

---

## Technical zoom candidates (frozen until after Codex report 1)

Known from the existing spike, **not** a license to edit now:

- `products/stallvix-kilo-pack/` is v0; Test A receipt says Kilo CLI was **not on PATH**
- Install is a copy into StallVix `.kilo/` — drift is the default failure
- Investigator vs implementer already exists — likely still too horizontal
- Granaide `master` already contains the pack (PR #1 merged)
- Forbidden without explicit owner yes: live DB, auth, RLS, migrations, deploy, StallVix `main`

Cursor help that is in-bounds later: pack/config patches, receipts, branch hygiene, PR text, targeted code review, teaching, UI implementation **after** DS lock.

Out of bounds until asked: StallVix schema, secrets, deploy, “while we’re here” cleanup.

---

## UI/UX lane (parallel, not a new product)

**Constraint:** design into **StallVix’s existing design system**. No Granaide-branded console.

| Better at | Who |
|---|---|
| Long visual audit, click-through, “what looks wrong vs the spec” | Codex (browser/screenshot if available) |
| Map screen → existing StallVix components, PR-quality UI, DS-faithful implementation | Cursor |
| Taste / “does this feel like our studio console” | Masoud, short yes/no |

UI stays **idle** until a packet says the agent has a surface, or Codex report 1 proves a surface already exists in the StallVix spike lane.

---

## Branch health

- This protocol ships on its own PR. Do not pile spike code onto it.
- Later implementation: new branch, one job, PR against `master` (Granaide) and/or a StallVix consumer PR **only with owner yes**.
- One modifying owner on overlapping paths.
- Do not use Observatory for this loop (cannot PR, zero authority).

---

## First move after this PR exists

Masoud pastes **Codex report 1**.

Cursor runs the packet loop. No further planning documents. No spike file edits until the path in that reply says so.
