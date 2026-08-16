# Backlog

Ideas land here as one line. Nothing gets built from PROPOSED directly — it must become a
numbered SPEC.md amendment first (see SPEC.md's "Amendment mechanism" section).

## SVX-AUTH-01 — CLOSED (2026-07-29)

Role/scope authorization repair (`console_access` role+scope, `project_access`,
`access_invitations`, `manage-access` Edge Function, real `useAccessRole`/`/access` UI) applied
live to `redacted-project-ref` and verified via read-back (`redacted@example.invalid` =
super_admin/all_projects, `redacted@example.invalid` = admin/all_projects). Committed as
78a51e1, pushed to `origin/main`. See `QA_LEDGER.md` for full detail. Browser-based sign-in/
allowed-denied confirmation still pending (not yet run this session).

## SVX-PROJECT-SCOPE-02 P1 — CLOSED (2026-07-29)

RLS-authorized project portfolio. Replaced hardcoded `.eq('slug', 'dating-app').single()` with 
RLS-scoped project-list query. Added `projects: Project[]` state sourced from unrestricted 
`select()` query (RLS auto-filters). Dynamic `/projects/:slug` routing via `useParams()`. 
New `ProjectDetailRoute` handles URL-based selection with error fallbacks. `ProjectsPage` 
maps over `projects` array instead of single hardcoded row. All project-scoped data queries 
load from `selectedProjectId` instead of hardcoded ID. Tests 15/15 pass. Build verified. 
Committed as b6a6b8e, pushed to `origin/main`. Browser QA deferred (tool rejected) — manual 
preview-mode QA still pending.

## SVX-TRUTH-01 — CLOSED (2026-07-29)

Lineage matrix + de-mocking pass across `/projects`, `/connections`, `/findings`, `/evidence`,
`/qa`, `/readiness`. De-mocked `/connections` (real table query replacing hardcoded rows), wired
the dead `/evidence` category filter, fixed a mislabeled `/qa` footer, made the decorative
"Add project" button honest, and added honest empty/not-recorded states + a save-error/duplicate-
submit guard to `ProjectPage`/`ReadinessPage`. Also caught and fixed a broken-`main` regression
(`useConsoleData.ts` importing a `demo.ts` export that was never committed). Full detail in
`TRUTH_AUDIT_SVX-TRUTH-01.md` and `QA_LEDGER.md`. Deferred, not fixed: `LearningsPage`/
`CommandsPage` need the same de-mocking fix `/connections` got; `/evidence`'s per-row
`<ExternalLink>` has no handler. Commits: `1755066`, `c344f9e`.

**Next queued item:** SVX-EVID-02 was referenced as paused-pending-TRUTH-01 but has no scope
defined anywhere in this file, SPEC.md, or prior QA_LEDGER entries — needs the owner to define it
before work starts. Still parked, scope-undefined, as of SVX-CITADEL-CORE-05 P1 below.

## SVX-CITADEL-CORE-05 P1 — CLOSED (2026-07-29)

Universal Work Receipts, packet 2 of the `CONSOLE_OVERHAUL_CONTEXT.md` locked execution order
(after SVX-AUTH-01). Generalized `project_updates` (already the append-only "what happened" table
used by `ProjectPage.saveUpdate` and `set_gate_status`) into one normalized receipt shape for Code,
Design/Figma, Product, Data, QA, Deployment, Research and Operations — no separate design-log
table. Added `discipline`, `work_type`, `actor`, `source_type`/`source_ref`, `verification_state`
(`reported`/`reviewed`/`verified`, default `reported`), `occurred_at`, `idempotency_key`,
`artifact_id`, `finding_ids` (all nullable/defaulted so the 13 pre-existing rows stay readable
unclassified rather than backfilled with a guess). RLS untouched — the SVX-AUTH-01 scoped
select/insert/update/delete policies already gate this table by role+project-scope and apply to
new columns automatically.

Rewired `RecordUpdatePanel` (renamed "Record update" → "Record work") from a local-only staging
mock into a real write path: 5 primary fields (project already selected, work area, what changed,
status, link/artifact) plus an Advanced section (phase/gate, actor/tool, verification state,
related findings, next action). Writes via `supabase-js` `.upsert(..., { onConflict:
'idempotency_key' })`, with a `savingRef` duplicate-submit guard matching `ProjectPage`'s existing
pattern. `PhaseTrail` now surfaces discipline, actor/tool, source, verification-state badge,
artifact link, and next action per record. Updated `record-to-console`'s `SKILL.md` contract so
manual UI and skill-driven writes normalize to the same shape, with the same idempotency-key dedup
contract (skill uses a deterministic key, not a random one, so repeat runs land on the same row).

**Bug caught and fixed during verification**: the first cut of the migration used a partial unique
index (`where idempotency_key is not null`) as the dedup constraint. Postgres won't infer a partial
index as a plain-column `ON CONFLICT` arbiter, which is exactly what `supabase-js`'s
`{ onConflict: 'idempotency_key' }` emits — the upsert would have failed with `42P10` in production
even though it typechecked and built clean. Fixed with a follow-up migration
(`20260729213000_work_receipt_idempotency_fix.sql`): every row now gets a real key (random default
for callers that don't supply one, e.g. `set_gate_status`'s existing insert), backed by a normal
non-partial unique constraint.

**Verified live against `redacted-project-ref`**: all 9 new columns present; 13 pre-existing rows
intact with `discipline = null` (not zero) and `verification_state = 'reported'`; one manual Figma
receipt and one code receipt inserted then retried under the same idempotency key each — row count
stayed at 1 per key both times, confirming dedup; the four `scoped select/insert/update/delete`
policies on `project_updates` are unchanged (admin+super_admin write within project scope, viewer
read-only, delete restricted to super_admin — carried over from SVX-AUTH-01, not re-verified from
scratch). Both synthetic test rows deleted after verification — no fabricated data left live.
`npx tsc --noEmit` clean, 20/20 tests pass (5 files), production build + `assert-env-baked.mjs`
postbuild gate pass. No `lint` script exists in this repo, so lint was not run.

Deferred (explicitly out of scope for this packet, per `CONSOLE_OVERHAUL_CONTEXT.md` §8): Figma
API integration, notification system, chat changes, phase-builder redesign, NailSalon data repair,
Agents/Skills restructuring, capability cleanup, deployment, unrelated visual work. Next locked
packet: SVX-CITADEL-LINKS-06 (project graph navigation).

## Session E: Findings/Readiness audit against SPEC §E4/§E7 (2026-07-24)

Per the `/goal` request for an RLS-surface / query-efficiency / empty-state audit — performed
directly against the live `FindingsPage`/`ReadinessPage` code and the `findings` RLS migration
(`supabase/migrations/20260712002347_add_findings_table.sql`), since no branch exists to gate
against (see correction note below).

- **RLS surface (Findings):** `findings` has all four policies (select/insert/update/delete) gated
  on `console_access`, matching the console-owner model the rest of the schema u``ses. No drift found.
- **Query efficiency:** `useConsoleData` (`src/hooks/useConsoleData.ts`) fetches each table once via
  a batched `Promise.all`, server-filtered by `project_id` where applicable — no N+1 pattern. One
  real defect, already tracked below and in the bug tail: the fetch is hardcoded to
  `.eq('slug', 'dating-app')` and a static `datingProject.id`, not the loaded project row's live id
  — blocks a second real project and risks cross-project data leakage.
- **Empty-state UX:** Findings shows an honest `EmptyState` when `findings.length === 0`
  (`"The findings table, RLS, and this screen are live — nothing has been recorded here yet."`).
  Readiness's gap list has an explicit empty case (`"None recorded — every required gate is
  verified..."`). Both match SPEC's "honest empty state" principle (§E8's own language, applied
  consistently here). No gap found.
