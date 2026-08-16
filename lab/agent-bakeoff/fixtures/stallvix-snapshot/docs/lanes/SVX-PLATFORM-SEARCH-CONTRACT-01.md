# SVX-PLATFORM-SEARCH-CONTRACT-01 — Operator Search Contract

Status: **PROPOSED — awaiting owner sign-off**
Corrected: 2026-08-11 — entity set marked candidate; storage strategy un-frozen (Codex P1).
Amended: 2026-08-12 by `SRCH-00` — entity set validated, columns corrected, gate returned **NARROW**.
Amended: 2026-08-12 by `SRCH-00B` — §3.2 closed: no physical index. Backend contract frozen.
Amended: 2026-08-12 by `SRCH-01B` — §3.3 query parsing: trailing-token prefix matching, with three
stated fallbacks. **Executed** — verified on real production data and shipped.
Lane: `SVX-PLATFORM-LANE-01`
Origin: `RF-SRCH-001`, promoted by owner 2026-08-11 — the lane's only promoted candidate
Implementation authority: none. This defines *what is being built*, not permission to build it.

---

## 1. What search is, and what it is not

Search is one of six different jobs that all look like "finding something". Keeping them separate is
most of the design:

| The operator wants to… | Correct mechanism | Owner |
| --- | --- | --- |
| Open a project or section they already know | navigation / exact lookup | UI shell |
| See only open High findings | structured filter | the surface itself |
| Find receipts mentioning an RLS failure | **lexical full-text search** | **this contract** |
| Find a title they half-remember or mistyped | fuzzy/trigram lookup | deferred, `SRCH-04` at earliest |
| Follow evidence attached to a workstream | FK / junction / graph traversal | Evidence Graph |
| Find "things like this past failure" | semantic retrieval | parked, needs a new Forge promotion |

A search box that absorbs filtering, navigation, and graph traversal is how consoles end up with one
mediocre feature instead of four good ones. **Row three is the whole of v1.**

---

## 2. V1 entity set — **VALIDATED by `SRCH-00`, 2026-08-12**

Five entity families. Deliberately narrower than the research proposed, because each family added is
an RLS surface that must be proven, a result renderer that must be designed, and a ranking
interaction that must be tuned.

`SRCH-00` measured this set against live row counts, text distribution and RLS policy. The five
families are **confirmed** — no additions, no removals. Column names are now the verified ones
(`!` = `NOT NULL`); three were wrong or incomplete in the pre-measurement draft.

| Entity | Indexed text (verified) | Why it is in v1 |
| --- | --- | --- |
| `projects` | `name!`, `slug!`, `summary!` | global search without projects is not global search |
| `project_updates` | `event_title` (**NULL on 82.5% of rows**), `update_note!` | the highest-value operator text in the console — receipts |
| `findings` | `title!`, `description!`, `fix_note` (**NULL on 62.5%**) | what operators actually go looking for |
| `project_gates` | `name!`, `purpose!`, `blocker`, `next_action` | the console's spine; blockers are searched by text |
| `artifacts` | `title!`, `description`, `repository_path`, `original_filename`, **`category!`, `source_type!`** — **metadata only** | evidence lookup |

Three amendments, each with a reason in the audit annex:

1. `project_updates` has no `title` column — it is `event_title`, and it is **null on 33 of 40
   rows**. `findings`' "closure note" is `fix_note`. Naming corrections, but see §3.2: the first has
   a real consequence for ranking.
2. `artifacts` gains `category` and `source_type`. Both are `NOT NULL` and the **existing
   client-side artifact filter already searches them** — without these, v1 search would be strictly
   worse at finding artifacts than the filter it supersedes.
3. **Archived rows, stated rule:** no soft-delete or archive column exists on any of the five
   families. Archived projects and their children **remain searchable**; results carry the parent's
   status so the surface can label them. Search must not introduce a soft-delete concept.

Deferred to `SRCH-03` (not rejected): `qa_checks`, `project_workstreams`, `backlog_items`.
Deferred with an open question: `knowledge_topics` — it carries owner-scope read semantics
(`20260809020000_topic_read_owner_scope.sql`) that global search must not flatten. Its scoping is a
`SRCH-03` decision, not a v1 guess.

