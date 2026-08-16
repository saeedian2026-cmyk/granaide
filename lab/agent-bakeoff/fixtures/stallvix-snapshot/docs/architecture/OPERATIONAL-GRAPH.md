```text
Authority: canonical current operational graph semantics.
Does not grant permission to modify the implementation.
Current execution authorization is defined by owner-approved task packets.
```

# Operational graph

**Status:** live. Owner-approved §7 ruling item 2 (D2, APPROVED — reduced ceremony), 2026-08-08.
**Scope of this file:** what the console's data graph *means* — nodes, edges, cardinality,
optionality, and which invariants are actually enforced. It is descriptive of the live database and
is verified against it, not aspirational.

This file is the canonical answer to "what does the graph assert?". `SPEC.md` states durable product
requirements and links here rather than duplicating graph semantics (**SR-1**).

---

## 1. Node catalogue — the 10 live graph tables

Capped deliberately at the tables that carry graph semantics today. The database has 30 base tables;
the other 20 (auth/profile, access control, backlog, tooling, `kv_store_*`) are real but are not part
of the operational graph and are not catalogued here. **Nothing is listed in this file that does not
exist in production.**

| ID | Table | What one row is | Rows (2026-08-08) |
|---|---|---|---|
| OG-N-001 | `projects` | A tracked project — the RLS scope root | 3 |
| OG-N-002 | `project_gates` | A verification gate on a project | 6 |
| OG-N-003 | `project_updates` | A work receipt: something happened, by whom, with what evidence | 37 |
| OG-N-004 | `findings` | A defect or observation raised against a project | 32 |
| OG-N-005 | `artifacts` | A stored file or link offered as evidence | 30 |
| OG-N-006 | `knowledge_topics` | A subject that exists across projects | 0 |
| OG-N-007 | `project_workstreams` | One project's instance of a topic — the claim-bearing node | 0 |
| OG-N-008 | `knowledge_links` | A typed edge from a workstream to any graph entity | 0 |
| OG-N-009 | `project_update_findings` | Junction: which findings a receipt touched | 0 |
| OG-N-010 | `finding_evidence` | Junction: which artifacts evidence a finding | 33 |

OG-N-006 through OG-N-008 shipped 2026-08-07 and are empty: the schema is live, no UI writes to it
yet. That is a known state, not a gap in this document.

## 2. Edge catalogue

All sixteen foreign keys among the catalogued nodes, enumerated from live
`information_schema` on 2026-08-08.

| ID | Edge | Cardinality | Optional? |
|---|---|---|---|
| OG-E-001 | `project_gates.project_id` → `projects` | many-to-one | required |
| OG-E-002 | `findings.project_id` → `projects` | many-to-one | required |
| OG-E-003 | `findings.related_gate_id` → `project_gates` | many-to-one | optional |
| OG-E-004 | `artifacts.project_id` → `projects` | many-to-one | required |
| OG-E-005 | `artifacts.related_gate_id` → `project_gates` | many-to-one | optional |
| OG-E-006 | `project_updates.project_id` → `projects` | many-to-one | required |
| OG-E-007 | `project_updates.gate_id` → `project_gates` | many-to-one | optional |
| OG-E-008 | `project_updates.artifact_id` → `artifacts` | many-to-one | optional |
| OG-E-009 | `project_updates.project_workstream_id` → `project_workstreams` | many-to-one | optional — **coercible** |
| OG-E-010 | `project_update_findings.project_update_id` → `project_updates` | junction side | required |
| OG-E-011 | `project_update_findings.finding_id` → `findings` | junction side | required |
| OG-E-012 | `finding_evidence.finding_id` → `findings` | junction side | required |
| OG-E-013 | `finding_evidence.artifact_id` → `artifacts` | junction side | required |
| OG-E-014 | `project_workstreams.project_id` → `projects` | many-to-one | required |
| OG-E-015 | `project_workstreams.knowledge_topic_id` → `knowledge_topics` | many-to-one | required |
| OG-E-016 | `knowledge_links.project_workstream_id` → `project_workstreams` | many-to-one | required |