- **Verdict:** existing implementation matches SPEC §E4/§E7 acceptance intent. No amendment needed
  — the concrete rough edges already have named entries in the bug tail below (Title column width,
  hardcoded project slug, stale as-of date). No pre-merge redesign is warranted because there is no
  pending merge; this is already the shipped code path.

## Readiness & Data: owner decision (2026-07-24)

**Option (a):** finish this session, write amendments, integrate. **Option (b):** park as PROPOSED,
come back when fresher. **Decision: neither (a) nor (b) — resolved N/A, closed as already-shipped.**

**Rationale:** both options are premised on `ReadinessPage` being an incomplete branch. Verified
directly against `src/App.tsx` and SPEC.md Amendment 7's audit (above): `ReadinessPage` is a
complete, live implementation on `main` — external-audit dimensions, console-derived categorical
readiness state (Amendment 2), explicit gap list with an honest empty case, JSON export/import with
dry-run merge preview, Central Brain and developer-handoff Markdown exports — and it passed the
RLS/query/empty-state audit with no gaps against SPEC §E7. There is no unfinished branch to finish
(a) or park (b); picking either would misrepresent already-shipped, spec-matching code as pending
work. No build or rebuild action taken.

## Session E gate correction (2026-07-24)

Fast-gate triage (per owner `/goal`) checked three branches against the three PROPOSED entries
below (Skills tab, Findings, Readiness & Data) and found all three screens already fully built and
live on `main`, independent of any branch — confirmed by reading `src/App.tsx` directly, not by
branch-diffing. `codex/SVX-HARNESS-001` (scaffolding only, no screen code) was merged as a safe,
additive no-op. `feat/findings-readiness` and `codex/integration` are confirmed-stale ancestors of
`main` (`git merge-base --is-ancestor`) with no unique surviving content — not the source of the
shipped Findings/Readiness screens. No "finish vs. park" decision was needed for Readiness & Data;
there was nothing incomplete to decide on. The three PROPOSED lines below are struck through and
corrected in place rather than deleted, so the history of the wrong assumption stays visible. Real
open work is the already-itemized bug/ux/refactor list further down this section.

