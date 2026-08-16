# Truth Audit — SVX-TRUTH-01 (2026-07-29)

Scope: lineage matrix + de-mocking pass for `/projects`, `/connections`, `/findings` (plus a
check of `/evidence`, `/qa`, `/readiness`). No new tables, adapters, or UI surfaces were added.
Live-DB read access (`supabase db query --linked --dns-resolver https`) was **not available** in
this isolated worktree — no `SUPABASE_ACCESS_TOKEN`/CLI link exists here, and per the
credential-exploration gate in `~/.claude/CLAUDE.md` this was not searched for further; findings
below about live-row *content* rely on the committed migration files (schema + `insert` seed
statements), which are the authoritative, versioned source for what should be live. Same blocker
the prior SVX-AUTH-01 session hit (see `QA_LEDGER.md`).

## Lineage matrix

| Screen | Field(s) | Query / hook | Table / view | Predicate (RLS fn + policy) | Live/Manual/Mock | Freshness |
|---|---|---|---|---|---|---|
| `/projects` | `project.*` (name, phase, status, gate, owner, risks, next action, readiness %s) | `useConsoleData.refresh()` L39 | `projects` (`.eq('slug','dating-app').single()`) | `scoped select` — `project_in_scope(uid, id)` | **Live** (authenticated) / demo fallback (preview) | Fetched once on `authenticated` becoming true; no polling/subscription; refetched only via explicit `data.refresh()` calls (e.g. after a project update save) |
| `/projects` | `operationalTools` count | derived from `data.tools` | `tools` (unscoped, all rows) | `capability read` — `has_console_role(uid)` | Live | Same fetch cycle as project |
| `/projects` | `openHighFindings` count | derived from `data.findings` | `findings` (`.eq('project_id', projectRow.id)`) | `scoped select` — `project_in_scope` | Live | Same fetch cycle |
| `/projects` | "Add project" button | — | — | — | **Was decorative** (no handler) | Fixed: now `disabled` with an honest tooltip explaining no add-project flow exists; matches the second card's existing honest copy ("No fictional portfolio records") |
| `/connections` | Supabase row status | `configured`/`connected` props, computed in `useConsoleData` from the live `projects` query's success/failure | derived, not a table | n/a (connection probe, not RLS-gated data) | Live | Recomputed every `refresh()` |
| `/connections` | GitHub/Cloudflare/Figma/Claude/Codex/GPT rows (`connection_state`, `purpose`) | **was**: hardcoded string literals in `ConnectionsPage`. **Now**: `useConsoleData` query added, `.from('connections').select('*').order('name')` | `connections` (real table, existed since initial migration, seeded with these exact 7 rows) | `capability read` — `has_console_role(uid)` (cross-project reference data, same tier as `tools`) | **Was Mock → now Live** | Same fetch cycle as project; falls back to a labelled demo array in preview mode |
| `/connections` | empty state | — | — | — | Fixed: added an honest `EmptyState` if `connections` is ever empty (previously would have silently rendered a blank list) | n/a |
| `/findings` | full register + inline edit (`status`, `fix_note`, `related_gate_id`, `evidence_ids`) | `data.findings`, write via `.from('findings').update(patch).eq('id', selected.id)` L442 | `findings` | `scoped select`/`scoped update` — `project_in_scope` + `access_role in (super_admin, admin)` | Live, fully wired both directions | Read on project fetch; write is immediate, no local-only staging |
| `/evidence` | artifact list, category filter | `data.artifacts`; **category `<select>` was present but not wired to any state — decorative** | `artifacts` | `scoped select` — `project_in_scope` | Live list; filter **was Mock (no-op)**, now wired: derives its own option list from live `artifact.category` values and actually filters | Fetched on project load |
| `/evidence` | manifest import review | client-side JSON parse only, "Continue to mapping" is a stub `alert()` | — | — | Honest — explicitly says review is mandatory and nothing is imported; confirmed no silent write path exists | n/a |
| `/qa` | check list, "Evidence not linked in preview" footer | `data.qaChecks`; footer text was a **static literal**, unconditionally shown even in authenticated/live mode | `qa_checks` (evidence linkage always via empty `qa_evidence`, documented known gap — left alone) | `scoped select`/`scoped update` | Checks: live. Footer text: **was mislabeled** (implied preview-only when the gap is universal) — reworded to "Evidence not linked" | Fetched on project load |
| `/readiness` | audited %s, console-derived readiness, export/import | `data.project`/`data.gates`/etc.; JSON import genuinely `upsert`s to `project_gates`/`findings`/`qa_checks`/`artifacts` when connected, and is explicitly disabled in preview | multiple | scoped per table | Honest — both the "review is mandatory" language and the preview-disabled import guard match actual behavior | n/a |