**OG-E-017 — the untyped edge.** `knowledge_links.(entity_type, entity_id)` points at a `finding`,
`artifact`, or `project_update` with **no foreign key**, because Postgres cannot express a polymorphic
reference. It is constrained only by a CHECK on `entity_type` and by
`enforce_knowledge_links_same_project`. This is the one place in the graph where referential integrity
is enforced by trigger rather than by the database's own FK machinery, and it is therefore the one
place where a dangling edge is possible. Recorded explicitly so it is never assumed safe by analogy
with the other sixteen.

OG-E-009 is marked *coercible*: an invalid value is nulled and surfaced rather than rejected, per
[`CLASSIFICATION-FIELD-COERCION.md`](./CLASSIFICATION-FIELD-COERCION.md). Every other edge in the
table rejects.

## 3. Edge vocabulary on `knowledge_links`

`relation_type` carries two families:

- **Structural:** `requires`, `blocks`, `related`, `part_of`
- **Evidentiary:** `supports`, `contradicts` — added 2026-08-08 by the D3 amendment

Evidentiary state is **derived from edges, not asserted by an enum**. A workstream's claim is
`SUPPORTED` / `DISPUTED` / `UNSUPPORTED` according to what points at it. This was a deliberate choice
not to add an eighth verification vocabulary to the seven that already exist and do not compose — see
[`STATE-VOCABULARY-CONTRADICTIONS.md`](./STATE-VOCABULARY-CONTRADICTIONS.md) §2.

### What the two evidentiary values buy

Two questions become answerable that no state column could answer, because both are about *what
points at a claim*, not about the claim's own field:

```sql
-- 1. Every claim with nothing backing it, and every claim under dispute.
select w.title,
       count(*) filter (where kl.relation_type = 'supports')    as supporting,
       count(*) filter (where kl.relation_type = 'contradicts') as contradicting,
       case when count(*) filter (where kl.relation_type = 'supports')    = 0 then 'UNSUPPORTED'
            when count(*) filter (where kl.relation_type = 'contradicts') > 0 then 'DISPUTED'
            else 'SUPPORTED' end as evidentiary_state
from public.project_workstreams w
left join public.knowledge_links kl
  on kl.project_workstream_id = w.id
 and kl.relation_type in ('supports', 'contradicts')
group by w.id, w.title
order by supporting, w.title;

-- 2. Every piece of evidence attached to a claim it contradicts.
select w.title as claim, kl.entity_type as evidence_kind, art.title as evidence
from public.knowledge_links kl
join public.project_workstreams w on w.id = kl.project_workstream_id
left join public.artifacts art on art.id = kl.entity_id and kl.entity_type = 'artifact'
where kl.relation_type = 'contradicts'
order by w.title, art.title;
```

Both were run against production on 2026-08-08 inside transactions that were rolled back, seeded
against real project and artifact rows. Query 2 returned the seeded contradicting artifact by title,
confirming the join path through the untyped OG-E-017 edge resolves. Nothing persisted: topics,
workstreams and links all re-counted 0 afterwards.

Today's answers are empty because OG-N-006..008 have no rows. The point is that the questions are
*expressible* — they were not, when a claim was prose inside `project_updates.event_title`.

## 4. Enforced invariants

Enforced in the database. Not conventions.

| Invariant | Mechanism |
|---|---|
| Every catalogued table is RLS-scoped to its project | RLS policies on all 10 tables |
| No cross-project edge on `artifacts`→gate | `enforce_artifact_gate_same_project` |
| No cross-project edge on `knowledge_links` | `enforce_knowledge_links_same_project` |
| No cross-project edge on `finding_evidence` | `enforce_finding_evidence_same_project` |
| No cross-project edge on `project_update_findings` | `enforce_project_update_findings_same_project` |
| A gate cannot be Verified while blocking findings are open | gate verification invariant trigger |
| One workstream per (project, topic) | unique index |
| One edge per (workstream, entity_type, entity_id, relation_type) | unique index |
| Reverse traversal is indexed | `idx_knowledge_links_entity`, `idx_project_workstreams_topic` |

### Known gap — the QA evidence path is not same-project protected

`qa_checks` and `qa_evidence` are outside the node catalogue (they are a domain path, not
`knowledge_links`-addressable), but the gate-verification invariant **depends on them**: `SPEC.md`
Amendment 3 counts qualifying evidence as artifacts linked directly via `related_gate_id` *or* via a
`qa_checks` row linked to the gate, joined through `qa_evidence`.

Those two paths are protected asymmetrically. Verified against production 2026-08-08:

| Path | Cross-project protection |
|---|---|
| `artifacts` → gate | `enforce_artifact_gate_same_project` trigger |
| `finding_evidence` → artifact | `enforce_finding_evidence_same_project` trigger |
| **`qa_evidence` → artifact** | **None.** Two foreign keys (`qa_evidence_artifact_id_fkey`, `qa_evidence_qa_check_id_fkey`) and **zero triggers.** |

Foreign keys guarantee the rows *exist*; they say nothing about whether they belong to the same
project. So a `qa_check` on project A can reference an artifact from project B, and the gate
invariant would count it toward A's evidence threshold. Every sibling path blocks exactly this.

**Currently unexploitable:** `qa_evidence` has **0 rows** and `qa_checks` has 5. The gap is
structural, not active. It is recorded rather than fixed because closing it is a migration with its
own verification, not a rider on a documentation commit — and because the fix should be decided
alongside whether `qa_checks` belongs in the catalogue at all.

This is the second place, after OG-E-017, where an integrity guarantee that reads as universal is
not. Both are recorded so neither is assumed safe by analogy with the four triggers above.

### Known boundary — `knowledge_links`/`finding_evidence` are not gate evidence

Deliberate, ruled by the owner 2026-08-11 (`docs/audit/SVX-VERIFIED-GATE-EVIDENCE-SCOPE-01.md`),
not an oversight. Confirmed live by a rolled-back probe the same day
(`docs/agent-work/preview-logs/verified-gate-evidence-scope-probe.sql`, 9/9 assertions): the
gate-verification invariant's evidence count (`private.check_gate_verification_invariant()`'s
inline query, and its extracted twin `private.gate_qualifying_evidence_count()` behind the
keep-Verified lock) counts only `artifacts` linked via `related_gate_id`, and `qa_evidence`↔
`qa_checks` linked via `related_gate_id`. Neither counts anything reachable through `knowledge_links`
or `finding_evidence`.

This is structural, not merely unimplemented: no edge exists from `project_workstreams` to
`project_gates` anywhere in this file's edge catalogue (§2), and `knowledge_links.entity_type`'s
CHECK constraint (`20260807120000:67-69`) does not admit `'gate'` as a target — a graph-attached
evidence item has no way to declare which specific gate it would count toward even if the count
queries were widened to look for it. Making graph evidence count toward a gate's floor would require
first adding that edge (a schema decision with its own review), which is why this is recorded as a
ruling rather than left implicit.

Practical effect: attaching or withdrawing evidence via the graph subsystem (`knowledge_links`,
`finding_evidence`) has zero effect on any gate's Verified eligibility, or on whether an
already-Verified gate stays valid. The graph is a separate "what do we know" layer from the gate
subsystem's "is this specific requirement met" layer, and a user attaching evidence to a project's
workstream should not expect it to move that project's gates.

**Parked cleanup, not fixed here:** `gate_qualifying_evidence_count()` and
`check_gate_verification_invariant()`'s inline count are two independently-maintained copies of the
same query, written three weeks apart (`20260714160000:30-34` vs `20260802190000:19-42`). A future
session should collapse them into one shared function (no behavior change) so a later edit to the
qualifying-evidence definition — including a future reversal of this boundary — has exactly one
place to land. Not queued by the owner; recorded so it isn't rediscovered.

### Data shape worth knowing

Verified against production 2026-08-08. Not invariants — measurements, which decay:

- **12 of 30 artifacts share a `related_commit` with another artifact**, across 4 groups, giving 8
  redundant copies. A deduplication need that is measurable rather than hypothetical.
- **16 of 32 findings carry any evidence at all.** Half of the recorded findings have nothing
  attached — which is the same shape of problem the D3 evidentiary edges exist to make queryable,
  one level down.
- **4 of 37 `project_updates` set `artifact_id`.** OG-E-008 is optional and rarely used.

## 5. Why this contract is written down at all

Steps 3–4 of the data-model dependency chain — the Phase 1 schema and the capture RPC — shipped to
production before steps 1–2, the vocabulary and authority questions, were settled. That is not a
reason to unwind them; the schema is sound and verified against production above. It is the reason
this file exists.

**The cost of revising graph semantics rises with every receipt written under them.** With 37
`project_updates` and 33 `finding_evidence` rows already recorded, the vocabulary those rows were
written under is no longer freely changeable — a revision now is a data migration and a
re-interpretation of history, not an edit. Writing the contract down does not freeze it; it makes
each future change a decision someone has to make on purpose, with the current state legible, rather
than a drift nobody notices until the counts disagree.