**Out of scope entirely** (would require a separate document-ingestion contract): PDF/image
contents, uploaded Markdown bodies, GitHub file contents, Figma contents, external web pages, chat
transcripts, model context, embeddings.

Note the asymmetry that makes artifacts safe: we index what the console *said about* a file, never
what is *inside* it.

---

## 3. Architecture

### 3.1 One RLS-invoker RPC — ruling on PR #50's open question

PR #50 left the choice between "one union RPC" and "per-entity client queries normalized by a client
service" for a later audit. It should not be deferred: it is the security architecture, and it is
decidable now.

**Ruling: one `security invoker` SQL function, `public.search_console(...)`, returning a fixed row
shape.** Reasons, in priority order:

1. **One authorization context.** The function runs as the caller. Every underlying RLS policy
   applies unchanged, with no second enforcement copy to keep in sync — the same reason the write
   path chose triggers at the parent over reconciliation logic in each caller.
2. **Fail-closed is achievable.** One statement, one transaction, one outcome. Client fan-out across
   five tables makes partial failure the *normal* case, and a search that silently drops one entity
   family and presents the rest as complete violates the console's missingness rules.
3. **Ranking must be global.** Relevance is meaningless if each entity family is ranked in its own
   request and stitched together by arrival order in the browser.
4. **The contract can be tested.** A function is a pgTAP target. Five ad-hoc client queries are not.

Rejected alternatives and why: an Edge Function adds a middleware hop that re-implements auth for no
capability gain; a client search service puts the security boundary in the least trustworthy place
in the system.

### 3.2 Index strategy — **CLOSED by `SRCH-00B`, 2026-08-12: no physical index**

Two things are binding here. A third is deliberately not.

**Binding — no derived table (D3).** No `search_documents`. A denormalized index table is a second
write path that must stay in sync with every canonical writer.

**Binding — immutability.** `to_tsvector` is only immutable with an **explicit regconfig**
(`to_tsvector('english', …)`). The single-argument form is not, and cannot be used in a generated
column or an index expression. `setweight` gives titles precedence over bodies without any
application-side ranking logic, in whichever shape is chosen.

**Ranking under an empty weight-A — added by `SRCH-00`.** `setweight` is the whole of the ranking
design, and for the highest-value family the A-weight is **empty on four rows in five**
(`event_title` null on 82.5% of `project_updates`, `fix_note` null on 62.5% of `findings`).
`coalesce(…, '')` keeps it from erroring; it does not make the ranking correct. `SRCH-01` must state
what ranking does when there is no title, and prove with a pgTAP case that a title-less update is
still findable and rankable by its body.

**Not binding — the physical representation.** The first draft of this contract froze *stored
generated `tsvector` columns + `CREATE INDEX CONCURRENTLY`* here. Codex raised a P1 against it and it
holds:

> `ALTER TABLE ... ADD COLUMN ... GENERATED ALWAYS AS (...) STORED` **rewrites the whole table** and
> holds `ACCESS EXCLUSIVE` for the duration — it cannot take the fast-default path, because the value
> is computed per row. `CREATE INDEX CONCURRENTLY` only protects the *index build that follows*.

The migration's most dangerous lock was the step the plan wasn't looking at, so the strategy is
un-frozen. `SRCH-00B` chooses among the master §4a candidates — stored generated column, expression-
only GIN index, plain column plus trigger plus batched backfill, or no physical index yet — using
`SRCH-00`'s measured row counts and text sizes, and states the lock each takes.

Constraints on that choice:

- Only **Postgres-native** options are eligible. A difficult migration is not a licence to reach for
  a search vendor (D2).
- Whatever is chosen must state its **drift story**. A generated column cannot drift, which is D3's
  argument restated as a schema property; a trigger-maintained column can, and would have to justify
  itself against exactly the failure class this project spent weeks repairing in the junctions.
- If the chosen shape needs `CREATE INDEX CONCURRENTLY`, note that it **cannot run inside a
  transaction block** — `SRCH-00B` must define the non-transactional migration exception path,
  including detection and cleanup of the invalid index a failed concurrent build leaves behind.