## Super Admin vs `redacted@example.invalid` (admin), same 3 screens

Both accounts currently have `scope = all_projects` (per the 2026-07-29 migration backfill), and
there is exactly one `projects` row in the system, so **today** they see identical data on all
three screens — the only difference is which write affordances render (`permissionsForRole`:
admin can write project data/findings/QA, cannot manage access or delete; both differ from
`viewer`, not from each other here).

**Confirmed gap** (matches the task's suspicion): `useConsoleData.refresh()` fetches a single
project by hardcoded `slug = 'dating-app'` (`src/hooks/useConsoleData.ts` L39) — there is no
project-*list* query anywhere in the frontend (verified via repo-wide grep for
`from('projects')`; the only two call sites are this single-row fetch and the project-update
write in `App.tsx` L335). `AccessManagementPanel` also only ever receives `projects={[data.project]}`
(`App.tsx` L275), so even the Super-Admin invite flow for `scope: selected_projects` can only ever
offer this one project as a checkbox option. **If a second `project_access` row were added for a
second project today, RLS would correctly allow the read, but no screen would ever display it** —
this is a frontend gap, not an RLS gap. Fixing it requires a real project-list screen/selector,
which is new UI and out of this task's bound ("no new UI, tables, or adapters") — **flagged and
deferred to the owner**, not fixed.

## Repairs applied (all in this worktree, uncommitted)

1. **`/connections` de-mocked**: `connections` table (already live, already RLS-scoped, seeded
   since the initial migration) is now queried by `useConsoleData` and rendered by
   `ConnectionsPage`, replacing the 7 hardcoded string-literal rows. Supabase's row is still
   overridden with the live connection probe (more accurate than the stored `connection_state`).
   `src/types/stallvix.ts` gained a `Connection` type; `src/data/demo.ts` gained a labelled
   preview fallback matching the real seed rows.
2. **`/evidence` category filter wired**: the category `<select>` previously had no `value`/
   `onChange` and did nothing; it now derives its options from live artifact categories and
   actually filters the list.
3. **`/qa` footer wording fixed**: "Evidence not linked in preview" was a static literal shown
   in both preview and authenticated/live modes — false in live mode, since the gap is universal
   (per the documented, left-alone `qa_evidence` linkage gap), not preview-specific. Reworded to
   "Evidence not linked".
4. **`/projects` "Add project" button made honest**: had no click handler at all; now `disabled`
   with a tooltip stating no add-project flow exists in this build.

## Explicitly deferred (found, not fixed — out of bound or genuinely the documented gap)

- `qa_evidence` linkage (per instructions: leave alone).
- No project-*list* query/selector anywhere in the frontend (see above) — needs new UI, escalate
  to owner as a follow-up task, not fixed here.
- `LearningsPage` and `CommandsPage` (parked nav items) exhibit the **same pattern** as the old
  `ConnectionsPage` bug: both `learnings` and `commands` are real, seeded, RLS-scoped tables
  (`capability read`/`capability write`, same tier as `connections`), but neither page queries
  them — both hardcode their row arrays in `App.tsx`. Not fixed here because they're outside the
  three named screens in this task's scope; flagging for a follow-up SVX-TRUTH task since it's the
  identical de-mocking fix already applied to `/connections`.
- The artifact table's per-row `<ExternalLink>` icon-button (`/evidence`) has no handler and no
  link to `artifact.external_url`/`repository_path` — minor, not in the named repair categories,
  left for a follow-up pass.

## Verification

`npm run verify:full` (this worktree, after all repairs):
- `typecheck` (`tsc -b`): **pass**
- `lint` (`oxlint`): **pass**
- `test` (`vitest run`): **pass**, 15/15 tests, 4/4 files
- `build` (`tsc -b && vite build`): **pass**
- `postbuild` → `assert-env-baked.mjs`: **fails**, exit 1 — pre-existing, unrelated to this
  session's changes (confirmed identical failure on a clean checkout before any edits). This
  worktree has no `.env` (only `.env.example`), so the build has no real `VITE_SUPABASE_URL` to
  bake in and the guardrail correctly refuses to certify the bundle. Not fixed: fabricating env
  values isn't this task's job and no real credentials are available in this worktree.

Net: `verify:fast` is fully green; `verify:full`'s failure point and reason are identical
before and after this session's changes — no regression introduced.