Recorded from the owner's *Operating Architecture Map*, figure 2.

## 6. Rules in force

Adopted from the governance-graph requirements at the reduced ceremony level the owner ruled.

| Rule | Statement | State |
|---|---|---|
| **GCR-2** | After a graph-semantic change, this file SHALL describe the resulting canonical model. | **In force** |
| **GCR-3** | Implementation SHALL conform to this contract. | **In force** |
| **GCR-4** | Tests SHALL cover affected invariants where testable — cardinality, optionality, source of truth, authorization, supersession, illegal-edge prevention, referential identity. | **In force** |
| **SR-1** | `SPEC.md` SHALL link here rather than duplicate graph semantics. | **In force, satisfied.** The link is placed at `SPEC.md` §F and states precedence: where §F and this file disagree about what the graph asserts, this file wins and §F is stale. |
| **GCR-1** | Every graph-affecting modification SHALL be authorized by `SCOPE.md`. | **Adopted, dormant** — `SCOPE.md` does not exist (ruling item 6 keeps it parked). Until it does, owner-approved task packets are the authorization surface. |
| **SR-2** | `SCOPE.md` SHALL reference the graph baseline for admitted graph work. | **Adopted, dormant** — same dependency. |

The two dormant rules are recorded rather than dropped so that activating `SCOPE.md` later is a
matter of switching them on, not rediscovering them.

## 7. Deferred — until a second reviewer genuinely exists

These were assessed and are **not** in force. Deferred, not rejected, and not silently dropped. The
gating condition is a real second party reviewing — not a formality, and not a date.

| Rule | Why deferred |
|---|---|
| **GCR-5** — graph-affecting PRs declare affected graph IDs | Deferred until second reviewer exists |
| **GCR-6** — undocumented semantic change is a REVIEW BLOCKER | Deferred until second reviewer exists |
| **GCR-7** — unauthorized architecture change is a REVIEW BLOCKER | Deferred until second reviewer exists |
| **GCR-8** — scope overrun is a REVIEW BLOCKER | Deferred until second reviewer exists |
| **GCR-9** — high-risk areas require narrow ownership and independent review | Deferred until second reviewer exists |
| **AC-11** — independent review | Deferred until second reviewer exists |
| **SR-3 / SR-4 / SR-5** — packets, PRs and evidence declare affected graph IDs | Deferred until second reviewer exists |
| Per-PR impact declarations | Deferred until second reviewer exists |

The reason is uniform: a REVIEW BLOCKER only means something when the reviewer and the author are
different people. With one person in both roles these rules produce ceremony that records nothing —
process standing in for the reviewer it presumes.

## 8. Parked — unchanged

The `AGENTS.md:66` Parked list is not modified by this document. Nothing here activates parked work,
and `SCOPE.md` / Scope Foundation stays parked per ruling item 6.

## 9. Provenance

- Requirements input: `CLAUDE_REPO_GOVERNANCE_GRAPH_REQUIREMENTS.md` (GPT Plus, `docs/audit/ACTOR-BRIEFS.md`
  brief 3). Its primary recommendation — that the graph contract lives in this file — is adopted. Its
  ~18-node imagined catalogue is not; §1 lists only what exists.
- Synthesis: `docs/audit/DATA-MODEL-ARCHITECTURE-SYNTHESIS.md` §5.2.
- Ruling: `docs/audit/DATA-MODEL-VERDICT.md` §A.13.2.
- Node/edge/invariant tables verified against production 2026-08-08.
- §5 records the dependency-chain reasoning from the owner's *Operating Architecture Map*, figure 2.
- §4's QA-path gap and data-shape measurements come from the owner's IcePanel landscape,
  *StallVix Data Foundation* (2026-08-07). That model is itself downstream of this file — it uses the
  OG-N/OG-E identifiers — so it is a reading of the graph, not a second source of truth for it; where
  the two differ, this file governs. Its `related_commit` figure is restated here from a direct
  recount (12 sharing / 4 groups / 8 redundant, rather than 9). Its QA-path observation is confirmed
  and, on checking, sharper than stated: the gap is load-bearing because the gate-verification
  invariant traverses that path.
