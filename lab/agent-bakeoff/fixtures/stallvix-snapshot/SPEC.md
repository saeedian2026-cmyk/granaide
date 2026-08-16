# SPEC — StallVix (AI-Native Product Graduation Console)
**Status: LOCKED r3 — corrected and build-authorized (commit `658bb3c`, 2026-07-12; confirmed live-deployed and demoed to the designer 2026-07-13), amended 2026-07-14 by owner decision (Amendment 2 — categorical readiness; Amendment 3 — gate-verification invariant), amended 2026-07-22 by owner decision (Amendment 4 — chronological phase-trail history), amended 2026-07-24 by owner decision (Amendment 5 — PhaseTrail negative-control QA check deferred, single-user system; Amendment 6 — explicit backend source-state, fail-closed; Amendment 7 — Findings/Readiness §E4/§E7 acceptance audit, resolved same-day), amended 2026-07-27 by owner decision (Amendment 8 — multi-tenant console access roles/grant-model/record-to-console contract, scope item 1, resolved same-day). Original r2 locked 2026-07-12 by owner decision; r3 corrects factual errors r2 shipped with (wrong repo, wrong architecture, stale screen count) discovered when Claude Code inherited repo ownership. See "Corrections in r3" below for what changed, and "Amendment 2"/"Amendment 3"/"Amendment 4"/"Amendment 5"/"Amendment 6"/"Amendment 7"/"Amendment 8" for the post-lock changes.**
Locked from draft r2 · Author lane: Claude Desktop (project chat), corrected by Claude Code · Source inputs: GPT strategy lane (closed), project header v1.0, PROJECT_STATUS_REPORT.md (2026-07-11), owner inputs 2026-07-12 (11-phase list; sign-off; Amendment 1; real findings text; architecture correction), owner input 2026-07-14 (Amendment 2 — categorical readiness; Amendment 3 — gate-verification invariant), owner input 2026-07-22 (Amendment 4 — chronological phase-trail history), owner input 2026-07-24 (Amendment 5 — PhaseTrail negative-control QA check deferred; Amendment 6 — backend source-state; Amendment 7 — Findings/Readiness acceptance audit), owner input 2026-07-27 (Amendment 8 — multi-tenant console access roles, grant model, record-to-console contract)

## Corrections in r3 (owner sign-off required on this section specifically)

r2 was authored without knowledge of StallVix's real, already-built state. Three corrections:

1. **Repo.** r2 says `E:\Plan M\Projects\Cube 10\Console` / `github.com/saeedian2026-cmyk/graduation-console` / branch `master`. That repo is a redundant, superseded scaffold Claude Code built before StallVix's existence was known — it is not, and never was, the canonical repo. **Canonical: `E:\Plan M\Projects\Cube 10\StallVix`, `github.com/saeedian2026-cmyk/StallVix`, branch `main`.**
2. **Architecture — the significant one.** r2 declares this frontend-only/IndexedDB, with "backend of any kind, Supabase (DB/Auth/Storage/RLS/Edge)... authentication and accounts" on the kill list. That is backwards. StallVix is a real, live Supabase-backed application, built by Codex, with ownership reassigned to Claude Code on 2026-07-11: a real Postgres schema (16 tables before this revision, RLS enabled on all of them), real auth (owner's Console Owner grant), a real frontend already wired to it. r2's "Current truth" section describing "zero feature code, zero data model" describes Claude Code's abandoned Console scaffold, not StallVix. **This revision corrects the architecture to: Supabase is the real, permanent backend. IndexedDB/local-only is not the architecture.**
3. **Screen count.** r2 lists seven screens and parks "Agents & Skills" to v0.1 (Open Decision #5). Owner has since locked **Amendment 1**: Agents & Skills ships in MVP as screen 8 (Toolchain + Skills tabs fully working; Agents + Activity tabs as honest empty states; data model ships now to avoid a later migration). r2's Open Decision #5 recommendation is superseded.

Additionally, the findings text r2 deferred (see its page-1 seeding amendment) has since been supplied by the owner in full — the placeholder-seeding language below is superseded by real text (see the seed data delivered alongside this spec).

## Amendment 2 (2026-07-14, owner): categorical readiness taxonomy is the MVP standard

Former Open Decision #2 (the numeric handoff-readiness formula in §G) is resolved by owner
decision, superseding §E7 and §G's original numeric-score language: the **categorical readiness
taxonomy** — one of **Not Ready / Evidence Incomplete / Ready for Verification / Inheritance
Ready**, plus a gap list — **is the MVP readiness output**, not an interim substitute for the
formula. It was built this way on `feat/findings-readiness` (`src/lib/readiness.ts`'s
`deriveReadiness()`) ahead of this amendment; this amendment brings the locked spec text into
agreement with what was built and ships.

The numeric formula (`score = round(100 × verifiedRequiredGates ÷ totalRequiredGates) − 8 per
open Critical − 4 per open High`, previously Open Decision #2) is **PARKED**, not deleted —
**revisit trigger: after the first real project completes a full 11-phase run in the console.**
At that point there will be real completed-pipeline data to validate the formula's weights
against, which does not exist yet (Dating, the only tracked project, is mid-pipeline). Until then,
categorical state is the only console-derived readiness signal; the externally-audited dimensions
(e.g. Dating's 68/45/25) remain a separate, source-labeled panel per §G, never merged with it.

## Amendment 3 (2026-07-14, owner): gate-verification invariant, enforced atomically

Resolves C-001. Supersedes the "≥1 linked evidence record" threshold below (§C's gate rule) and
tightens the plain-language description in §B item 3: a `project_gates` row may transition to
`Verified` only when, checked atomically at transition time, **both** hold:

1. Attached qualifying evidence count (`artifacts` linked directly via `related_gate_id`, or via a
   `qa_checks` row itself linked to the gate, joined through `qa_evidence`) is **≥ the gate's
   `required_evidence_count`** — not merely ≥ 1.
2. No linked Critical or High `findings` row is in a blocking state (`Open`, `Fix In Progress`, or
   `Fixed - Unverified`) — unchanged from §C's existing finding-blocking rule, now cross-checked in
   the same transition.

Enforced by a `BEFORE INSERT OR UPDATE` trigger on `public.project_gates`
(`private.check_gate_verification_invariant()`,
`supabase/migrations/20260714160000_gate_verification_invariant.sql`) — at the data layer, for
every write path (RPC, raw REST update, future code), not only a disabled UI control. The gate
status write and its `project_updates` history row land atomically via
`public.set_gate_status()` (a single transaction; a rejected invariant or a failed history insert
rolls back both, leaving no orphan row). The Flow screen mirrors the same check client-side
(`src/lib/gateInvariant.ts`) to disable the `Verified` option with an honest reason before the
write is even attempted — enforcement is the trigger's job, the UI reflects it.

## Amendment 4 (2026-07-22, owner): Project Overview may render a chronological, expandable phase-trail history

Project Overview (§E2) may render a chronological, expandable phase-trail history, not only the
latest status update. Each node in the trail displays: phase/update type, real timestamp from
`project_updates`, and the snapshot state recorded at that update (status, owner, tool, next
action). This is presentation of already-recorded evidence — no new data collection, no
cross-record linking beyond what a single `project_updates` row already contains (no join to
`artifacts`/`findings`/`qa_checks`). Styling follows the existing semantic CSS system (§H,
Open Decision #1) — no Tailwind, no new component library. Scope: Project Overview only, current
active project row (Dating App) — not all project rows, per the console's single-tracked-project
reality (§A).

## Amendment 5 (2026-07-24, owner; resolved 2026-07-24): PhaseTrail negative-control QA check

Originally deferred citing a single-user system, with revisit trigger "when a second real
authenticated user/account exists." That trigger fired 2026-07-22 (QA account `console_access`
grant, `qa_access_grant_2026-07-22`) and went unnoticed until traced during a later reconciliation.
Revisited and closed same-day: created a disposable authenticated user with **no** `console_access`
row, signed in via the anon key (the app's real client path), and confirmed RLS returns zero rows
from `projects`, `project_updates`, and `findings` for that session — no-grant users see nothing,
across every console table the negative-control check cared about. Test account deleted after the
check. Check is CLOSED, not deferred; no revisit trigger remains open.

## Amendment 6 (2026-07-24, owner): explicit backend source-state, fail-closed

Resolves the honesty gap Observatory's PR#4 QA pass proved (OBSERVATORY.md, 2026-07-22): the shell
badge (src/App.tsx, top-bar "STALLVIX BACKEND · CONNECTED") and the Connections screen's Supabase
row (`configured ? 'Connected' : 'External System'`) both derive "Connected" from whether Supabase
env vars are present, never from a successful read. `useConsoleData` compounds this: state
initializes from `src/data/demo.ts` and is never cleared when `refresh()` fails, so a failed live
read can render demo records under a "Connected" badge and an error banner simultaneously.

Four explicit states, superseding the current binary configured/not-configured badge everywhere
"Connected" or equivalent language appears:

1. **preview** — no session; local/unpersisted data shown, badge reads "LOCAL PREVIEW · NOT
   PERSISTED" (unchanged from current behavior).
2. **loading** — authenticated, first fetch in flight, no prior successful read this session.
   Badge must not claim "Connected." Screens may show a loading affordance, never demo data
   mislabeled as live.
3. **live** — authenticated, most recent refresh() call for that resource succeeded. Badge reads
   "Connected" — the only state permitted to use that word.
4. **failed/stale** — authenticated, most recent refresh() call errored. Two sub-cases, both
   fail-closed: (a) no successful read has ever completed this session → screens show an explicit
   failure state, not demo/seed data; (b) a successful read completed earlier and then failed on
   refresh → screens may keep the last-known-good data, but must label it with an as-of timestamp
   and a stale/error indicator, never bare "Connected."

**Rule:** no screen, badge, or record may display or imply "Connected" while the underlying data
is demo-seeded, never-yet-fetched, or the most recent fetch for it failed. This is the binding
rule — the four labels above are illustrative naming, not contractual; rename at implementation
time if preferred.

**Enforcement:** `useConsoleData` owns one explicit state value per fetched resource (not just
`loading`/`error` booleans as today); the shell badge and Connections screen must both derive from
that same state, not from `backendConfigured` alone. No DB trigger needed — unlike Amendment 3,
this is a client-side presentation contract.

**Scope:** this amendment defines the contract only. Implementation (`useConsoleData` state-shape
change, badge/Connections-screen wiring, tests) is separate task-packet work.

## Amendment 7 (2026-07-24, owner; resolved 2026-07-24): Findings/Readiness §E4/§E7 acceptance audit

Originating request: audit the Findings (§E4) and Readiness & Data (§E7) screens against three
acceptance criteria — RLS surface area, query efficiency assumptions, empty-state UX — before any
further work proceeds on either. Framed initially as reviewing a Codex branch; no such branch
exists (`feat/findings-readiness`, the only candidate, is a confirmed-stale ancestor of `main` with
no unique code — `git merge-base --is-ancestor` verified). Both screens are already fully
implemented and live on `main` (`FindingsPage`/`ReadinessPage`, `src/App.tsx`), so the audit ran
directly against the shipped code and the `findings` RLS migration
(`supabase/migrations/20260712002347_add_findings_table.sql`).

**Scope:** `FindingsPage`, `ReadinessPage`, `useConsoleData` (the shared fetch layer both consume),
`findings` table RLS policies.

**Touched surfaces:** read-only audit; no code changed by this amendment.

**Acceptance criteria and result:**
1. RLS surface — `findings` has select/insert/update/delete policies, all gated on `console_access`,
   matching the console-owner model used elsewhere in the schema. **Pass, no drift.**
2. Query efficiency — `useConsoleData` fetches each table once via a batched `Promise.all`,
   server-filtered by `project_id` where applicable; no N+1 pattern found. **Pass, with one known
   defect** (hardcoded `dating-app` slug / static project id instead of the loaded row's live id —
   already tracked in `BACKLOG.md`'s bug tail, not newly discovered here).
3. Empty-state UX — Findings renders an honest `EmptyState` at zero rows; Readiness's gap list has
   an explicit "none recorded" case. **Pass, no drift.**

**Resolution:** both screens match SPEC §E4/§E7 acceptance intent as already built. No redesign, no
rebuild, no further amendment required for either screen. Remaining rough edges (query hardcoding
above, Title column width, stale as-of date, etc.) are ordinary bug-tail items, not spec gaps —
tracked in `BACKLOG.md`, not reopened here.

## Amendment 8 (2026-07-27, owner sign-off complete): multi-tenant console access, scope item (1) — roles, grant model, record-to-console flow contract

Originating request: BACKLOG.md's PROPOSED "Multi-tenant console access" initiative (named
2026-07-27) — real authenticated login replacing anon-key access, per-account project visibility,
role-gated UI, and an in-console "record to console" trigger for non-technical operators. That
entry lists five scope sub-items and explicitly requires "its own SPEC.md amendment" before any of
it is built. This amendment covers sub-item (1) only: roles, the grant model, and the
record-to-console flow contract, with owner decisions on all ambiguous points. Sub-items (2)-(5) —
auth, RLS, role-gated UI audit, in-console trigger implementation — remain future, separately-
scoped work now unblocked by this amendment's resolution.

**Scope:** SPEC text only. No schema migration, auth code, RLS policy, or UI code is touched by
this amendment. All implementation details belong to sub-items (2)-(5), to be scoped as separate
packets once this amendment is locked.

**1. Roles — RESOLVED (Decision D1, option a)**

Three-role set, drawn from the backlog's own language ("role-gated UI", "granted operator"):

- **owner** — full read/write on every granted project, plus grant/revoke for other accounts.
- **operator** — read/write on gate progress, findings, QA checks, evidence; can trigger
  record-to-console. Cannot grant/revoke access.
- **viewer** — read-only on everything operator can see. Cannot write `project_updates`,
  `findings`, `qa_checks`, `evidence`, or trigger record-to-console.

**2. Grant model — RESOLVED (Decision D2, option b)**

Extends `console_access` with `project_id` and `role` columns, changing its grain from
"account has any access at all" to "account has `role`-level access to `project_id`":

```
console_access  { user_id, project_id, role, granted_at, granted_by }
                  -- role: owner|operator|viewer
                  -- project_id NULL + role='owner' => super-owner, all-projects bypass
                  -- otherwise: one row per (user_id, project_id) grant
```

Keep a console-wide "super-owner" bypass for the current single-owner account (Masoud) via
`project_id IS NULL` meaning "all projects." No backfill migration inventing per-project rows
for the existing owner. New multi-tenant accounts get real per-project `console_access` rows
going forward. RLS policies on every other table filter through this row's `project_id` + `role`
instead of the current console-wide existence check — exact policy rewrite is sub-item (3)'s
work.

**3. In-UI "record-to-console" flow contract — RESOLVED (Decisions D3 & D4)**

A granted **operator** or **owner** can trigger a "Record update" action (visible on Project
Overview screen) to write `project_updates`/`findings`/`evidence` rows directly from the Console
UI, matching the existing `record-to-console` skill's data shape and cardinal rule ("record facts,
never intentions").

- **Writes land immediately, no review step** (Decision D3, option a) — audit trail via
  `granted_by`/`user_id` on the write plus immutable `project_updates` pattern, but no blocking
  approval gate. Matches the feature's stated purpose: non-technical operator completes
  end-to-end without Claude Code as intermediary.
- **Viewer can see `findings` and `evidence` read-only, in full** (Decision D4, option a) — no
  field-level redaction. No precedent in StallVix's model for partial-record visibility; not
  introducing it here.

**4. Confirmation/validation modals** (implementation scope, sub-items 2-5)

Where irreversible or hard-to-undo actions are built, confirmation modals are **required**:

1. **Grant access modal** (owner action, sub-items 2/4) — before creating a new `console_access`
   row, confirm target account, project, and role. Required: wrong grant exposes real project
   data.
2. **Revoke access modal** (owner action) — before deleting/deactivating a `console_access` row,
   confirm which account loses what access. Higher bar than grant.
3. **Role-change modal** (owner action) — changing an existing grant's role (e.g. operator →
   viewer) downgrades capability. Confirm before applying, stating what's lost.
4. **Record-to-console submit modal** (operator/owner action, sub-items 3/5) — REQUIRED per D3
   (immediate write, no review gate). Show final confirm step summarizing exactly what will be
   written (status text, findings with severity, evidence links) before write fires. Only safety
   net between operator and irreversible write. Non-negotiable.
5. **No modal for read/view actions** — read-only, non-destructive actions and navigation need no
   confirm. Per D4, viewers see everything.

**Acceptance criteria for this amendment:**
1. Roles, grant model, and record-to-console contract are specified with owner decisions on all
   ambiguous points (D1-D4).
2. No schema migration, auth code, or UI code touches this document.
3. Confirmation modal requirements above are noted for sub-items (2)-(5) implementation, not
   specified here.
4. Sub-items (2)-(5) can now be scoped as separate task packets, unblocked by this amendment's
   resolution.

**Resolution:** owner sign-off complete (2026-07-27). Amendment locked. Sub-items (2)-(5)
unblocked — each should get its own task packet.

## Amendment 9 (2026-07-28, audit complete, owner sign-off pending): tool registry resolves to "wire up existing schema," not "build new schema"

Originating request: BACKLOG.md's PROPOSED "Tool registry (per-project tool tracking, e.g. Devin)"
entry (tagged 2026-07-28) and Open Decision #8 — raised after a Devin logo was dropped locally
following NailSalon's Devin-backlog work. The entry asked whether tools should become first-class
per-project data with real roles/records instead of static logos, and asked for a mapping-mechanism
recommendation (`artifacts.category`, a dedicated FK, or tags).

**Audit finding — the schema question is already resolved, by code that predates this backlog
entry.** A `tools` table and a `project_tools` join table (`tool_id` FK, `project_id` FK,
`role_in_project`, `outputs_produced`, `assignment`, `is_current_modifier`, `last_used_at`) exist
in the very first migration (`20260711191127_initial_console_schema.sql`) and already hold real
data: 15 tool rows and 8 real `project_tools` rows for `dating-app` (roles like "Repository
implementation and status reporting" for Claude Code, "UI generation and interaction prototyping"
for Figma Make). This is exactly the dedicated-FK-join-table option the backlog entry asked to
evaluate — it does not need to be designed or built, it needs to be **used**.

**The actual gap is a frontend bug, not a missing feature:** `useConsoleData.ts` fetches `tools`
globally (`supabase.from('tools').select('*')`, no project filter) and never queries
`project_tools` at all. `ProjectPage` renders `tools.slice(0, 8)` from that same unfiltered global
list (`App.tsx:371`). Every project's "Project toolchain" panel currently shows the identical 8
tools regardless of which project is open — the per-project role/output data sitting in
`project_tools` is invisible in the UI today. Separately, `nailsalon` and `stallvix` have **zero**
`project_tools` rows despite being active projects, and `tools` has no Devin row despite Devin
being used on NailSalon.

**Scope:** SPEC text only, resolving Open Decision #8. No code, migration, or DB write happens in
this amendment. Establishes the task order for the follow-up session that implements it.

**Resolution (Decision D1 for #8):** No new schema, no new FK design, no new UI surface. Fix the
existing wiring and backfill the existing table. Ranked by dependency and blast radius — do in
this order:

**(a) Query wiring fix — highest priority, unblocks everything else.**
`useConsoleData.ts` must fetch `project_tools` filtered by `project_id` (joined to `tools` for
name/category/logo lookup) and `ProjectPage` must render that per-project list instead of
`tools.slice(0, 8)` off the global table. Bounded, single-file-pair change, `dev-routine` tier.
Without this, backfilling data in (c) has no visible effect — do (a) first so (c)'s results are
checkable.

**(b) Asset placement fix — independent, no dependency on (a) or (c).**
`Assets/qrcode_devin.ai.png` (repo-root staging copy, wrong format) must be converted to a
96×96 padded WebP and placed at `src/assets/tool-logos/devin.webp`, per that directory's own
`README.md` convention, then added to `toolLogoByName` in `App.tsx`. The stray root
`7878778.PNG` is unrelated debris (no code references it) — flag to owner for delete/keep, do not
assume delete. `dev-routine` tier.

**(c) Data backfill — depends on (a) being live to verify, and (b) existing so Devin has a logo
to render.**
Insert a `Devin` row into `tools` (category, capability, connection_state, permission_level per
the existing 15 rows' pattern) and `project_tools` rows for `nailsalon` (Devin plus its other
real, currently-untracked tools). `stallvix`'s own `project_tools` backfill (dogfooding) is
lower priority than `nailsalon`'s real usage data — may be deferred to a later session.
`dev-routine` tier, but requires owner-supplied ground truth for NailSalon's actual tool roles
(don't invent role/output text — pull from the `tes` row `fee2150c` and artifacts
`ce16fbce`/`38362933`/`5c44ce1b`/`79dfbc37`/`8bf265bd` cited in the originating session).

**Acceptance criteria for this amendment:**
1. Open Decision #8 changes from "open, owner sign-off required" to resolved-by-this-amendment,
   pending owner sign-off on the (a)/(b)/(c) order below.
2. No schema migration, UI code, or asset file is touched by this amendment — text only.
3. The three follow-up tasks are ordered, each independently bounded and `dev-routine`-sized (no
   `heavy-executor` spawn needed — no unresolved architecture decision remains).

**Resolution:** audit complete, owner sign-off complete (2026-07-28). Sub-items (a), (b), (c) unblocked — each should get its own task packet.

**Follow-up session (2026-07-28):** (a) and (b) were found already shipped in commit `0232d94`
(the same commit that introduced this amendment's text) — `useConsoleData.ts` already fetches
`project_tools` filtered by `project_id` joined to `tools`, `ProjectPage` already renders
`data.projectTools` instead of the global `tools.slice(0, 8)`, and `devin.webp` already exists at
96×96 in `src/assets/tool-logos/` and is wired into `toolLogoByName`. (c)'s Devin insert (`tools`
row + nailsalon `project_tools` row) was also already live in the DB from a prior session. This
session backfilled nailsalon's five other real, currently-untracked tools into `project_tools`
(Claude Code, GitHub, Supabase, Cloudflare, Figma Make), sourced from NailSalon's own
`PROJECT_STATUS_REPORT.md` and `PROJECT_TECH_AND_TOOLING_LOG.md` — no invented role/output text.
`stallvix`'s own `project_tools` backfill remains deferred, as scoped. Amendment 9 is now fully
implemented; Open Decision #8 is closed.

## Amendment mechanism (2026-07-14, owner — process addition, not a scope change)

This spec grows by numbered amendments (r4, r5, ...). Each amendment states: scope, touched
surfaces, acceptance criteria — one paragraph max. `spec-truth-auditor` verifies built work
against the amended spec, not just the original lock. `BACKLOG.md` is the intake for proposed
work; nothing gets built from `BACKLOG.md`'s PROPOSED section directly — an idea there must
become a numbered amendment here first. Amendments 2 and 3 above predate this mechanism section
and remain valid under it retroactively (same numbering scheme, applied going forward).

---

## A. Current truth

- Repo `E:\Plan M\Projects\Cube 10\StallVix` → `github.com/saeedian2026-cmyk/StallVix` (private), branch `main`. Real, live Supabase-backed application — not a scaffold.
- Supabase project `StallVix_Console`, ref `redacted-project-ref`, `eu-central-1`, `ACTIVE_HEALTHY`. Schema: `projects`, `project_gates`, `project_tools`, `project_updates`, `qa_checks`, `qa_evidence`, `artifacts`, `agents`, `skills`, `tools`, `executions`, `learnings`, `commands`, `connections`, `console_access`, `profiles` — RLS enabled on all, gated on `console_access` (single-owner pattern: `EXISTS (SELECT 1 FROM console_access WHERE user_id = auth.uid())`). A `findings` table (this spec's §F) does not yet exist in the live schema as of r3 — Codex's build tracked only an `open_high_findings` count on `projects`; adding the real register is part of this revision's follow-up work, via a committed migration, not a spec fiction.
- Frontend: React 19, Vite 8, TypeScript, `oxlint`, Vitest, `react-router-dom`, `zod`, hand-rolled CSS (no component library, no Tailwind — matches Open Decision #1's *intent* even though the original recommendation assumed Tailwind).
- Governance rails live: `AGENTS.md` (product boundary, modification ownership, evidence standard — Codex's original convention file, kept), `CLAUDE.md` (Claude Code governance, DB write authority — new in this revision), checkpoint script + SessionStart hook, `update-status-report` skill (adapted for a live backend), lint baseline (0 errors), `DOCS_INDEX.md`, `LEARNING_LOG.md`.
- Ownership: reassigned from Codex to Claude Code, 2026-07-11, recorded in `AGENTS.md`. Two real bugs found and fixed during the handoff verification (a test-breaking shebang, a Windows path-comparison bug that made the local manifest scanner silently no-op) — both caught by re-verifying the prior status report's claims rather than trusting them forward.
- The GPT strategy lane is closed. Its product thinking (kernel, honesty rules, screen architecture, capability-layer intent) is input to this spec; its own Supabase/Cloudflare/Auth implementation direction was abandoned in favor of what Codex actually built.
- Dating App is mid-stabilization elsewhere: phase Bounded Stabilization, 11 open High findings (real text now available — see seed data), readiness 68/45/25 (demo / handoff / production) per independent audit. It is the first dataset for this Console; this Console never touches Dating's repo or database.
- `spec-truth-auditor` subagent: **project-local** (`StallVix/.claude/agents/`, not user-level), to be created from this document once r3 is signed off, before further feature code.
- **Superseded trigger (unchanged from r2):** build is gated on spec lock, not on Dating completing its own stabilization gates. Dating's gate progress becomes data *inside* the Console, not a precondition for it.

## B. One-paragraph product definition

StallVix is a single-user operating console that answers, at all times and for every project in the graduation pipeline: what phase is this project in, what step is active, what's blocked, who or which tool owns the next action, what evidence is missing, how severe are the open findings, and — the question the whole pipeline now ends on — **is this project safe for a professional developer to inherit**. It stores everything in a live Supabase backend (real schema, RLS, single-owner auth), and emits two Markdown artifacts on demand: a Central Brain checkpoint and a developer-handoff document. JSON export/import remains available as a portability/backup escape hatch (§F), not the primary persistence mechanism. It records truth; it does not execute, simulate, or fabricate connections it doesn't have.

## C. Primary user

Masoud, alone, on desktop. Product lead, non-developer, operating multiple AI-built projects through the graduation pipeline. Secondary *audience* (not users): studio leadership viewing over his shoulder or via exported artifacts, and an inheriting developer receiving the handoff export. No collaboration, no multi-tenant org support in MVP — "owner" on any record is a plain text field; `console_access` gates who can write, not a roles system.

## D. Core workflow

1. **Create project** (or import one via JSON). Project gets the pipeline's phase sequence attached as data.
2. **Work happens outside the Console** (Claude Code, Codex, GPT, Figma Make, manual QA). Masoud records it: status updates, gate/step progress, findings, QA checks, evidence records.
3. **Gates are evidence-gated.** A gate can't be marked Verified without at least one linked evidence record; the Console flags assertion-without-evidence instead of accepting it.
4. **Findings register tracks severity** (Critical/High/Medium/Low) with status, fix description, and evidence of closure.
5. **Readiness is always visible** — three externally-audited dimensions plus a derived categorical handoff-readiness state (Amendment 2) with its gap list ("what's missing before a developer can inherit this").
6. **Exports close every loop:** JSON export as backup/portability, Central Brain checkpoint (Markdown) after significant sessions, developer-handoff document (Markdown) when readiness approaches.

Success condition (from header, binding, unchanged): Masoud runs a real project through this end-to-end and gets a **truthful** handoff-readiness answer.

## E. MVP screens

**Eight screens** (Amendment 1 supersedes r2's seven). Every one is populatable with real Dating App material on day one.

1. **Projects** — entry screen. One card per project: name, phase, status, active gate, owner, current tool, open findings by severity, QA state, handoff state, next action. Dating is the first card; honest "Add project" empty state; no fabricated projects.
2. **Project Overview** — summary, phase, status, live URL / repo URL / branch / baseline commit (plain metadata, never fetched), owner, tool, top risks, next action, latest status update, readiness dimensions shown separately (68/45/25 for Dating — never a single blended number as identity). "Update status" action writes an immutable `project_updates` record.
3. **Flow** — the phase dashboard. Ordered phases (§G's 11-phase list), each expanding into gates (`project_gates`) with status, owner+tool assignment, blocker, required-vs-attached evidence count, next action. Dating seeds with its six stabilization gates mapped into the relevant phases; Repository Truth active.
4. **Findings** — severity-tracked register (new `findings` table, §F). Fields: title, severity, status (Open / Fix In Progress / Fixed–Unverified / Closed–Verified / Accepted Risk), description, fix note, related gate, linked evidence. Seeds with Dating's 11 Highs — **real text, supplied by owner**, not placeholders.
5. **QA** — checks (`qa_checks`) with name, type, status, environment, owner, verifier, note, linked evidence (`qa_evidence`). Dating seeds five truthful records: independent forensic audit ✓, two-user realtime chat ✓, live deployment verification ✓, real-phone QA pending, stabilization closure blocked. No invented evidence.
6. **Evidence** — the registry (`artifacts`). Metadata records: title, category, source type, local path or URL, optional checksum, links to finding/gate/QA check, dates. **No binary file storage** — matches r2's recommendation, now enforced by the real schema (`artifacts.storage_path`/`external_url` are metadata pointers, not blobs).
7. **Readiness & Data** — per-dimension external audit readiness (source-labeled, never merged with console state), console-derived categorical readiness state (§G, Amendment 2) with explicit gap list, and the data actions: JSON export, JSON import (schema-version check, merge/replace choice), Central Brain checkpoint export, developer-handoff Markdown export.
8. **Agents & Skills** (Amendment 1, new in r3) — Toolchain and Skills tabs fully working against the real `tools`/`skills` tables. Agents and Activity tabs (`agents`/`executions` tables) ship as honest empty states — data model is live, UI is present, but no seeded content until real agent/execution records exist. This is not a stub of a stub: the tables, RLS, and screen all function; there's simply nothing to show yet, and the screen says so.

**Cut from MVP (unchanged from r2, except Agents & Skills — see above):** Login/Account as a *separate* concept (auth already exists via `console_access`/Supabase Auth, but there's no registration/multi-user flow — single owner only), People (no collaboration), Connections (no connectors — even displaying connection states invites scope creep, though the `connections` table already exists in the live schema from Codex's build and can be surfaced read-only later), Command Center (parked; `commands` table exists but unused in MVP UI), Learnings screen (parked — `LEARNING_LOG.md` covers this need for now; the `learnings` table already exists and can back a screen later without migration).

## F. Data model — real Supabase schema (supersedes r2's IndexedDB `ExportDocument`)

> **Graph semantics live in `docs/architecture/OPERATIONAL-GRAPH.md`** (SR-1). That file is the
> canonical, production-verified statement of the console's nodes, edges, cardinality,
> optionality and enforced invariants. This section states the durable product requirement and
> does not duplicate it; where the two ever disagree about what the graph asserts, the graph
> contract is authoritative and this section is stale.

r2 invented an `ExportDocument`/IndexedDB schema. That was never built. What actually exists is a live Postgres schema with different table names and structure. This section documents *that* schema plus the one addition this revision requires.

**Existing tables (Codex's build, unchanged by this revision):**

```
projects        { id, slug, name, summary, phase, status: project_status,
                  active_gate?, live_url?, canonical_repository_url?, canonical_branch?,
                  stabilization_baseline?, current_owner?, current_tool?,
                  open_high_findings, demo_readiness, handoff_readiness, production_readiness,
                  qa_state?, handoff_state?, top_risks[], next_action?, latest_update?,
                  latest_artifact?, created_at, updated_at }

project_gates   { id, project_id, name, sequence, purpose, status: gate_status,
                  owner?, assigned_tool?, required_evidence_count, blocker?, next_action?,
                  created_at, updated_at }
                  -- gate_status: Not Started|Active|Blocked|Ready for Verification|Verified|Failed|Reopened

project_tools   { project_id, tool_id, role_in_project, assignment?, last_used_at?,
                  is_current_modifier, outputs_produced[] }

project_updates { id, project_id, update_note, phase_snapshot?, status_snapshot?,
                  gate_snapshot?, owner_snapshot?, tool_snapshot?, next_action_snapshot?,
                  author_id?, created_at }   -- immutable

qa_checks       { id, project_id, name, check_type, status: qa_status, environment?, owner?,
                  verifier?, result_note?, executed_at?, retest_state?, related_gate_id?,
                  finding_count, created_at, updated_at }
                  -- qa_status: Not Run|Running|Passed|Passed with Findings|Failed|Blocked|Retest Required

qa_evidence     { qa_check_id, artifact_id, attached_at }   -- join table

artifacts       { id, project_id, title, category, source_type, storage_path?, external_url?,
                  repository_path?, checksum?, original_filename?, mime_type?, size_bytes?,
                  description?, related_gate_id?, related_commit?, last_modified_at?,
                  uploaded_at, created_by? }

tools           { id, name, category, capability, permission_level, cost_category?,
                  state: tool_state, connection_state, notes?, created_at, updated_at }
                  -- tool_state: Active Platform|Used|Available|Evaluating|Planned|Restricted|Retired

skills          { id, name, skill_type, description, source_path, source_type, scope,
                  project_id?, related_tool_id?, version?, maturity_status, expected_output?,
                  source_learning?, last_modified_at?, created_at, updated_at }

agents          { id, name, underlying_tool_id?, purpose, project_id?, allowed_actions[],
                  prohibited_actions[], risk_level, expected_outputs[], status, owner?,
                  latest_recorded_use?, created_at, updated_at }

executions      { id, project_id, tool_id?, agent_id?, task, mode, assigned_by?,
                  modified_code_or_data, outcome?, verification_state?, occurred_at }

learnings       { id, project_id?, lesson, source?, source_finding?, status,
                  promotion_destination?, created_at, updated_at }

commands        { id, name, command_text, explanation, project_id?, risk_level,
                  expected_output?, evidence_expected?, created_at }

connections     { id, name, connection_state, purpose, notes?, updated_at }
                  -- connection_state: Manual|Manual Import|External System|Connected|
                                        Planned Connection|Not Connected|Disabled

console_access  { user_id, granted_at, granted_by }   -- single-owner gate for every RLS policy

profiles        { id, display_name?, email?, role, avatar_url?, created_at, updated_at }
```

**New in r3 — `findings` table** (migration `20260712002347_add_findings_table.sql`, applied and verified 2026-08-01):

```
findings { id, project_id, title, severity: finding_severity, status: finding_status,
           description, fix_note?, related_gate_id?, evidence_ids uuid[], created_at, updated_at }
           -- finding_severity: Critical|High|Medium|Low
           -- finding_status: Open|Fix In Progress|Fixed - Unverified|Closed - Verified|Accepted Risk
```

RLS follows the identical `console_access`-gated four-policy pattern used on every other table (see the migration file for the exact policies).

**Note on r2's `Phase` and `Step` types:** r2 invented a separate `Phase` entity distinct from `Step`/gate. The live schema has no separate `phases` table — `projects.phase` is a plain text field, and `project_gates` (not a separate `steps` table) carries sequence/status/ownership. This revision does not add a `phases` table; the 11-phase list (§G) remains a client-side constant seeded per project via `projects.phase` and `project_gates`, not a normalized table. **Flagged for owner sign-off**: acceptable as-is, or should phases become their own table for future multi-phase-tracking flexibility? Recommendation: leave as-is — a `phases` table adds a join with no current behavior it enables; revisit if a phase ever needs its own metadata beyond a label.

**JSON export/import role, corrected:** with Supabase as the real backend, JSON export/import (§E7) is a **portability and backup feature** — export live Supabase state to a file, import to restore or migrate — not the primary persistence mechanism r2 assumed. **Flagged for owner sign-off**: confirm this framing.

**Derived, never stored (unchanged principle):** handoff-readiness state (Amendment 2), evidence counts, gap lists — always recomputed from live Supabase records so no export or screen can carry stale claims.

## G. Proof-gate logic

- A **gate** is any `project_gates` row with `required_evidence_count > 0`. Its status cannot advance to `Verified` unless attached qualifying evidence (via `artifacts`/`qa_evidence`) meets the gate's `required_evidence_count` **and** no linked Critical/High finding is in a blocking state — see Amendment 3, enforced by a DB trigger, not just the UI. The export marks any historical violation.
- Verification is distinct from completion: `Ready for Verification` → `Verified` is a deliberate second action, recording who/what verified (owner field), honoring the pipeline's "assertion ≠ evidence" rule.
- A Finding of severity Critical or High that references a gate (`related_gate_id`) **blocks that gate's phase** from reaching Done until the finding is `Closed - Verified` or `Accepted Risk` (accepted risk requires a `fix_note`).
- **Handoff-readiness state (derived), Amendment 2 (2026-07-14) — categorical, MVP standard:**
  one of **Not Ready / Evidence Incomplete / Ready for Verification / Inheritance Ready**, derived
  from required-gate verification state and open Critical/High findings (see
  `src/lib/readiness.ts`'s `deriveReadiness()` for the exact branching). `Inheritance Ready`
  requires *all* required gates Verified and zero open Critical/High findings — no numeric score
  is shown anywhere in the console.
  The externally-audited dimensions (Dating's 68/45/25) are stored separately as `projects.
  demo_readiness`/`handoff_readiness`/`production_readiness` (already live columns) — the
  console-derived categorical state and the audit's opinion are displayed side by side, never
  merged. Dating will show `Not Ready` on day one (0 verified gates, 11 open Highs). **That is
  correct behavior**, not a bug.
  The former numeric formula (`score = round(100 × verifiedRequiredGates ÷ totalRequiredGates) −
  8 per open Critical − 4 per open High`) is **PARKED**, not adopted — see Amendment 2 above for
  the revisit trigger.
- Gap list = every unverified required gate + every open Critical/High finding, rendered as the "what's missing before inheritance" panel and embedded in the handoff export.
- **Canonical 11 phases (unchanged from r2):**
  1. Project Intake · 2. Visual and Product Reconstruction · 3. Canonical Repository Truth · 4. Generated Export Cleanup · 5. Architecture and Data Contract · 6. Backend, Auth, and Security · 7. Real Feature Integration · 8. Deployment · 9. Independent QA · 10. Senior Developer Handoff · 11. Pipeline Extraction.
  Not a normalized table (see §F note) — seeded per project as the default `project_gates` sequence.
- **Dating gate→phase mapping (unchanged from r2):** Repository Truth → phase 3; Database Custody, Identity & Demo Boundaries, Product Safety & Privacy → phase 6; Real QA Evidence → phase 9; Developer Handoff → phase 10. Phases 1, 2, 4, 5, 7, 8 seed `Done` with standing note *"completed under the pre-audit, shallow definition of done."* Phases 3, 6, 9, 10 seed per gate state; phase 11 `Not Started`.

## H. Retained design principles

Unchanged from r2 — these are product/visual principles independent of the backend correction:

1. Orchestration routed to existing tools and people — no agent theatre; the Console coordinates, it never pretends to execute.
2. A narrow project evidence graph, not a broad knowledge graph.
3. Deliberate, human-approved lesson promotion.
4. Existing tools as the execution layer.
5. A proactive dashboard.

Plus the inheritance-audit rules (unchanged): inherited elements survive only if they clarify graduation state; no agent theatre; no fabricated precision; distinguish built vs verified, deployed vs production-ready, reported vs evidenced; one modifying owner at a time (now literally enforced by `console_access` RLS, not just convention); the kernel is curated record, not growing chat; direct product language; industrial control-surface visual character (graphite/off-white, one accent, no purple gradients/glowing orbs/robot imagery/glassmorphism) — matches the real `App.css` already built.

## I. Kill / park list (corrected)

**Killed for MVP:** authentication/account *self-service* (registration, multi-user — single owner only, already enforced by `console_access`), collaboration/People, connectors as *active* integrations (the `connections` table exists and may be surfaced read-only, but no live API connections), agent *runtimes* (the `agents` table records agents that exist elsewhere; StallVix does not execute them), billing, RAG/vector/search infra, enterprise anything, embedded terminal, webhooks, messaging bots, multi-tenant org management.

**No longer killed (r2 error, corrected):** ~~backend of any kind, Supabase (DB/Auth/Storage/RLS/Edge), authentication and accounts~~ — Supabase is the real, permanent backend. See `CLAUDE.md` for write-authority rules: Claude Code is sole DB write authority for `StallVix_Console`; Codex's DB lane is closed (frontend/docs only unless the owner says otherwise); every schema change is a committed migration; `parallel-agent-guardrails` conventions are in force given multiple tools (Codex, Figma Make, Lovable) may touch this repo or its connected design surfaces.

**No longer parked (Amendment 1):** ~~Agents & Skills area~~ — MVP screen 8 (§E8).

**Parked with revisit triggers (unchanged otherwise):**
- *Local scanner → manifest import (`stallvix-scan.mjs`)* — compatible with JSON import escape hatch. Trigger: manually creating evidence records proves tedious across ≥2 projects.
- *Learnings/Lessons screen* — trigger: first lesson needs promotion tracking beyond `LEARNING_LOG.md` (table already exists).
- *Binary evidence storage* — trigger: link/path/paste proves insufficient for QA screenshots in real use.
- *Command Center UI* (`commands` table exists, unused) — trigger: repeated command-hunting friction.
- *Deployment of the Console itself* (Cloudflare Pages) — not MVP. Trigger: MVP success condition met and owner wants to show leadership.
- *Cloudflare platform architecture research* and *Vercel/observability stack* — Vision Ledger, unchanged.
- *Connections screen as active integrations* — trigger: a real need to see live connection state, not just record it.

## J. Next three actions (updated for r3)

1. **Owner sign-off on r3's corrections** (repo, architecture, screen count) — this section, "Corrections in r3."
2. **On sign-off:** commit r3 as the locked `SPEC.md`, in the same commit as `CLAUDE.md`'s DB-write-authority rules. Apply the `findings` migration to the live database, verify via direct query (not trust-forward). Create `spec-truth-auditor` in `StallVix/.claude/agents/`, ground-truthed against this locked version.
3. **Seed real data:** Dating project row, six gates mapped per §G, five QA records, the 11 real Findings (owner-supplied text, not placeholders), and verify every seeded row by reading it back from the live database — never assume an insert succeeded from the write call alone.

---

## Open decisions (updated — two resolved by owner, three carried from r2)

| # | Decision | Status | Reasoning |
|---|---|---|---|
| 1 | Component library | **Resolved, as-built**: none — hand-rolled CSS (not Tailwind as r2 assumed, but same "no library" intent) | Already built this way; r2's reasoning (avoid a dependency + design opinion before an inheritance-audit restyle) still holds. |
| 2 | Handoff-readiness output | **Resolved (Amendment 2, 2026-07-14): categorical taxonomy is the MVP standard**, not an interim substitute. Numeric formula PARKED — see Amendment 2. | Built and shipped (`deriveReadiness()`) ahead of the amendment; owner decision brings spec text into agreement. Revisit trigger: first project to complete a full 11-phase run. |
| 3 | Product name on shell | **Resolved: StallVix** | Owner confirmed directly, repeatedly. |
| 4 | Evidence file storage | Unchanged, still owner sign-off required | Metadata + path/link only — matches the real `artifacts` schema. |
| 5 | Agents & Skills timing | **Resolved: MVP screen 8 (Amendment 1)**, supersedes r2's "v0.1" recommendation | Owner's explicit, direct decision in this conversation. |
| 6 | JSON export/import role | **New in r3, owner sign-off required** | Recommendation: portability/backup feature, not primary persistence (Supabase is primary). Flagged in §F. |
| 7 | `phases` as normalized table vs. plain field | **New in r3, owner sign-off required** | Recommendation: leave as plain field on `projects` + `project_gates` sequence (§F note) — no current behavior needs a separate table. |
| 8 | Tool registry: should tools (Claude Code, Codex, Devin, etc.) be first-class, per-project data with real roles/records, not just static logos? | **Resolved by audit (Amendment 9, 2026-07-28), owner sign-off complete**: the FK join table (`tools` + `project_tools`) already exists with real data — this is a frontend wiring + backfill fix, not a new schema/design decision. | Audit found `project_tools` was built in the initial migration but never queried by the frontend, so per-project role data is invisible today. See Amendment 9 for the ordered (a)/(b)/(c) fix plan. |

## Amendment 10 (2026-08-01, owner): structured document intake — Document Type Registry, `BACKLOG.md` parser, and Backlog UI

Originating request: `docs/BACKLOG_DATA_PACKET_ARCHITECTURE.md` (revised 2026-08-01) plus a set of owner decisions about avoiding duplicate backlog promotion, manual artifact classification, and `SPEC.md` feature mapping deferred to a later amendment. This amendment creates the Document Type Registry, defines ten per-project document types, and authorizes the first three implementation packets for `BACKLOG.md` parsing and backlog UI. `SPEC.md` feature-row parsing and feature-to-commit mapping is explicitly out of scope here and will receive its own amendment once the backlog foundation is live.

**Scope:** SPEC text only. No schema migration, parser code, or UI code is touched by this amendment. The implementation packets below are unblocked by this amendment's resolution.

**1. Document Type Registry — RESOLVED**

A project may carry any number of artifacts. A registry maps file patterns and MIME types to document types and default artifact categories. Only two types are parsed into structured project state on promotion: `backlog` and `spec`. All others are stored as plain artifacts and classified by type for display/filtering.

Ten document types, defined in Table A10-1:

| ID | Type | Matching patterns (filename case-insensitive) | Default artifact category | Parsed on promotion |
|---|---|---|---|---|
| D01 | `backlog` | `BACKLOG.md` | Planning Source | **Yes** |
| D02 | `spec` | `SPEC.md` | Specification | **Yes** (deferred to Amendment 11) |
| D03 | `status_report` | `PROJECT_STATUS_REPORT.md`, `STATUS_REPORT.md` | Status Report | No |
| D04 | `decision_log` | `DECISIONS.md`, `DECISION_LOG.md` | Decisions | No |
| D05 | `qa_ledger` | `QA_LEDGER.md`, `QA_LOG.md` | QA Record | No |
| D06 | `learning_log` | `LEARNING_LOG.md` | Learnings | No |
| D07 | `design_reference` | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` | Design Reference | No |
| D08 | `document` | `.pdf`, generic `.md` | Document | No |
| D09 | `data_export` | `.json`, `.csv` | Data Export | No |
| D10 | `evidence_image` | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` | Evidence Image | No |

Notes:
- `backlog` and `spec` matches are by exact filename only; a file named `PROJECT_BACKLOG.md` is classified as `document`, not parsed.
- `design_reference` and `evidence_image` overlap by extension; the Console UI distinguishes them by context/source, but the registry accepts both labels for images. Promotion-time classification defaults to `evidence_image` for images dropped without a design context.
- New types may be added only by a future SPEC amendment; the registry is intentionally closed to runtime extension.

**2. Artifact promotion flow — RESOLVED (no auto-promotion from `record-to-console`)**

`record-to-console` (skill and in-Console trigger) writes the raw file as an `artifacts` row, exactly as it does for commits and deploy URLs. It does **not** call backlog/spec promotion RPCs automatically.

The Console's Artifacts page detects artifacts whose document type is `backlog` or `spec` and renders a **Promote** action. Promotion is a deliberate, one-time user action.

This prevents the duplicate-state problem that would occur if every `record-to-console` run re-imported the same `BACKLOG.md` over prior records. A promotion is idempotent at the data layer via checksum (`backlog_sources.last_packet_checksum`); re-promoting the same file content is a no-op or a snapshot refresh, never a duplicate backlog.

**3. `BACKLOG.md` parsing contract — RESOLVED**

Only a YAML block guarded by `<!-- stallvix:backlog-packet:v1 -->` creates backlog items. Human Markdown prose outside the guard is ignored.

Parsed fields per item: `id`, `title`, `state` (one of the backlog item states below), `priority` (optional), `tags` (optional), `description` (optional), `owner` (optional), `due` (ISO date, optional), `evidence_refs` (array of artifact ids, URLs, or free-text references; optional), `related_gate` (optional free text), `notes` (optional).

Backlog item states (distinct from all existing status enums): `proposed | planned | in_flight | blocked | parked | completed | cancelled | superseded`.

Parser output includes: normalized items, parser warnings, a content checksum, and a small packet excerpt for the database row. Full-byte retention is deferred to a future opt-in policy; the default stores parsed fields plus excerpt only.

Evidence suggestions are suggestions only. The parser may match `evidence_refs` against existing `artifacts` rows by id/title/filename and propose links, but human confirmation is required before any `backlog_item_artifacts` link is written. Unmatched items remain open backlog items, not linked artifacts.

**4. Manual backlog state edits — RESOLVED (full-state edits with divergence warning)**

A Console user with owner or admin role may manually move a backlog item to any backlog state. A divergence warning is shown when the manual state differs from the state in the most recently imported snapshot for that item. The manual state is preserved across future imports unless the user explicitly re-promotes the snapshot and chooses to overwrite manual overrides.

**5. Artifact preview style — RESOLVED (file-type icons, click-to-view, special glow for backlog/spec)**

The Artifacts page shows a list/grid of artifacts with file-type icons. Images, PDFs, and other binaries are opened/downloaded on click; no inline thumbnail preview in this version. `BACKLOG.md` and `SPEC.md` artifacts receive distinct "source document" styling (a subtle glow or badge) to mark them as parseable.

**6. Implementation packets unblocked by this amendment (in dependency order)**

- **Packet A — Document Type Registry + Backlog Parser Foundation:** add `documentTypes.ts` registry, add strict YAML parser for `BACKLOG.md`, add tests/fixtures. No DB changes.
- **Packet B — Schema & RPC for Backlog Promotion:** add tables `project_backlog_sources`, `backlog_snapshots`, `backlog_items`, `backlog_snapshot_items`, `backlog_item_artifacts`; add RPC `import_backlog_snapshot(...)`; add RPC `update_backlog_item_state(...)` for manual edits; add generated types and RLS tests.
- **Packet C — Backlog UI:** add `/projects/:slug/backlog` route; add source-health strip, state frames, item inspector; wire manual state edits with divergence warning.
- **Packet D — Artifact Upload Expansion + Document Preview:** extend accepted artifact uploads to `.pdf`/image formats; show file-type icons; add Promote actions for backlog/spec artifacts; click-to-view/download.
- **Packet E — SPEC.md parser + feature-to-commit mapping:** deferred to Amendment 11. Add parser for `SPEC.md` amendments/sections into feature rows; add `project_spec_features` table + promotion RPC; build UI to map features to `project_updates`/`artifacts`.

**Acceptance criteria for this amendment:**
1. Document Type Registry and ten document types are specified with exact matching rules.
2. Promotion flow is specified as manual from the Console UI, not automatic from `record-to-console`.
3. `BACKLOG.md` parsing contract, backlog item states, and manual-edit rules are specified.
4. Artifact preview style is specified (icons, click-to-view, special styling for backlog/spec).
5. Implementation is split into five ordered packets; only Packets A–C are unblocked by this amendment.

**Resolution:** owner sign-off complete (2026-08-01). Packets A–C unblocked; Packet D may be scoped once C is accepted; Packet E is deferred to Amendment 11.

---

## Amendment 12 (2026-08-09, owner): human workstream create/correct surface

Originating request: `docs/audit/GRAPH-POPULATION-01.md` Stage A shipped the workstream *picker*
(attach an existing `project_workstream` at capture time) but no surface to create one, and
CURRENT_STATE.md tracked this gap as **Blocker 2** — "no SPEC authority for the human workstream
surface." It blocks real use of the picker: a project with zero workstreams has nothing to attach
to, and nothing in the product can create the first one. This amendment is that authority, for the
surface only — it does not reopen Amendment 10's Document Type Registry or touch `knowledge_topics`
creation, which stays office-wide and out of scope here.

**Scope:** SPEC text plus the UI surface it authorizes. No schema migration and no new RPC —
`20260807120000_foundation_data_model_phase1.sql` already carries every column, RLS policy, and
same-project trigger this needs (verified live, not assumed: `project_workstreams` "scoped insert"
and "scoped update" policies already gate on `access_role() = any('super_admin','owner')` +
`project_in_scope()`, matching `permissions.canWriteProjectData` in `src/lib/access.ts` exactly).

**1. Who can create/correct — RESOLVED (reuse existing RLS, no new authority)**

A user with `canWriteProjectData` (role `super_admin` or `owner`, project in scope) may create a
new `project_workstream` for that project, or correct the title, spec reference, or topic
classification of an existing one. This is not a new permission — it is the same boundary the
`project_workstreams` table's RLS has enforced since Phase 1, now given a UI. `admin` and `operator`
remain read-only on workstreams, same as every other project-scoped write surface.

**Operational note, corrected 2026-08-09 (post-deploy same day):** at write time above,
`console_access` had zero `owner`-role grants (super_admin×1, admin×1, owner×0, live-queried
2026-08-09), and separately, Blocker 1 (topic-read bootstrap deadlock) meant even a real owner
would have seen zero topics in the picker for any topic not already linked to a project in their
scope — a chicken-and-egg that made the surface super-admin-only in practice regardless of grants.
Blocker 1 is now **resolved** (`20260809020000_topic_read_owner_scope.sql`,
`docs/audit/BLOCKER-1-TOPIC-READ-BOOTSTRAP.md`): `knowledge_topics`' read policy now also admits
`access_role(...) in ('super_admin','owner')`, closing the deadlock at the policy level. What
remains true: `console_access` still has zero real `owner` rows, so no live account has exercised
this end-to-end yet — that is a grants gap, not a policy gap, and is not this amendment's or
Blocker 1's to fix.

**2. Required fields — RESOLVED**

| Field | Required | Source |
|---|---|---|
| `project_id` | Yes | Fixed to the current project context — never user-selectable, so a workstream cannot be created *into* a project other than the one the surface is open on. |
| `knowledge_topic_id` | Yes | Selected from existing `knowledge_topics` visible to the user under that table's own RLS (`scoped select`). This surface does **not** create topics — Amendment 10 already reserves that as office-wide, super-admin-only. If the picker shows zero topics, the surface says so plainly rather than silently disabling; it does not attempt to work around read visibility. |
| `title` | Yes | Free text, trimmed, 140-char cap — same bound as the capture form's receipt title (`RecordUpdatePanel`'s `eventTitle`), for consistency, not because the two rows share a schema. |
| `spec_reference` | No | Free text. |
| `status` | No (defaults `active`) | Not exposed on create; exposed on correction as the archive action (§4). |
| `owner_id` | No | Set to the creating user's id at creation time. Not user-editable through this surface — no project-member picker is built for it; that is separate scope if ever needed. |

**3. Validation — RESOLVED**

- `title`: non-empty after trim, ≤140 characters — checked client-side before submit, same as
  every other required-text field in this codebase.
- `knowledge_topic_id`: must be a topic the create form actually offered (i.e. one RLS let the user
  read) — the form has no free-text topic entry, only a `<select>`.
- Uniqueness: `(project_id, knowledge_topic_id)` is already a table constraint
  (`project_workstreams_project_id_knowledge_topic_id_key`, confirmed live 2026-08-09). A second
  workstream under the same topic in the same project is rejected with a plain "this project
  already has a workstream for that topic" message — classified from the raw Postgres unique-
  violation text, the same pattern `src/lib/knowledgeLinks.ts` already uses for
  `knowledge_links`' own unique constraint. No new RPC exists to pre-check this; the client-side
  message is a UX convenience over the same DB-enforced guarantee, not a second source of truth.

**4. Relation to `knowledge_topics` vs `project_workstreams` — RESOLVED (no change, restated for
this amendment's own clarity)**

Unchanged from the Phase 1 schema note: `knowledge_topics` is office-wide taxonomy (who may create
one is Amendment 10/RLS territory, untouched here); `project_workstreams` is the project-specific
classification container, always pointing at exactly one topic (`knowledge_topic_id` is `NOT NULL`).
This surface only ever writes the second table. It reads the first, through existing RLS, to
populate the topic `<select>` — it never writes to `knowledge_topics`.

**5. Correction: edit-in-place, not versioned — RESOLVED**

A qualifying user may edit `title`, `spec_reference`, and `knowledge_topic_id` on an existing,
active workstream directly — no history table, no snapshot, no approval step. This matches the
table's own RLS shape (`scoped update`, not an insert-a-new-row-and-supersede pattern) and every
other project-scoped edit surface in this Console (gates, findings, QA checks all edit in place).
Retiring a workstream is done by setting `status = 'archived'` through the same update path — this
is the "correct" mechanism for "this workstream should stop being offered," not a hard delete.
Hard delete stays exactly as restricted as it already is (`scoped delete`, `super_admin` only) and
gets no UI in this amendment — nothing in Blocker 2 or the picker's real-use gap needs it, and
building it would be scope beyond what unblocks Gate 2.

Re-activating an archived workstream (the reverse of §5's archive) is **not** built by this
amendment — out of scope, no requirement surfaced it, and the create path already covers "start a
new one under the same topic" once the old row's slot is freed by uniqueness no longer applying
(archived rows are excluded from the active-only picker query but still hold the unique key, so a
literal same-topic re-create is blocked until the archived row's constraint is addressed — noted as
a known edge case, not fixed here, because no real workstream has been archived yet to make it
concrete).

**Acceptance criteria for this amendment:**
1. A real user with `canWriteProjectData` can create a new `project_workstream` through the UI, and
   it appears correctly scoped to its project — not cross-project, not global.
2. A real user with `canWriteProjectData` can correct title, spec reference, or topic on an
   existing workstream they have access to; access control matches the table's existing RLS exactly
   (no new grant, no bypass).
3. `knowledge_topics` creation is untouched — the surface only reads existing topics through
   existing RLS.
4. No schema migration and no new RPC ship with this amendment — verified against the live table
   and its policies before writing this text, not assumed from an older doc.

**Resolution:** implemented 2026-08-09 on `data-model/qa-path-gap` — direct authenticated
insert/update through the existing `project_workstreams` RLS, same pattern as -02 slice 1's
evidence attachment. See `docs/audit/GRAPH-POPULATION-02-EVIDENCE-ATTACHMENT-SLICE1.md` for the
precedent this follows.

---

## Explicit uncertainties (not smoothed over)

- ~~Repo location~~ — resolved in r3 (StallVix, not Console).
- ~~Architecture (frontend-only vs. Supabase-backed)~~ — resolved in r3 (Supabase is real).
- ~~Agents & Skills timing~~ — resolved (Amendment 1).
- ~~The 11 High findings' text~~ — resolved, owner supplied real text (superseding r2's placeholder-seeding instruction).
- The Dating gate→phase mapping in §G is Claude's inference, not stated by any source — still flagged for sign-off, unchanged from r2.
- JSON export/import's exact role (#6 above) and the `phases`-as-table question (#7 above) are new open items this revision surfaces — not present in r2 because r2 didn't know the real schema.
- Whether Figma Make's or Lovable's generated frontends will themselves connect to `StallVix_Console` (as opposed to just informing visual design) is unknown as of r3 — if either does, `parallel-agent-guardrails` and the DB-write-authority rule in `CLAUDE.md` govern that collision, and it needs the same direct-verification treatment as any other shared-live-state situation.

---

## Operational note: owner lifecycle correction (2026-08-01)

An earlier `promote_to_owner` Edge Function action created an owner outside this project's required
Governance UI invite lifecycle. That path is invalid and must not be reintroduced. Owner grants are
created only through `manage-access` action `invite` with `role='owner'`, which forces
`scope='all_projects'` and clears project memberships. The live access state requires an
owner-authorized super-admin recovery before the first owner grant can be remediated and fully
verified. That recovery completed without granting an owner role; the first compliant owner grant
and its authenticated lifecycle checks remain pending in the Governance UI. This note records an
operational constraint; it is not a spec amendment.
