# STALLVIX — CURRENT STATE — 2026-08-12

## CRITICAL NOW

- **`main` and production agree again — migration drift closed 2026-08-12.** For roughly a day,
  production's `schema_migrations` carried four versions that existed on no branch merged to `main`:
  `20260811010000`, `20260811020000`, `20260811030000` (the three Blast-Radius packets above) and
  `20260811040000` (`blocking_findings_predicate_failclosed`). The individual migrations were fine;
  the gap was not. While it stood, **CI's from-scratch replay was validating a schema production did
  not have** — every green check on `main` was green about a different database. Closed by PR #49
  (the first three, plus their audits, probes and pgTAP) and PR #54 (`fb5099b` cherry-picked alone).
  The cherry-pick was deliberate: that commit lives on `feat/amendment-10-packet-a`, which also
  carries unreviewed Amendment 10 feature work, and merging the branch to close a migration gap
  would have dragged the feature in behind it. Verified by set comparison, not counts: **zero
  versions in production absent from `main`, zero on `main` absent from production**, confirmed
  after PR #55 merged. Standing rule this leaves behind: a migration applied to production and not merged to
  `main` is a CI outage, not a paperwork item, and should be treated as one.

- **Operator search lane (`SVX-PLATFORM-LANE-01`) — `SRCH-00`, `SRCH-00B`, `SRCH-01` all executed
  2026-08-12.** The gate returned **NARROW**, and the measurement is why: 111 rows / 39.6 KB across
  all five searchable families, 9.561 ms for a full unindexed scan-and-rank. `SRCH-00B` weighed the
  master §4a candidates against those numbers and selected **no physical index — rank on the fly**,
  rejecting all three indexing options as machinery bought against a cost that has not arrived. The
  drift story is the strongest available: no derived state exists, so nothing can drift. Lock
  profile of the migration that shipped: **0 rows rewritten, 0 tables rewritten, no lock taken on
  any of the five tables** — one `pg_proc` row. Kill condition K4 was evaluated and did not fire
  because the migration touches no table; the bounded `RF-DB-001` residue **returned unspent with no
  finding filed, because the question is genuinely never reached**. `SRCH-01` shipped
  `public.search_console(p_query, p_project_id, p_entity_types, p_limit)` — `security invoker`,
  `stable`, `search_path` pinned empty — proven both ways contract §5 demands: **34 new pgTAP
  assertions green inside a 203/203 from-scratch replay**, and a **rolled-back production probe**
  in which a project-scoped user saw 30 real rows and zero from either project it was not granted,
  with clean snippets and identical `NONE|0` error shape for a guessed foreign UUID, a non-existent
  project and an ordinary empty result. **K2 did not fire** — the invoker function passed the
  adversarial suite and no `security definer` fallback was reached for. Two pgTAP assertions now
  guard the NARROW verdict itself: they fail if anyone later adds a search index or a stored
  `tsvector` column to those five tables. Re-entry trigger (corpus growth) is recorded in
  `SRCH-00B §1`. PRs #52 (lane docs) and #53 (implementation) merged. See
  `docs/lanes/SVX-PLATFORM-LANE-01-SRCH-00B-DESIGN.md` and
  `docs/lanes/SVX-PLATFORM-LANE-01-SRCH-01-EVIDENCE.md`.