- If no shape lands safely, kill condition K4 fires: narrow, or park.

**`SRCH-00`'s measurement, handed to that gate (2026-08-12).** 111 rows and 39.6 KB of text across
all five families; growth decelerating; a **full ranked cross-entity search with no index of any
kind executes in 9.6 ms** on production. The gate returned **NARROW**: v1 adds no new column and no
new index. `SRCH-00B` still makes the selection — but on this data it is short, and the Codex P1 is
**dissolved rather than mitigated**: no `ALTER TABLE` means no rewrite, no `ACCESS EXCLUSIVE`, no
`CIC`, no non-transactional exception path, no invalid index to clean up. See
`SVX-PLATFORM-LANE-01-SRCH-00-AUDIT.md` §8, including the stated re-entry trigger that reopens this
gate in full.

**`SRCH-00B`'s selection (2026-08-12) — this section is now closed.** Shape: **no physical index,
rank on the fly.** Lock profile: none — 0 rows rewritten, 0 tables locked, one `pg_proc` row written.
Drift story: **no derived state exists, so nothing can drift** — stronger than a generated column's
"cannot drift", which is a property of a thing that still exists. The `CREATE INDEX CONCURRENTLY`
exception path, invalid-index cleanup and batched backfill contemplated above are **not required and
were not written**. The frozen backend contract `SRCH-01` implements is
`SVX-PLATFORM-LANE-01-SRCH-00B-DESIGN.md` §3; where it decides something this contract left open it
is marked there. Nothing in it relaxes §5.

### 3.3 Query handling

- Parse with `websearch_to_tsquery('english', p_query)` — tolerant of raw operator input, quotes and
  `-` exclusion, and it cannot be made to throw on malformed input the way `to_tsquery` can.
- Rank with `ts_rank_cd`, then a deterministic tiebreak: `occurred_at`/`updated_at` desc, then `id`
  asc. Without the tiebreak, equal-rank results reorder between identical requests.
- Snippets via `ts_headline` on the already-authorized row only. Never generate a snippet from a row
  the caller could not otherwise read — this is the most likely accidental leak in the whole feature.
- Empty, whitespace, or sub-minimum-length queries return **zero rows**, not the table.
- Hard `p_limit` with a server-side ceiling. Keyset pagination is `SRCH-04`, not v1.

**Amendment, 2026-08-12 — trailing-token prefix matching (`SRCH-01B`, executed).** As shipped by
`SRCH-01`, this section produces a search box that appears broken while
being correct: `websearch_to_tsquery` matches lexemes, so `migr` matches nothing until `migration` is
typed in full — while the two client-side filters v1 coexists with (`SRCH-00 §5`) use
`String.includes()` and *do* match partial tokens today. `SRCH-01B` therefore takes the serialised
tsquery and appends `:*` to its final lexeme, so `rls migr` becomes `'rls' & 'migr':*`.

`websearch_to_tsquery` remains the parser — quoted phrases, `-exclusion` and its inability to throw
on raw operator input are all unchanged. The rewrite **falls back to the unmodified parse** in three
cases, because in each one a prefix changes the query's meaning rather than widening it: empty
serialisation (all stop words, no final lexeme); a trailing phrase operator (`<->`); and a trailing
negation (`!`), which is the dangerous one — prefixing a negated term excludes more than was asked,
and produces a *shorter* list, which looks like an honest answer.

This is prefix matching, not fuzzy matching. `authentcation` → `authentication` is trigram, which
stays parked under §7 and reopens only on recorded operator spelling failures.

### 3.4 Scope semantics

```text
search_console(p_query, p_project_id, p_entity_types, p_limit)

p_project_id IS NULL  →  global: every row RLS already lets the caller read
p_project_id = <uuid> →  narrowed to that project
```

Per **D5**: `p_project_id` is a filter, never an authorization argument. A caller who guesses another
project's UUID gets zero rows — not because the function checks, but because RLS never exposed those
rows to the function in the first place. **If any part of the implementation needs to validate
`p_project_id` for security reasons, the architecture is wrong and `SRCH-01` stops** (kill condition
K2).

---

## 4. Result shape