## PROPOSED

- **[audited 2026-07-28, resolved by SPEC.md Amendment 9, owner sign-off pending] Tool registry
  (per-project tool tracking, e.g. Devin) in console:** audit found the schema question was already
  answered by existing code — `tools` + `project_tools` (FK join table with `role_in_project`,
  `outputs_produced`, etc.) exist since the initial migration and already hold 8 real rows for
  `dating-app`. The gap is that the frontend never queries `project_tools` (fetches `tools`
  globally, unfiltered) and `nailsalon`/`stallvix` have zero `project_tools` rows. Not a new-schema
  decision — a bounded wiring + backfill fix. Ordered task list (full detail in SPEC.md Amendment 9):
  **(a)** fix `useConsoleData.ts`/`ProjectPage` to fetch and render `project_tools` filtered by
  `project_id` instead of the global `tools.slice(0, 8)` (`App.tsx:371`) — do first, everything else
  is unverifiable without it; **(b)** move `Assets/qrcode_devin.ai.png` → convert to
  `src/assets/tool-logos/devin.webp` (96×96 padded WebP, per that dir's README convention), wire
  into `toolLogoByName`; flag stray root `7878778.PNG` to owner rather than assuming delete;
  **(c)** insert a `Devin` row into `tools` and real `project_tools` rows for `nailsalon` (pull role
  text from `tes` row `fee2150c` and artifacts `ce16fbce`/`38362933`/`5c44ce1b`/`79dfbc37`/`8bf265bd`
  — don't invent it); `stallvix`'s own backfill can wait. All three are `dev-routine` tier, no
  `heavy-executor` needed. See `SPEC.md` Open decisions #8 / Amendment 9.

- **Multi-tenant console access (feature initiative, named 2026-07-27):** real authenticated login
  (not the current anon key), per-account project visibility via RLS filtering the `projects` table
  against grants in `console_access` (extends the table already built for the QA negative-control
  test rather than introducing a new one), role-gated UI (buttons/actions render only if the
  account's role permits them), and an in-console "record to console" action a non-technical
  operator can trigger without touching Claude Code at all. This is not a config change — it's a new
  auth flow, new RLS policies, new UI screens, and a permission model, so it needs its own SPEC.md
  amendment and a dedicated session with a full token budget, not a bolt-on. Scope for that future
  session: (1) SPEC amendment defining roles, grant model, and the in-UI record-to-console flow —
  **drafted (f6cb35a): SPEC.md Amendment 8, pending owner sign-off on Decisions D1-D4**; (2)
  auth — replace anon-key access with real per-user login; (3) RLS — extend `console_access` grants
  to filter `projects` (and dependent tables) per account instead of exposing everything to every
  authenticated user; (4) role-gated UI — audit every mutating action (findings, readiness
  export/import, record-to-console) for permission checks, not just visibility; (5) in-console
  record-to-console trigger — let a granted operator log a `project_updates`/`evidence`/`findings`
  row from the UI itself, without Claude Code as an intermediary. Expected outcome: full feature
  sprint with a clean launch, measurable in StallVix's UX/UI, data-handling correctness (fail-closed
  per-account visibility, no cross-tenant leakage), and user-journey completeness (non-technical
  operator can complete a session end-to-end). Trigger to pick this up: a session opened specifically
  for this initiative with a full budget — do not build incrementally inside unrelated sessions.
- ~~Wire Skills tab to live skills table~~ — CORRECTED 2026-07-24: already live on `main`
  (`CapabilitiesPage`, `src/App.tsx`), fully wired to the real `skills` table with resolved-tool-name
  lookup and honest empty state. `codex/SVX-HARNESS-001` (merged 2026-07-24) never touched this — it
  was scaffolding only (PR/packet/receipt templates, `verify:fast`/`verify:full` scripts). No build
  work remains; see the Skills-tab bug/ux items below (raw-UUID fallback, etc.) for what's actually
  open.
- ~~Findings screen (§E4) — build fresh or merge Codex branch~~ — CORRECTED 2026-07-24: already live
  on `main` (`FindingsPage`, `src/App.tsx`, routed `/findings`), real Supabase-backed CRUD. The
  `feat/findings-readiness` branch some notes attributed this to is a stale, fully-superseded
  ancestor of `main` with zero unique content — not the source of the shipped screen. Remaining work
  is the itemized Observatory bug/ux list below (Title column width, etc.), not a build.
- ~~Readiness & Data screen (§E7)~~ — CORRECTED 2026-07-24: already live on `main` (`ReadinessPage`,
  `src/App.tsx`, routed `/readiness`), real Supabase-backed data actions (export/import). Same
  correction as Findings above. Remaining work is the itemized list below (stale hardcoded date,
  etc.), not a build.
- Auditor-findings feed on project view (spec-truth-auditor catches as visible timestamped data — parked idea, now tracked)
- Dormant project-vault bucket: park-or-drop decision
- AGENTS.md Scope section refresh (stale post-remediation)
- `findings.status` enum: currently every row across every project only ever holds "Open." Add real
  states — open / fixed / wont-fix-routed (requires a note) / accepted-risk. Gap found via
  NailSalon's record-to-console session: real audit findings get routed around (e.g. "confirmed,
  rebuilding elsewhere") with no schema way to say so without abusing free text. Run
  spec-truth-auditor after the enum change to confirm no drift.
- Investigate `supabase db query --https` CLI TransportError fallback: a record-to-console session
  hit a TransportError on the documented `--https` CLI path and fell back to direct REST with a
  service-role key. Confirm whether direct REST is now the reliable path — if so, update
  `supabase-cloudflare-fallback-paths` to make direct REST primary, not an undocumented fallback.
- PARKED, not urgent: a "decisions" concept (named items, resolved/open state) for SPEC-style
  open-decision tables — only one live example so far (NailSalon); revisit if a second project
  needs the same pattern.
- ~~[bug] Global data-read failure (`Cannot coerce the result to a single JSON object`) coexists with
  fallback-looking demo data and a green "Connected" badge across every route~~ — RESOLVED
  2026-07-25 (commit `f8db8ab`, Amendment 6): on any query error the entire route tree is replaced
  with a "Live data unavailable" state and the badge reads "CONNECTION ERROR" (red); demo data is
  never rendered alongside an error. This BACKLOG line was stale (predated the fix). Follow-up
  hardening 2026-07-28: `loading` now starts `true` when authenticated so the badge can't flash
  "CONNECTED" for one frame before the first fetch resolves (src/hooks/useConsoleData.ts,
  src/App.tsx).
- [bug] Skills tab "Related tool" field shows a raw UUID instead of the resolved tool name
  (Observatory PR#4 live QA, 2026-07-22).
- [ux] Findings table allocates too little width to the Title column on desktop — titles truncate to
  fragments like "Demo p...", slowing triage (Observatory PR#4 live QA, 2026-07-22).
- [bug] Connections page and top-bar "Connected" badge reflect configured/session presence, not
  verified successful reads — no evidence-backed health state (configured/authenticated/reachable/
  authorized/last-verified) (Observatory PR#4 live QA, 2026-07-22).
- [bug] Dating row's `project_updates` cannot be read (single-object coercion error), blocking Phase
  Trail acceptance proof of ordering, timestamps, node expansion, and snapshot fields (Observatory
  PR#4 live QA, 2026-07-22). ROOT CAUSE CONFIRMED 2026-07-28: not a query-shape bug — it's the
  `console_access` provisioning gap below (a new/un-granted user's `.single()` project lookup
  returns 0 rows, which PostgREST reports as this exact coercion error; `project_updates` itself is
  never queried with `.single()`). FIX WRITTEN, NOT YET LIVE: migration
  `supabase/migrations/20260728120000_auto_grant_console_access.sql` extends
  `private.handle_new_user()` to insert `console_access` in the same trigger as `profiles` (signups
  are invite-only per owner confirmation 2026-07-28, so auto-granting on signup is safe). Committed
  to the repo but **not yet applied to the live project** — the linked Supabase CLI session
  authenticates to a different account (`redacted-project-ref`/StallVix_Console isn't in its
  `projects list`), and the Supabase MCP tool returned a permission error on the same project ID.
  Needs an owner with real access to run this migration's SQL against the live project (Dashboard
  SQL editor, or a correctly-scoped CLI/MCP session) before this is actually fixed end-to-end.
- [ux] Tool logos are text initials instead of official marks — replace with local optimized WebP
  assets across Project Toolchain and capability cards (Observatory PR#4 live QA, 2026-07-22).
- [bug] Shell hard-codes a stale date ("11 JUL 2026") instead of a labelled current/as-of timestamp;
  Readiness & Data's as-of date has the same problem (Observatory PR#4 live QA, 2026-07-22).
- [ux] Secondary/metadata text (evidence counts, subtitles, IDs) has low contrast against dark
  panels — review semantic color tokens against accessibility targets (Observatory PR#4 live QA,
  2026-07-22).
- [ux] Parked/inert controls (Learnings & Connections "Add record", other unwired buttons) don't
  indicate they're unavailable — disable with a reason or wire under a reviewed packet (Observatory
  PR#4 live QA, 2026-07-22).
- [ux] QA screen shows evidence-link gaps while the global read error is active — needs a verified
  read path before evidence linkage can be trusted (Observatory PR#4 live QA, 2026-07-22).
- [bug] `project_updates` still has authenticated `update`/`delete` policies and full table grants
  despite SPEC.md describing it as immutable — the DB boundary doesn't enforce the immutability
  contract (Observatory full-repo code review, 2026-07-21).
- [bug] Finding closure/accepted-risk transition rules (fix-note rationale, evidence_ids required)
  are enforced only in `src/App.tsx`, not the database — a raw write can bypass them (Observatory
  full-repo code review, 2026-07-21).
- ~~[bug] `projects.open_high_findings` is a denormalized counter nothing keeps in sync~~ —
  RESOLVED 2026-07-24 (commit `5a7fead`): ProjectsPage now derives the open-High count live instead
  of reading the stored column. Only the now-dead column-drop migration remains open (tracked
  separately below, "Drop the now-unused `open_high_findings` stored column").
- [bug] `findings.updated_at` has no touch trigger (unlike other tables); the client fabricates a
  local timestamp after update, but a refresh can revert to the stale persisted value (Observatory
  full-repo code review, 2026-07-21).
- [bug] `.env.example` documents `VITE_ALLOW_LOCAL_PREVIEW` but the app actually reads
  `VITE_PUBLIC_DEMO_MODE`; `VITE_SUPABASE_PROJECT_ID`/`EXPECTED_PROJECT_REF` used by the postbuild
  gate aren't documented there either (Observatory full-repo code review, 2026-07-21).
- [refactor] `src/App.tsx` is 618 lines / 31 top-level functions with only 7 tests covering two
  helpers — high collision risk for any integrity fix; needs boundary tests before splitting into
  feature modules (Observatory full-repo code review, 2026-07-21).
- [ux] Accessibility pass needed: `alert()` is the main mutation-error surface, several icon-only
  buttons lack accessible names, and custom modals have no verified dialog/focus-management contract
  (Observatory full-repo code review, 2026-07-21).
- [bug] README.md still has Vite starter boilerplate, claims a private artifact Vault that
  contradicts the locked metadata-only MVP boundary, and says preview opens automatically when the
  current gate requires an explicit click (Observatory full-repo code review, 2026-07-21).
- [spec-question] `public/_headers` has MIME/referrer/permissions/frame protections but no reviewed
  CSP — would need a bounded experiment tested against Supabase auth/API origins before promotion
  (Observatory full-repo code review, 2026-07-21).
- [bug] `ProjectPage.saveUpdate` updates `projects` then inserts `project_updates` as two separate
  statements instead of one atomic write (unlike the existing `set_gate_status()` RPC pattern) — a
  failed second write leaves the project changed with no history record (Observatory truth-integrity
  research, 2026-07-21).
- [bug] JSON import runs four independent `.upsert()` calls with no rollback — a later table failure
  leaves earlier writes committed; `qa_evidence` is missing from export/import so QA-to-artifact
  links don't round-trip; the installed `zod` dependency isn't used for validation (Observatory
  truth-integrity research, 2026-07-21).
- [bug] Data loader is hardcoded to the `dating-app` project slug — doesn't support a second real
  project (Observatory truth-integrity research, 2026-07-21). PARTIALLY RESOLVED 2026-07-28:
  child-table filters (`project_gates`, `qa_checks`, `artifacts`, `executions`, `findings`) now use
  the just-fetched `projectRow.id` instead of the demo dataset's static `datingProject.id`
  (src/hooks/useConsoleData.ts) — cross-project leakage risk from that mismatch is closed. The
  slug is still hardcoded to `'dating-app'`; multi-project support remains open.
- [refactor] Project-state docs (BACKLOG.md, PROJECT_STATUS_REPORT.md) were found drifted from fresh
  `origin/main`/`codex/inbox` state as of 2026-07-21 — worth a reconciliation pass to confirm current
  docs match git truth; may be partly stale itself given later commits, verify before treating as
  open (Observatory truth-integrity research, 2026-07-21).
- [refactor] `docs/CODEX_TASKS.md` on `main` still showed the historical `SVX-HARNESS-001` task as of
  2026-07-20; per AGENTS.md that copy isn't authoritative, but it's worth reconciling to avoid
  confusion (Observatory cross-project audit, 2026-07-20).
- ~~SVX-PHASE-TRAIL-001 assignment in `codex/inbox`~~ — RESOLVED 2026-07-27: completed on
  `codex/SVX-PHASE-TRAIL-001` (commit `fb0dcf2`), inbox entry closed.
- ~~[spec-question] Legacy `research/codex-observatory` branch overlaps `codex/observatory`~~ —
  RESOLVED 2026-07-24 (Observatory consolidation): `research/codex-observatory` retired;
  `codex/observatory`'s `OBSERVATORY.md` is the sole research lane.
- [refactor] Drop the now-unused `projects.open_high_findings` stored column now that ProjectsPage
  derives the count live (src/App.tsx, fixed 2026-07-24 per SPEC's "derived, never stored"
  principle) — migration-level cleanup, not urgent since nothing reads the column anymore.
- ~~[refactor] Document demo/QA-account `console_access` provisioning as an explicit operational
  step~~ — SUPERSEDED 2026-07-28: owner chose a schema-level fix over documentation (signups are
  invite-only, so auto-granting `console_access` at signup is safe). See the `project_updates`
  coercion-error entry above for the migration (written, pending live apply).
- [ux] Artifacts tab has no stated job-to-be-done, entry conditions, or explained prerequisites for
  Import manifest / Scan project structure — locked states read as arbitrary (Product-truth audit
  packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: H
- [ux] Manifest import rejects with a generic "unsupported manifest schema" — no discoverable
  schema/version, no field-level detail, no recovery path (Product-truth audit packet batch 01,
  2026-08-06). Finder: GPT/audit. Pri: H
- [spec-question] Gate model has no single authoritative state machine — gate status, verification
  state, and evidence completeness are separate fields; manual activation vs. derived readiness is
  undefined (Product-truth audit packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: H
- [bug] Per-gate required-evidence counts (0 of 4 / 5 / 6) have no traceable derivation, and the
  eligible evidence set repeats identically across gates — numerator, denominator, and eligibility
  rules all unexplained (Product-truth audit packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: H
- [bug] Gate tool assignment shows only Claude Code and may be a global registry rendered without
  project-availability filtering — no distinction between available / assigned / required execution
  owner; relates to the PROPOSED tool-registry wiring item above (Product-truth audit packet batch
  01, 2026-08-06). Finder: GPT/audit. Pri: H
- [ux] Artifacts page mixes scan controls, an unexplained npm command, and the artifact table with
  no shared orchestration state — user can't tell if a scan ran (Product-truth audit packet batch
  01, 2026-08-06). Finder: GPT/audit. Pri: H
- [ux] "No matching artifacts" collapses filtered-empty / never-scanned / failed-scan /
  no-connection / true-zero into one empty state (Product-truth audit packet batch 01, 2026-08-06).
  Finder: GPT/audit. Pri: H
- [spec-question] Findings vs. Artifacts vs. Evidence distinction is not expressed anywhere in the
  UI; finding titles carry no diagnostic identity (Product-truth audit packet batch 01, 2026-08-06).
  Finder: GPT/audit. Pri: H
- [bug] Finding `severity` and `status` have no visible provenance and status appears uneditable
  from the table; relates to the PROPOSED `findings.status` enum item above (Product-truth audit
  packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: M
- [bug] Shell identity badge shows "DE" under a super-admin session — hardcoded/stale demo initials
  detached from the auth session, static on every route (Product-truth audit packet batch 01,
  2026-08-06). Finder: GPT/audit. Pri: H
- [bug] "Save finding" produces no pending / success / failure / persisted-state feedback — silent
  mutation; user can't tell if the write landed or if retrying duplicates it (Product-truth audit
  packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: H
- [ux] `View gate` from a finding has no return contract — selection, filters, and unsaved edits
  have no defined preservation (Product-truth audit packet batch 01, 2026-08-06). Finder: GPT/audit.
  Pri: M
- [spec-question] Learning Plane lifecycle undefined — scope (project vs. global), draft/review/
  approved states, promotion targets, who promotes, and how future projects consume it
  (Product-truth audit packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: H
- [ux] Artifact filter toolbar: type scale too small for the density, search/category row not on a
  shared grid with the panels above and below, all-categories default reads as noise (Product-truth
  audit packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: M
- [bug] Attach-existing-artifact modal has nested vertical scrolling (modal body and inner list both
  scroll) with no sticky-footer contract (Product-truth audit packet batch 01, 2026-08-06). Finder:
  GPT/audit. Pri: H
- [ux] Artifact selection cards omit the metadata used to filter them (category/source), so matches
  can't be verified; radio control placement and click target are unresolved (Product-truth audit
  packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: M
- [ux] Attach modal CTA hierarchy — Attach / Cancel / Done are ungrouped and Attach vs. Done are
  overlapping completion concepts (Product-truth audit packet batch 01, 2026-08-06). Finder:
  GPT/audit. Pri: M
- [ux] Findings table overflows: tags and long status labels burst their columns, no
  wrap/truncate/responsive-column strategy, secondary metadata outweighs the title (Product-truth
  audit packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: H
- [ux] Findings inspector panel has no discoverable purpose and no distinct empty / selected / view
  / edit states (Product-truth audit packet batch 01, 2026-08-06). Finder: GPT/audit. Pri: M
- [ux] Layout is brittle across normal laptop widths and zoom (1366×768, 1440×900, 1512×982,
  1280×800 at 90/100/110%) — no shared responsive contract (Product-truth audit packet batch 01,
  2026-08-06). Finder: GPT/audit. Pri: H
- [data] **ReadinessState value "Ready for Verification" is spelled identically to a
  `gate_status` value, computed independently client-side, with nothing asserting the two agree
  — silent-divergence risk** (Post-agent-audit observation, 2026-08-08). Finder: Claude Code.
  Pri: M
- [data] **`qa_evidence` has FKs but no same-project enforcement trigger, unlike every sibling
  evidence path** — sits in Amendment 3's gate-verification invariant. Currently 0 rows,
  unexploitable, but structural. Fix deferred pending `qa_checks` catalogue decision (see
  PR #37) (Post-agent-audit observation, 2026-08-08). Finder: Claude Code. Pri: M
- [scope] **Scope language scattered across SPEC.md, BACKLOG.md, AGENTS.md, CLAUDE.md, task
  packets, PR conventions, and local path rules** (Issue #28) — no single source of truth for
  what "in scope" means. `SCOPE.md` deliberately parked, not activating now. Tracked for a
  future dedicated session (Post-agent-audit observation, 2026-08-08). Finder: Claude Code.
  Pri: L
- [data] **Seven separate "verified" vocabularies with no cross-mapping** — gate status, finding
  status, receipt verification, knowledge-link status, receipt-template PASS/FAIL, `WorkStatus`,
  and `ReadinessState`. "Show me everything unverified" is not one coherent query today
  (Post-agent-audit observation, 2026-08-08). Finder: Claude Code. Pri: M
- [data] **Automation write path bypasses `record_project_update` entirely** — five
  `scripts/record-*.mjs` writers direct-insert into `project_updates` via `service_role`, plus a
  third hand-written-SQL path (`docs/agent-work/SVX-TRUTH-NAV-02-nailsalon-apply.sql:39-87`).
  Classification cannot use the A.12.1 coercion contract until this is unified: on a direct
  insert a stale or cross-project `project_workstream_id` hits the raw FK and fails the entire
  receipt. Confirmed unreachable-by-`service_role` via live probe
  (`docs/audit/GRAPH-POPULATION-01-STEP0-PROBE.md`) (RECON-01 §5 + Step 0, 2026-08-08).
  Finder: Claude Code. Lane: Cline/Cursor. Pri: H
- [governance] **Amendment 12 needed — the human create/correct surface for workstreams has zero
  SPEC authority.** Blocks the secondary half of SVX-ORDINARY-GRAPH-POPULATION-01, not its
  automation half (Sprint ruling, 2026-08-08). Finder: owner. Lane: Cline/Cursor. Pri: M
- [test] **No automated access-control test exists anywhere** — largest standing structural gap
  per security review. The two nearest tests are pure-logic and touch no database:
  `src/lib/access.test.ts` asserts the `permissionsForRole` matrix, and
  `src/__tests__/backlog-access.test.ts:12-30` re-implements its own `authorizeBacklogAccess`
  rather than importing production code, so it cannot detect drift from the real policy. Nothing
  exercises RLS, `private.access_role`, or `private.project_in_scope`. Own packet; does not block
  -01 (RECON-01 §6, 2026-08-08). Finder: Claude Code. Lane: Cline/Cursor. Pri: H
- [design] **PARTIAL/missingness ruling — broken or unresolved edges surface explicitly, never
  silently discarded.** Kept from GPT's Resolver design; the Resolver itself stays parked. Bake
  into -02 (evidence attachment) from the start, do not retrofit (Owner ruling, 2026-08-08).
  Finder: owner. Lane: Cline/Cursor. Pri: M
- [data] **`scripts/record-*.mjs` never write `actor`** — `grep -c actor` returns 0 on all five
  `project_updates` writers, which is the mechanical cause of the 89% NULL `actor` rate (33 of 37
  rows), not human behaviour. Fix alongside the write-path unification above (RECON-01 §5,
  2026-08-08). Finder: Claude Code. Lane: Cline/Cursor. Pri: M
- [risk] **`record-to-console/SKILL.md` lives outside the repo**
  (`C:\Users\user\.claude\skills\`) — it is part of the production write path with no test and no
  review in this project, and its step 3 (lines 96-122) describes column-level writes without
  naming the capture RPC, which is why every implementation reached for a direct insert
  (RECON-01 §5, 2026-08-08). Finder: Claude Code. Lane: Cline/Cursor. Pri: M
- ~~[refactor] Domain model gaps across Artifact / Evidence / Finding / Gate / Learning —
  relationships as nullable IDs, no enforced lifecycle, missing provenance/scope/verification
  metadata; needs one domain truth table before further UI work~~ — LARGELY SHIPPED 2026-08-07: the
  "domain truth table" this item called for is `docs/audit/DATA-MODEL-VERDICT.md` (16-decision
  table + canonical entity/relation contract), implemented in migrations
  `20260807120000_foundation_data_model_phase1.sql` (typed junctions `project_update_findings` /
  `finding_evidence` replacing the nullable `finding_ids`/`evidence_ids` arrays; nullable `gate_id`
  FK + `spec_reference` column; `knowledge_links` for relation provenance
  `assignment_source`/`status`/`author_id`; same-project enforcement triggers on every new junction;
  deterministic backfill) and `20260807140000_capture_rpc_phase2.sql` (atomic capture RPC with
  null-safe coercion). Receipts: `docs/audit/FOUNDATION-MIGRATION-PRODUCTION-receipt.md`,
  `docs/audit/PHASE2-CAPTURE-RPC-PRODUCTION-receipt.md`. **Deliberately still open** (see
  DATA-MODEL-VERDICT.md decisions 02, 07, 11): external source-ref registry (dedup for the 9
  duplicate `related_commit` values), learning promotion/reuse lineage, and — separately — the
  Gate-model state-machine and Learning-Plane-lifecycle items below remain unaddressed; this entry
  only covered the Artifact/Evidence/Finding relationship layer. Finder: GPT/audit. Pri: H

## IN FLIGHT

None currently — see SHIPPED for SVX-GOVERNANCE-01 / SVX-COLLABORATORS-01, closed 2026-08-07.

## SHIPPED

None recorded here yet — see PROJECT_STATUS_REPORT.md and LEARNING_LOG.md for what has already shipped prior to this file's creation (2026-07-14).

- **SVX-GOVERNANCE-01 — CLOSED (2026-08-07):** migration `20260731120000_governance_roles_and_membership.sql`
  was already applied to `redacted-project-ref` (confirmed via `supabase migration list`,
  local==remote) but this entry was left listed as "LIVE MIGRATION PENDING" with its post-apply
  checklist never confirmed run. Ran all 7 checks against production this session
  (`docs/agent-work/preview-logs/backlog-governance-verify-readonly.sql` +
  `backlog-governance-verify-admin-update-test.sql`, the latter a rolled-back impersonated-admin
  update attempt): 6/7 pass as specified. Check 2 ("owner grant row(s)") returned none — only
  `super_admin` (1) and `admin` (1) roles are actually granted in production, no `owner`-role row
  exists. Not a migration defect (the role is supported, just unused) but flagged since it diverges
  from the checklist's stated expectation — owner call on whether an `owner` grant should exist.
- **SVX-COLLABORATORS-01 — CLOSED (2026-08-07):** migration `20260731140000_collaborators_avatars.sql`
  was already applied to `redacted-project-ref` (confirmed via `supabase migration list`,
  local==remote) but was left listed as "LIVE MIGRATION PENDING" with its checklist unconfirmed.
  Ran checks 1–3 against production this session
  (`docs/agent-work/preview-logs/backlog-collaborators-verify-readonly.sql`): `avatars` bucket
  exists (public=true), 3 own-folder storage policies present (upload/update/delete), 0 profiles
  missing a `console_access` row. Check 4 (upload a test avatar via the Settings modal UI) was NOT
  run — it requires a live browser session, which is gated to `ask` permission in this repo and
  wasn't invoked; still an open manual verification if the avatar upload flow hasn't been exercised
  since 2026-07-31.

- ~~SVX-CITADEL-LINKS-06 P1: project graph navigation~~ — SHIPPED 2026-07-30: project → phase/gate
  → work receipt → QA → finding → artifact/evidence → readiness blocker is now navigable via
  project-scoped routes (`/projects/:slug/{overview,work,flow,qa,findings,artifacts,readiness}`)
  with URL-persisted selection state (`?gate=`, `finding=`, `?artifact=`, `?qa=`). See QA_LEDGER.md
  for verification detail (typecheck/lint/test/build all pass).

- **SVX-PROJECT-STRUCTURE-TREE-01 — CLOSED (2026-07-31):** Collapsible project structure tree in
  Artifacts tab, rendered from scan manifest JSON stored as an artifact row. Three commits: skeleton
  (3332be5), UI polish with motion/filter/excluded-disclosure (008d7c5), data integration hook +
  ArtifactsPage wiring + manifest upload write (a35b86f). `buildProjectTree`, `filterProjectTree`,
  `formatFileSize`, `iconKeyForFilename`, `findMatchRanges` exported as pure logic. 25 tests pass.
  `repository_path: 'stallvix-manifest.json'` satisfies the artifacts CHECK constraint without a
  migration. Next: file preview/download, manifest delete/replace, inferred-type filter wired to
  real scan output categories.

## PARKED — deliberate deferrals

Items parked on purpose, with the reason recorded so they read as decisions rather than oversights.
Not candidates for pickup without their own review session.

- [architecture] **`SCOPE.md` / Scope Foundation activation** — new governance primitive, needs its
  own dedicated review session, not a rider on another packet. Parked deliberately 2026-08-08 by §7
  owner ruling item 6; revisit when ready to give it full attention. Consequence while parked: the
  mutation axis stays informal, and `OPERATIONAL-GRAPH.md` carries GCR-1 and SR-2 as *adopted but
  dormant* rules pending its existence. The scope vocabulary question is already settled and does
  not need relitigating then — see `docs/architecture/SCOPE-AUTHZ-SEQUENCING.md`.