- **`SVX-SRCH-01-F1` — anon function grant posture. Found by the probe, promoted and applied
  2026-08-12 (PR #55).** After `20260812000000` ran an explicit `revoke all on function ... from
  public`, production still reported `has_function_privilege('anon', 'public.search_console(...)',
  'EXECUTE') = true`. Cause: this project carries `alter default privileges in schema public grant
  execute on functions to anon` (grantor `postgres`), which writes an **explicit** `anon=X/postgres`
  entry into every new function's ACL at creation — and an explicit grant to a named role is not
  removed by revoking from PUBLIC. This is `20260810010000_revoke_anon_table_grants.sql` one layer
  up: that migration's own note, "no public function is granted to anon", was true about the
  functions that existed and was never an invariant, and its default-privileges clause covered
  `on tables` only. **No rows were ever exposed** — every public function is `security invoker` over
  RLS-protected tables whose predicates resolve `auth.uid()`, which `anon` does not have.
  **The probe then corrected the fix.** `20260812010000` was first written claiming the
  default-privileges revoke disarms the trap. It does not: with the anon entry verifiably gone from
  the stored default ACL, a throwaway function created on production and rolled back was still born
  with `=X/postgres` — the PUBLIC grant, and `anon` is in PUBLIC. Attempts to revoke that via
  `alter default privileges` were made committed, in a fresh session, on production and again on a
  local from-scratch database: three times, same result. The file records the behaviour and declines
  to guess at the mechanism. **So the operational rule is unchanged and must stay unchanged: every
  migration creating a function in `public` writes BOTH `revoke ... from public` and `revoke ...
  from anon`.** What holds the line is `supabase/tests/070_function_grant_posture.test.sql`, which
  guards both directions — nothing in `public` reachable by `anon`, everything reachable by
  `authenticated`, the second half being what stops an over-wide revoke from taking the console dark
  — and whose negative control fails 3 of 5 assertions and names the offending function.
  Production after apply: **0 of 6** public functions anon-executable, **6 of 6**
  authenticated-executable. Sequences carry the same legacy grant (`anon=rwU/postgres`, objtype
  `S`) and are **deliberately untouched** — filed for its own packet rather than bundled in.

- **The methodological result, stated once because it is the transferable one.** `pg_default_acl`
  is database state, not schema state. A from-scratch replay begins against a virgin catalog that
  carries no such entry, so a function created in CI is born without the inherited anon grant and
  every assertion about it passes whether or not the defence exists. **CI could not have caught
  `SVX-SRCH-01-F1`, structurally — not "did not".** That is the sharpest available evidence for why
  the search contract required pgTAP *and* a rolled-back production probe as two requirements rather
  than one phrased twice, and it generalises past this lane: from-scratch replay proves schema
  correctness and is blind to inherited grant posture. Anything asserted about grants on the live
  database has to be re-measured against the live database.
- **Packet 4 of `SVX-BLAST-RADIUS-AUDIT-01.md` (`SVX-KNOWLEDGE-LINKS-ENTITY-TYPE-GUARD-01`) —
  CLOSED 2026-08-11.** Closed E12: `knowledge_links.entity_type` is a polymorphic reference resolved
  by a `case` in `private.enforce_knowledge_links_same_project()`, independently maintained from
  `knowledge_links_entity_type_check` — nothing previously stopped the two lists from drifting apart.
  Added a pgTAP guard (`010_schema_contract.test.sql` assertion 107) that reads both lists live from
  the catalog and asserts set equality via `set_eq()`, plus cross-referencing comments at both
  definition sites (the trigger's `case` and the CHECK constraint itself, via `comment on
  constraint`). No `entity_type` value added, no logic/errcode/RLS/grant touched — `create or
  replace function` with a comment only. Applied via
  `20260811030000_knowledge_links_entity_type_guard.sql`, migration history repaired, **46/46**
  reconciled. Rolled-back live probe against production, **10/10 checks matched expectation**,
  including a concrete reproduction of E12 (CHECK widened to a 4th value `'topic'` with no matching
  trigger arm → `SV011:ENTITY_NOT_FOUND`, confirmed) and proof the new guard flips from MATCH to
  MISMATCH the instant that drift happens. Full `010_schema_contract` suite re-run against production
  (Docker still down, same capture-wrapped technique as Packet 3): **107/107, 0 failures**. See
  `docs/audit/SVX-KNOWLEDGE-LINKS-ENTITY-TYPE-GUARD-01.md` for the full record. Packet 5 of
  `SVX-BLAST-RADIUS-AUDIT-01.md` (`SVX-CI-EXPECTED-FAILURE-SIGNAL-01`) is the only one remaining,
  independent of everything above.

- **Packet 3 of `SVX-BLAST-RADIUS-AUDIT-01.md` (`SVX-QA-EVIDENCE-KNOWLEDGE-LINKS-SQLSTATE-01`) —
  CLOSED 2026-08-11.** Converted the last two bare-`RAISE` same-project triggers
  (`private.enforce_qa_evidence_same_project()`, `private.enforce_knowledge_links_same_project()`)
  to stable SQLSTATEs — `SV003`/`SV006` reused, `SV009`/`SV010`/`SV011` new. Applied via
  `20260811010000_qa_evidence_knowledge_links_sqlstate.sql`, live catalog re-verified, migration
  history repaired, local/remote counts reconciled at **44/44**. This closes the sqlerrm-text-
  dispatch defect class in full across the whole schema — five packets (`20260810040000`,
  `20260810050000`, `20260810070000`, `20260810080000`, `20260811010000`) now cover every same-
  project/invariant trigger and RPC this audit identified. Re-checking `src/` (not assuming, per the
  kickoff's own AC3) found `src/lib/knowledgeLinks.ts` IS a live message-text consumer of the
  `knowledge_links` trigger (the "no writer yet" note in `SVX-FINDING-EVIDENCE-SQLSTATE-01.md` was
  accurate when written, stale now) — compatible because message strings are unchanged.
  Rolled-back live probe against production, **10/10 assertions OK, 0 FAIL** (all six rejection
  paths + both happy-path regressions + two catalog checks), leak check clean afterward. **pgTAP closed
  same day (addendum):** the local `supabase test db` replay stayed impossible (Docker stack down),
  so 8 catalog-contract assertions were added to `010_schema_contract.test.sql` and all five suites
  were re-run against production instead — **106/22/9/25/16, 0 failures**. A *behavioral* test file
  for `qa_evidence`/`knowledge_links` (real rejected inserts, as `040_finding_evidence` does) is
  still absent; CI proves the codes are attached, not that the triggers reject. See
  `docs/audit/SVX-QA-EVIDENCE-KNOWLEDGE-LINKS-SQLSTATE-01.md` for the full record. Packets 4-5 of
  `SVX-BLAST-RADIUS-AUDIT-01.md` remain un-started, kickoff-ready, independent of each other and of
  everything above.

- **Packet 2 of `SVX-BLAST-RADIUS-AUDIT-01.md` (`SVX-VERIFIED-GATE-EVIDENCE-SCOPE-01`) — CLOSED
  2026-08-11.** Rolled-back live probe (9/9 assertions OK) confirmed the E4/E4b/E5 gap: neither
  `gate_qualifying_evidence_count()` nor `check_gate_verification_invariant()`'s inline count sees
  `knowledge_links`/`finding_evidence`. Owner ruled **Option B — leave it out by design**: no
  workstream↔gate edge exists in the schema (so "extend" was never a mechanical join-widen — it would
  have required a new edge first), and `knowledge_links.entity_type` doesn't admit `'gate'` as a
  target. Resolved docs-only: `docs/architecture/OPERATIONAL-GRAPH.md` gained a "Known boundary —
  `knowledge_links`/`finding_evidence` are not gate evidence" section (same register as the existing
  QA-evidence-path gap). The E4b query-duplication itself (two independently-maintained copies of the
  same evidence-count query) is flagged there as a parked cleanup item — not queued, no urgency, no
  behavior change if ever done. No migration, no schema change. See
  `docs/audit/SVX-VERIFIED-GATE-EVIDENCE-SCOPE-01.md` for the full record.

IMMEDIATE NEXT (all four items below shipped 2026-08-10, a prior session — CURRENT_STATE.md is a
state snapshot, not the handoff; see the chat handoff for this session's actual pass-off):
   - `20260810040000` (graph-writer junction authority) — applied, verified, committed, Blocker 5
     contract finalized (both were already live going into this session; this session committed
     the file trail that had been left uncommitted).
   - `20260810050000` (`set_artifact_gate_link()` sqlerrm→SQLSTATE) — drafted, rolled-back-proved
     (11/11), applied, verified, migration history repaired, 92/92 pgTAP.
   - `20260810060000` (finding_evidence door (b)) — drafted, rolled-back-proved (8/8), applied,
     verified, migration history repaired, 95/95 + 23/23 pgTAP.
   - `20260810070000` (`enforce_finding_evidence_same_project()` sqlerrm→SQLSTATE, kickoff
     "FINDING-EVIDENCE-SQLSTATE-DISPATCH") — drafted, rolled-back-proved (9/9), applied, verified,
     migration history repaired, 98/98 + 25/25 pgTAP. `SV002`/`SV003` reused, `SV006` new for
     `ARTIFACT_NOT_FOUND`. See `docs/audit/SVX-FINDING-EVIDENCE-SQLSTATE-01.md`.
   - `20260810080000` (`set_gate_status()` structured error contract, Packet 1 of
     `SVX-BLAST-RADIUS-AUDIT-01.md`) — drafted, rolled-back-proved (12/12), applied, verified,
     migration history repaired, 98/98 + 22/22 + 16/16 (new) pgTAP. Return type changed
     `project_gates`→`jsonb`; `SV007`/`SV008` new for `EVIDENCE_INCOMPLETE`/`BLOCKING_FINDINGS` on
     `check_gate_verification_invariant`; `src/App.tsx` FlowPage's `updateStatus()` updated to
     consume the envelope, old message-prefix fallback kept. See
     `docs/audit/SVX-GATE-STATUS-ERROR-CONTRACT-01.md`.
   - Migration history: **43/43** local = production as of 2026-08-10 (`supabase migration list
     --linked --dns-resolver https`, verified same day; `supabase/migrations/*.sql` file count
     agreed). **Now 44/44** as of 2026-08-11 — see Packet 3 entry above. **Now 49/49** as of
     2026-08-12, and verified by set comparison rather than count this time — production's
     `schema_migrations` versions diffed against `main`'s `supabase/migrations/` filenames, empty
     both ways. Counts had been agreeing while the sets did not; see the drift entry at the top.
   - PR #46 (`db/gate-status-error-contract` → `main`) merged 2026-08-10, CI green (both pgTAP
     from-scratch replay jobs passed before merge) — Packet 1 is now on `main`, not just committed
     locally. Packets 2-5 of `SVX-BLAST-RADIUS-AUDIT-01.md` remain un-started, kickoff-ready,
     parallel-safe across tools/sessions; Packet 2 kickoff text is in this session's chat handoff,
     not duplicated here.


- **Packet 5 of `SVX-BLAST-RADIUS-AUDIT-01.md` (`SVX-CI-EXPECTED-FAILURE-SIGNAL-01`) — 2026-08-11.**
  `db-tests.yml` claimed "known and deliberate — will fail on `main`" (Blocker 1 Layer 2 owner-scope
  clause, expected to land only via `data-model/qa-path-gap`). Re-verification against real
  `origin/main` (from-scratch replay of the full migration chain, full pgTAP run) found the claim
  stale: `20260809020000_topic_read_owner_scope.sql` merged to `main` via `5dc0107` independently of
  that branch, so the clause **passes on main today** — confirmed by both a pre-split run with the
  assertion still embedded (`Files=5, Tests=170, Result: PASS`) and the post-split file run alone
  (`Files=1, Tests=1, Result: PASS`). The Blocker 1 row below already reads "Resolved 2026-08-09" —
  this packet closes the gap between that and the CI comment, which nobody had re-checked since.
  Fix: the assertion is split out of `010_schema_contract.test.sql` into its own file,
  `supabase/tests/900_blocker1_layer2_owner_scope_regression_guard.test.sql`, run as its own
  **required** (not lenient) CI step — kept as forward-looking hygiene, not because anything is
  currently failing, so a *future* regression of this specific clause is named by itself in the
  Actions UI instead of buried inside the core suite's log.
  **Reading a run from the Actions UI alone:** two required pgTAP steps, "Run pgTAP suite" and
  "Blocker 1 Layer 2 owner-scope clause (SVX-CI-EXPECTED-FAILURE-SIGNAL-01)". Both green = clean.
  Either red = a real regression, full stop — there is no expected-red state. The split only buys
  triage speed: a red core-suite step means opening the log to find which of its assertions broke; a
  red Blocker-1-Layer-2 step names the exact clause with no log-diving required. See
  `docs/audit/SVX-CI-EXPECTED-FAILURE-SIGNAL-01.md` for the full record.
   - The sqlerrm-dispatch defect class **is now fully closed** as of 2026-08-11 (Packet 3, see
     entry above). This file used to record the opposite — that two bare-`RAISE` same-project
     triggers remained untouched by any packet and unqueued by the owner
     (`private.enforce_qa_evidence_same_project()` on `20260809000000`/`public.qa_evidence`, and
     `private.enforce_knowledge_links_same_project()` on `20260807120000`/`public.knowledge_links`).
     Both carry stable SQLSTATEs now. The old wording is preserved here rather than deleted, as the
     historical record of when the gap was known and open; see
     `docs/audit/SVX-QA-EVIDENCE-KNOWLEDGE-LINKS-SQLSTATE-01.md` for the closing packet and the
     "correction" sections of `SVX-FINDING-EVIDENCE-SQLSTATE-01.md` for the earlier framing.
   - Remaining flagged-not-fixed item (parked, not queued by the owner): super_admin hand-delete
     break-glass on any junction (schema-wide decision, deliberately out of scope of all four
     packets above).
   - finding_evidence-drift packet complete, shipped 2026-08-09
   - Cursor a11y fix merged and deployed 2026-08-10
**Automation-first classification is the binding decision, and RECON-01 has landed.** Normal
StallVix use should create Topics, Workstreams, receipt classification and evidence
relationships before we build agents, embeddings, Kilo integration or graph visualization.

The foundation migrations are shipped to production and the schema is live. The data-model
architecture itself is **not** finished — treat it as foundational architecture work, not a
closed feature. Do not mistake "schema exists in production" for "data architecture is complete."

The blind spot RECON-01 was fired to close is now closed, and it broke two assumptions the plan
rested on. See VERIFIED / CORRECTED below.

## GRAPH TRUTH
Blocker 5 pgTAP suite: 73/73 green, CI proven, two deviations flagged and fixed
Graph-writer consistency: both findings closed, forward migration approved and staged
Policy audit: clean, no leaks, 3 new assertions in CI
Anon grants: revoked, applied, verified no-op
PR #44 merge: live deployed
Blocker 1, Stage B, Blocker 8/9/10 status: all stable, no changes

Live counts, verified by direct query 2026-08-08 late evening:

- `knowledge_topics`: **1** — `Verification & Evidence` (office-wide)
- `project_workstreams`: **1** — `Dating App — Real QA & Verification`
- `knowledge_links`: 0
- `project_updates`: 37, of which **0 classified**

The first two rows came from a narrow bootstrap, not from use. Zero classified receipts is the
number that matters: the graph is wired but has not yet been populated by anyone doing ordinary
work. NailSalon is deliberately unseeded — it is the second-project proof and its row must come
from real work. No speculative backfill. Classify forward only.

**Engineering rule (owner, 2026-08-08): implement globally, bootstrap narrowly.** Picker logic
never hardcodes a project; Unclassified = SQL NULL everywhere; projects with zero workstreams show
an honest empty state; Topics are office-wide, Workstreams project-specific.

## VERIFIED CLOSED

§F foundation is live in production: 5-table foundation, RLS/18 policies, deterministic
backfill, `record_project_update()` RPC, reverse indexes, `knowledge_links` evidentiary
relations (`supports` / `contradicts`). Migration history **22/22 local = production**.
StallVix has no staging environment; rollback/recovery + explicit verification are the safety
model. Migration history is now **31/31** after Blocker 8's write-path discriminator, Gate 1's
service_role actor param, Stage B's two RPC-path fixes, and Blocker 10's qa_evidence same-project
trigger all landed.

PR #38 (Amendment 10/11) merged to `main` — SPEC.md carries the Document Type Registry,
owner-lifecycle operational note, and Packets A–E structure. SR-1 note confirmed intact.

Artifact-duplicate count confirmed: 12 artifacts / 4 groups (live query).

**RECON-01 — DONE.** Receipt: `docs/audit/GRAPH-POPULATION-RECON-01.md`. Read-only
architecture map: routing, data-fetching pattern, project-page composition, full 17-param table
for the capture RPC, the record-to-console write path, and the test surface — every claim
carrying a file path and line number.

**Step 0 probe — DONE and CONFIRMED.** Receipt:
`docs/audit/GRAPH-POPULATION-01-STEP0-PROBE.md`. Script:
`docs/agent-work/preview-logs/step0-service-role-probe.sql` (re-runnable).

**GRAPH-POPULATION-01 Stage A — DONE, reviewed, and review findings fixed.** Receipts:
`docs/audit/GRAPH-POPULATION-01.md` and `docs/audit/GRAPH-POPULATION-01-REVIEW-FIXES.md`.
The capture form now transmits `p_project_workstream_id`; the traversal
`project_update → project_workstream → knowledge_topic` is proven by a rolled-back live probe.
Seven-case proof matrix, zero leak. Stage A's *create/correct surface* is still not built —
blocked on Blocker 2.

**SVX-FIX-VERIFY-FAST — DONE.** Receipt: `docs/audit/SVX-FIX-VERIFY-FAST.md`. See Process Finding.

**Blocker 8 — CLOSED.** Receipt: `docs/audit/BLOCKER-8-WRITE-PATH-DISCRIMINATOR.md`.
`project_updates.write_path` now says which of the four mechanisms wrote each receipt
(`capture_rpc` / `gate_evidence_rpc` / `gate_status_rpc` / `direct_insert` default /
`legacy_unknown` on the 37 pre-existing rows), stamped by a hardcoded literal inside each writer
function rather than a caller-supplied value. Proven live by an 8-point rolled-back probe with a
separate leak check; production unaffected.

**Blocker 9 — CLOSED, Path A (fix it forward).** Receipt:
`docs/audit/BLOCKER-9-BOOTSTRAP-FIX-FORWARD.md`. The Dating-specific seed left the migration chain:
`20260808190000` adds a project-agnostic, slug-keyed, idempotent
`private.bootstrap_project_workstream()` that **skips instead of aborting**, the Dating call moved
to `supabase/bootstrap/dating-app-verification-workstream.sql` (re-runnable, outside the chain), and
`20260808171000` is an inert tombstone with its history row left intact. Production rows unchanged
and reconciled live (`existed`/`existed`). A second project reusing the office-wide topic is proven
by rolled-back probe — the mechanism NailSalon will use, with no assumption that Dating exists.

**DEPLOYED 2026-08-08.** Owner-authorized. `wrangler pages deploy dist --project-name stallvix
--branch main`, deployment `e8e23fbe-4e84-4d89-b3b0-2c0073897cc6`, source commit `8af9f11` — equal
to local `HEAD`. Verified against the shipped artifact, not the dashboard: the production alias
serves the new bundle (`index-YxN4Oxei.js`), the real project ref is baked into it, and a deep link
(`/projects/dating-app/work`) resolves to the SPA shell via the `404.html` fallback. The workstream
picker is now live on the site as well as in the database. **Not verified end-to-end with real
data** — that needs an authenticated browser session; the first real classified receipt is the
proof, and there are still 0.

**DEPLOYED 2026-08-09.** Owner-authorized (Amendment 12 —
`SVX-AMENDMENT-12-WORKSTREAM-SURFACE-01`, frontend-only, no new migration/RPC — full writeup
`docs/audit/AMENDMENT-12-WORKSTREAM-SURFACE.md`). `wrangler pages deploy dist --project-name
stallvix --branch main`, deployment `18a5c281-19f9-4b12-8a2a-7ccb3ad0f7ae`, source commit
`2a402ee` — equal to local `HEAD`. `verify:full` was rerun clean first (24/24 test files, 290
tests, build + env-bake check passed). Verified against the shipped artifact, not the dashboard:
the production alias serves a new bundle (`index-HSt7RDBl.js`, differs from the prior deploy's
`index-YxN4Oxei.js`), the real project ref (`redacted-project-ref`) is baked into it, and a deep
link (`/projects/dating-app/work`) resolves to the SPA shell (identical content to `/`, same
bundle, root div present) via the `404.html` fallback. Amendment 12's workstream create/correct
surface (topic picker, title, spec reference, archive) is now live in the UI as well as the DB —
this closes Blocker 2 in deployed form. Blocker 1 (topic-read bootstrap deadlock) was resolved
separately in this same session, immediately after this deploy — see the Blocker 1 row below and
`docs/audit/BLOCKER-1-TOPIC-READ-BOOTSTRAP.md`. It is a DB-only RLS fix (no frontend change), so
it required no redeploy of this bundle.

## CORRECTED BY RECON-01 — three assumptions that did not survive

1. **The 89% blank `actor` is not human behaviour.** `grep -c actor` returns 0 on all five
   `scripts/record-*.mjs` writers. The field was never wired into the automation path at all.
   The automation-first ruling **survives, strengthened** — but for a different reason than it
   was made. The form-vs-automation framing was partly a false frame.
2. **The coercion contract does not protect the automation path.** True for the UI path only.
   Automation does not touch the RPC: five scripts direct-insert via `service_role`, plus a
   third hand-written-SQL path (`docs/agent-work/SVX-TRUTH-NAV-02-nailsalon-apply.sql:39-87`).
   On a direct insert a stale or cross-project workstream id hits the raw FK and **the whole
   receipt fails to write** — precisely what A.12.1 exists to prevent.
3. **The capture RPC is unreachable from automation.** Observed, not inferred: under a
   `service_role` connection `auth.uid()` is null, the JWT carries no `sub`, and
   `public.record_project_update()` returns `{"status":"error","code":"NOT_AUTHORIZED"}`. The
   authenticated control resolves a real uid. Nothing persisted; leak check returned 0 rows.

**Pattern worth keeping:** schema-first reasoning was the failure mode twice today. Live
queries and live probes reset the picture both times. Queries first, then architecture.

## THE TWO GATES

**Gate 1 — auth model for automation writes. CLOSED and IMPLEMENTED 2026-08-08 — Option A.**
`20260808210000_capture_rpc_service_role_actor.sql` extends `public.record_project_update()` to
accept `service_role` with an **explicit actor parameter** (`p_service_actor_id`). One migration,
no RLS change, no recursion hazard. Proven by an 8-point rolled-back probe: the human path is
unchanged and ignores the actor param when a real `uid` is present; a `service_role` call with no
actor, a forged actor, or a real-but-under-privileged actor (`admin`) is rejected; a real qualified
actor (`super_admin`) succeeds and is correctly attributed. Receipt:
`docs/audit/GATE-1-OPTION-A-SERVICE-ROLE-ACTOR.md`. **Correction, 2026-08-08 (Stage B pass):** that
receipt's proof table for the `service_role` cases (proofs 2–7) did not actually hold live —
`service_role` was never granted `USAGE` on schema `private`, so every real `service_role` call
would have failed inside the check with a raw permission error, not the results recorded. Found,
fixed (`20260808230000`), and the full 8-point matrix re-run for real, for the first time — see
`docs/audit/GATE-1-SERVICE-ROLE-GRANT-CORRECTION.md`. The mechanism is now genuinely confirmed
working end to end. **One condition still proven only in part, stated plainly there:** the *role*
half of the scope check is proven; the *scope* half is not, because both real `console_access`
rows are `scope = 'all_projects'` — there is no real actor today for whom a genuine cross-project
write would be caught. Re-run when a real `selected_projects`-scoped actor exists (Blocker 1:
`owner×0`). **B stays the named destination**, not a discarded option.

Precondition was met by Step 0. Options as evaluated:

| Option | Shape | Cost |
|---|---|---|
| **A — extend the RPC** to accept `service_role` with an explicit actor param, self-enforcing project scope | One migration. Doesn't touch RLS, so it avoids the known recursion hazard. No new identity. Closes the actor-attribution gap in the same change | The scope check must work without a `uid`, and `service_role` bypasses RLS — the RPC becomes the **sole** enforcement point. Must be proven, not assumed |
| **B — a real machine identity** with narrow capability (write receipts, read workstreams) | Better end-state: one write path, RLS still in force, honest attribution | New role/policy work in the machinery that already needed a recursion-fix migration. Unsized |

Recommendation was **A now, B as the named destination** — which is what the owner ruled.

**Hard boundary either way:** no direct-insert workaround that sets the FK to route around the
guard. That is the one move that makes a stale id destroy a factual record.

**Gate 2 — the observation gate (-04).** Does ordinary use populate the graph, or does it
stall? Populates → -05+ become real work, size them then. Stalls → the mechanism is wrong and
-05..-08 as written are dead. Do not pre-build them. Everything past this gate stays
deliberately unsized.

## BLOCKERS

| # | Blocker | Status |
|---|---------|--------|
| 1 | Topic-read bootstrap deadlock | **Resolved 2026-08-09.** `20260809020000_topic_read_owner_scope.sql` extends `knowledge_topics`' `"scoped select"` policy with `access_role(...) in ('super_admin','owner')`, mirroring `project_workstreams`' own `"scoped insert"` boundary. Migration history reconciled: 32/32 local ≡ remote. Proven by rolled-back live probe with an explicitly-labeled synthetic owner (no real `owner` row exists yet in `console_access`, so a real account's role was temporarily flipped inside the rolled-back transaction) — a genuinely unlinked topic went from invisible to visible for the owner claim, admin stayed rejected, super_admin unaffected, zero rows leaked. See `docs/audit/BLOCKER-1-TOPIC-READ-BOOTSTRAP.md`. Not yet exercised by a real owner account — that is downstream of a real `owner` grant existing |
| 2 | No SPEC authority for the human workstream surface | **Resolved 2026-08-09.** SPEC.md Amendment 12 authorizes create/correct via the existing `project_workstreams` RLS (no new authority, no schema change, no new RPC). Implemented: `WorkstreamManagerPanel` on the Work tab. Proven live with real RLS impersonation (`set local role authenticated`, not an elevated connection) — `super_admin` create/correct succeed, `admin` create/correct rejected, duplicate `(project, topic)` rejected by the unique constraint. See `docs/audit/AMENDMENT-12-WORKSTREAM-SURFACE.md`. **Update 2026-08-09:** Blocker 1 is now resolved too (row 1) — the RLS gap that meant only the super-admin account qualified in practice is closed, though no real `owner` account exists yet to exercise it end-to-end |
| 3 | Orphaned status column on edge table | Resolved — deprecate in place per 3.3 ruling |
| 4 | Nullable lifecycle status | **Resolved 2026-08-08** — `20260808170000` made `knowledge_topics.status` and `project_workstreams.status` NOT NULL DEFAULT 'active'. Landed at zero rows, the last moment it was free. `knowledge_links.status` deliberately excluded: assertion state, not lifecycle |
| 5 | No automated access-control test | **Resolved 2026-08-09, re-verified live 2026-08-10.** `supabase/tests/030_access_control.test.sql` (role/scope enforcement) plus the adversarial assertions in `020_graph_writer.test.sql` (both allow and deny paths for the `20260810040000` junction authority) and `010_schema_contract.test.sql` (catalog-level pins) exercise the actual production functions (`record_project_update`, direct RLS-gated INSERT, the DEFINER trigger) — not a reimplemented authorizer. `src/__tests__/backlog-access.test.ts:12-30` remains the pattern to avoid, not the standard. See `docs/audit/BLOCKER-5-PGTAP-CI.md`, "UPDATE 2026-08-09 — contract finalized". Re-run live 2026-08-10 against production (rolled back): `010` 95/95, `020` 22/22, `030` 9/9, `040` 23/23, `num_failed = 0` on all four. Migration history 38/38 |
| 6 | RLS recursion hazard | Known risk zone — any new Topic-read policy touches the machinery that required the prior fix migration. Finding A kept it off -01's path; keep it off |
| 7 | Automation write path not unified | **Resolved 2026-08-08 (Stage B).** `record_project_update()` accepts `service_role` + an explicit actor param (Gate 1, Option A); `scripts/lib/record-console-update.mjs` now wraps it and the `record-to-console` skill points at that helper instead of a direct `.insert()`. Two pre-existing defects in the path were found and fixed first: a cross-project idempotency-key collision (`20260808220000`) and a missing `service_role` grant on schema `private` that meant Gate 1's own RPC had never actually been callable as `service_role` (`20260808230000`; see `GATE-1-SERVICE-ROLE-GRANT-CORRECTION.md`). Both re-proven live. The six `scripts/record-*.mjs` one-shots are marked deprecated (comment only, logic untouched) — they're already-executed history, not templates. See `STAGE-B-AUTOMATION-RPC-MIGRATION.md` |
| 8 | No write-path attribution column | **Resolved 2026-08-08.** `20260808200000` adds `project_updates.write_path` (`capture_rpc` / `gate_evidence_rpc` / `gate_status_rpc` / `direct_insert` default / `legacy_unknown` on the 37 pre-existing rows), stamped by a hardcoded literal inside each of the three writer functions, proven live by rolled-back probe against production. See `BLOCKER-8-WRITE-PATH-DISCRIMINATOR.md` |
| 9 | Bootstrap data sits in the migration chain | **Resolved 2026-08-08, Path A.** Seed re-homed out of the chain to an idempotent, project-agnostic operation (`20260808190000` + `supabase/bootstrap/`); `20260808171000` neutralized as a tombstone with its history row intact; production rows untouched. A fresh database now replays the whole chain. See `BLOCKER-9-BOOTSTRAP-FIX-FORWARD.md` |
| 10 | `qa_evidence` has no same-project enforcement — **packet `SVX-QA-EVIDENCE-SAME-PROJECT-01`** | **Resolved 2026-08-09.** `20260809000000_qa_evidence_same_project_trigger.sql` adds `private.enforce_qa_evidence_same_project()` + a `before insert or update` trigger on `public.qa_evidence`, a structural copy of `finding_evidence`'s `enforce_finding_evidence_same_project` (`20260807130000`), retargeted at `qa_checks.project_id` / `artifacts.project_id`. Preflight reconfirmed live (not trusted from the prior claim): 0 rows, 0 cross-project. Proven by rolled-back probe: same-project insert succeeds, cross-project insert rejected with `CROSS_PROJECT_RELATION`; leak check confirms 0 rows after rollback. See `docs/audit/BLOCKER-10-QA-EVIDENCE-SAME-PROJECT.md`. No writer exists yet in `src/` or `scripts/` — this closes the gap before one ships |

## SPRINT — tight scope, gated roadmap

`docs/sprints/SPRINT-GRAPH-POPULATION-01.md`

| Pri | Packet | Size | Status |
|---|---|---|---|
| P0 | RECON-01 | read-only | **DONE** |
| P0 | Step 0 probe | ~30 min | **DONE — guard confirmed** |
| P0 | SVX-ORDINARY-GRAPH-POPULATION-01 Stage A | 2.5 days | **DONE + review fixes landed** (minus create/correct surface, Blocker 2) |
| P0 | SVX-FIX-VERIFY-FAST | ~1 commit | **DONE** |
| P0 | …Stage B (automation-first) | ~1 session | **DONE** — automation writes migrated onto `record_project_update()` via a shared helper, two pre-existing RPC-path defects found and fixed. See `STAGE-B-AUTOMATION-RPC-MIGRATION.md` |
| P1 | -04-lite (observation) | small | After -01 |
| P1 | -02 evidence attachment — first slice | shipped | **DONE 2026-08-09.** Attach/detach artifact-as-evidence, live. See `GRAPH-POPULATION-02-EVIDENCE-ATTACHMENT-SLICE1.md` |
| Gated | -03 list-first read | not sized | Roadmap only |
| OUT | -05 signals / -06 resolver / -07 similarity / -08 control plane | **refuse to size** | Gated on -04 |

RECON-01 §7 states plainly, per its own acceptance criterion, that automation-first is **more
expensive** than the human-form path (~2×–2.7×) and does not subsume it — Stage B has nothing to
classify against without Stage A. Stage A is therefore unconditional.

## IMMEDIATE NEXT

**No owner decision is outstanding in this lane.** Both gates that needed a ruling are answered;
Gate 2 is an observation gate, not a decision.

1. **-02 is underway** on `data-model/qa-path-gap`. Blocker 8 (write-path discriminator), Gate 1 /
   Option A (`service_role` + explicit actor param), Stage B (automation callers migrated onto
   the RPC via `scripts/lib/record-console-update.mjs`), and **Blocker 10 (`qa_evidence`
   same-project trigger)** are all **done** —
   `docs/audit/BLOCKER-8-WRITE-PATH-DISCRIMINATOR.md`,
   `docs/audit/GATE-1-OPTION-A-SERVICE-ROLE-ACTOR.md` (+ correction:
   `GATE-1-SERVICE-ROLE-GRANT-CORRECTION.md`), `docs/audit/STAGE-B-AUTOMATION-RPC-MIGRATION.md`,
   `docs/audit/BLOCKER-10-QA-EVIDENCE-SAME-PROJECT.md`.
   `record-to-console` now points at the helper; the six legacy `scripts/record-*.mjs` one-shots
   are marked deprecated (comment only). One proof gap stated in the Gate 1 receipt, still not
   closed: the *scope* half of the check (as opposed to the *role* half) is untested against real
   data, because both real `console_access` rows are `scope = 'all_projects'` — re-run when a real
   project-scoped actor exists (Blocker 1). **-02 evidence attachment's first slice shipped
   2026-08-09** (`docs/audit/GRAPH-POPULATION-02-EVIDENCE-ATTACHMENT-SLICE1.md`, sizing:
   `GRAPH-POPULATION-02-EVIDENCE-ATTACHMENT-SIZING.md`): no new RPC — direct authenticated
   insert/delete on `knowledge_links` through the existing RLS + `enforce_knowledge_links_same_project`
   trigger. "Attach an artifact as supports/contradicts evidence to a workstream" from the existing
   Artifacts tab, with a client-side PARTIAL/missing-workstream check on read-back (an archived
   workstream disappearing from the active-only fetch is the concrete case, not a hypothetical).
   Rolled-back live proof: all 3 trigger reject paths + attach/detach round-trip, `verify:full`
   green (282 tests). Findings/project_updates as evidence sources and a standalone Knowledge view
   (`-03`) remain unsized. Migration history unchanged at **31/31** — this slice added no migration.
   **Blocker 2 closed 2026-08-09** (`SVX-AMENDMENT-12-WORKSTREAM-SURFACE-01`): SPEC.md Amendment 12
   authorizes the human workstream create/correct surface via existing RLS, no schema/RPC change;
   `WorkstreamManagerPanel` shipped on the Work tab. Proven live with real RLS impersonation, not an
   elevated connection — first proof in this lane to do so. See
   `docs/audit/AMENDMENT-12-WORKSTREAM-SURFACE.md`. Branch note: `data-model/qa-path-gap` had
   diverged from `main` before PR #38 (Amendment 10/11 lane) merged; merged `origin/main` in first
   (`9be3bce`, doc-only, zero conflicts) so this amendment could be written as the real Amendment 12.
2. **Use the picker on real work — and now the create surface too.** Everything is live; the number
   that matters is still
   0 classified receipts, and it can only move by someone recording an update and choosing a
   workstream. No backfill.
3. **Codex** — still owes the Task 4 §7 checklist independent cross-check. Unrelated lane.
4. **Cline/Cursor** — six backlog appends now landed in `BACKLOG.md`; pick up after Stage A.
5. **GPT/code review** — the Gate 1 *option* review is spent (it converged with the ruling). Its
   named adversarial target (can the RPC's scope check be defeated on a `service_role` connection
   with a forged or mismatched actor param?) is answered: no, confirmed by re-run
   (`gate1-service-role-actor-proof.sql` proof 3, live). A separate code-review pass on the Stage B
   migration itself found a real, different defect first — the cross-project idempotency-key
   collision, fixed in the same pass (`STAGE-B-AUTOMATION-RPC-MIGRATION.md`). Next adversarial
   target, if picked up again: the still-open scope-half gap (Blocker 1 dependent).
6. **Stage B caller migration — DONE**, closing the sequencing choice `STAGE-B-DEFERRAL-DECISION.md`
   left open. See `docs/audit/STAGE-B-AUTOMATION-RPC-MIGRATION.md`. -02's remaining scope is
   evidence attachment, per the kickoff's original framing.
7. Regenerate `PROJECT_STATUS_REPORT.md` after -01 lands, not before.

## PROCESS FINDING — the cross-check discipline is not executing

z.ai's parallel RECON read never landed; the file supplied as its audit was the Cursor-authored
`SVX-TRUTH-NAV-02` receipt from 2026-08-02 — same lineage as the traced `actor` row, not an
independent source. **Do not re-fire z.ai for it:** Step 0's live rolled-back probe against the
actual project is a strictly better instrument than a second model reading the same migration
file, so the gate is satisfied, not skipped.

The real finding is that this is the **second time this week** a cross-check was designed and
then silently did not run. A designed cross-check needs a check that it ran.

**Third instance, and the worst of the three — the test runner itself. CLOSED 2026-08-08.**
`verify:fast` printed `Test Files 16 passed (16)` and exited 0 while six of twenty-two files never
ran; their workers timed out on startup and vitest counted only the files that reported in. Until
this was fixed, every "tests pass" claim from any tool in this repo was unverified — the gate could
not distinguish "passed" from "did not run".

Fixed by `SVX-FIX-VERIFY-FAST` (`docs/audit/SVX-FIX-VERIFY-FAST.md`):
`scripts/assert-tests-complete.mjs` diffs the files vitest reported against the files on disk and
fails loud on any gap, using one shared glob definition (`scripts/test-globs.mjs`) so the guard and
vitest cannot drift. **The guard was watched failing before it was trusted:** a deliberate partial
run exits vitest 0 and the guard 1. A green summary line is not evidence the suite ran — and now
nobody has to remember that, because the check does.

The standing rule this yields: **a verification step that has never been observed failing is not
yet a verification step.**

## OPEN RESEARCH / PARKED

**GPT's full design for SVX-GRAPH-CONTEXT-RESOLVER-01** — eight sections, seven shipping gates,
inheritance test. Filed as parked design input: it implements over zero graph rows and proposes
operations that don't exist yet. Quality input for when real graph density exists. No
implementation authority this round. One ruling was **kept** from it: PARTIAL/missingness —
broken or unresolved edges surface explicitly, never silently discarded. Bake into -02, don't
retrofit.
UI Overhaul: -00 ready to fire to Codex (gate satisfied by Stage A deploy)
see docs/CODEX-UI-OVERHAUL-TASKS.md for full series
**Dependency order that governs everything past -04:**
`ordinary graph use → useful graph data → then reconsider Context Resolver / Kilo / embeddings`

**First product loop:**
`Topic → Workstream → Record Work classification → narrow evidence attachment → list-first Knowledge view`

**Avoid duplicate graph truth:** if an FK or junction already expresses a relationship, do not
repeat it in `knowledge_links`.

**Parked until real graph usage exists:** Resolver/retrieval, Context Agent, embeddings/vector
DB, Kilo integration, graph-canvas UI, autonomous routing/orchestration, mass synthetic
backfill, `SCOPE.md` activation, `qa_evidence` same-project fix (deferred to -02).