Every result is explainable and navigable, or it is not a result:

```text
entity_type          -- 'project' | 'project_update' | 'finding' | 'gate' | 'artifact'
entity_id
project_id           -- null only for global-scope entities
project_name
title
snippet              -- ts_headline over authorized text
rank                 -- ts_rank_cd
status / severity    -- where the family has one
occurred_at          -- family-appropriate timestamp
canonical_route      -- where clicking it goes
```

`canonical_route` is what stops search becoming a parallel UI. Every result hands the operator back
to the canonical surface and inspector that already owns that record.

---

## 5. Security contract

Search security is a blocker, not polish. It is the first console feature that spans projects in a
single response by design.

**Hard requirements — all are `SRCH-01` acceptance criteria:**

1. Function is `security invoker` and `stable`. `security definer` is **rejected by default**; it may
   only be reconsidered with a written proof of read-equivalence to normal caller reads.
2. `revoke all on function ... from public` and `grant execute ... to authenticated`. Function
   EXECUTE defaults to PUBLIC — without this, a new function silently re-opens the surface that
   `20260810010000_revoke_anon_table_grants.sql` deliberately closed to `anon`.
3. Any view introduced must be `security_invoker = true`; ordinary Postgres views run as their owner.
4. No leakage through side channels: snippets, counts, facets, autocomplete, typo suggestions, or
   error text.
5. No `service_role` in any interactive search path.

**Adversarial pgTAP required in CI** — the same standard the write-path guards were held to:

- super-admin global search returns all permitted rows;
- a project-scoped member sees their project and not a sibling project;
- a lower-privilege role returns only its readable rows;
- a no-access user returns zero rows;
- a guessed foreign `p_project_id` returns zero rows and does not error differently from an empty
  result *(error-shape parity — a distinguishable error is itself an existence oracle)*;
- snippets never contain terms from inaccessible rows;
- archived/soft-deleted rows behave per an explicit stated rule rather than by accident.

Proof method, given there is no staging environment: pgTAP in CI plus a rolled-back probe against
production, exactly as the blast-radius packets did.

---

## 6. Client behaviour (binding on `SRCH-02`/`-04`)

- Debounce input; do not fire per keystroke.
- Cancel/supersede obsolete in-flight requests — a slow earlier response must never overwrite a fast
  later one.
- Minimum query length before firing.
- Every state has a defined presentation: empty query, no results, loading, error, and truncated
  ("showing first N"). Truncation is stated, never implied.
- On error: **fail closed** (D7). Show the failure. Never show a shorter list.

**Availability (owner ruling, 2026-08-11 — master §8):**

- Search entry point is offered to **`operator` and above**. `viewer` sees no search affordance. This
  is a UX-scope gate, not enforcement — `viewer` keeps RLS read access to the same rows through
  normal surfaces. No claim of security may be attached to it.
- **Hidden in unauthenticated preview/demo mode.** Preview runs on local demo arrays with no auth
  context, so there is no `search_console` call to make. A disabled affordance is permitted; a
  client-side demo search is not — it would be exactly the parallel client search path §3.1 rejects,
  and its ranking and scope would drift from the real one.

---

## 7. What measurement would have to show to reopen this

Parked options are not rejected forever; they are waiting on evidence. Stating the trigger now stops
the argument being re-litigated on vibes later.

| Parked | Reopens when |
| --- | --- |
| External search engine (ES/Meili/Typesense/Algolia) | `SRCH-00`'s baseline plus `SRCH-05` real use show a latency or capability limit that survives reasonable indexing and query design |
| Redis / caching layer | measured repeated-identical-query volume high enough that invalidation complexity is worth it |
| `pgvector` / semantic retrieval | a labelled set of real operator queries that lexical search repeatably fails, *plus* defined RLS/deletion/update behaviour for derived vectors |
| Derived `search_documents` table | union query complexity or measured plan cost, not result-shaping convenience |
| Trigram / fuzzy matching | recorded operator queries that fail on spelling — the cheapest of the five to reopen |

Order of operations for the whole lane, unchanged: **ordinary use → useful canonical data → lexical
retrieval proof → evidence of retrieval failure → anything fancier.**
