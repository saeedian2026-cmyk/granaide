# P4 — Permissioned retrieval value gate

Status: **PARKED — DATA AND ROADMAP GATES NOT MET**

Owner: StallVix product authority; Claude Code alone performs any eventual live Supabase write

Modifying owner: assign one named owner before setup; that owner controls any
migrations, fixtures, benchmark code, and evidence paths for the experiment.

## Release gate

Do not execute until:

1. StallVix has at least 100 useful, permissioned, non-synthetic records from ordinary graph use.
2. The owner labels at least 20 realistic queries with relevant result IDs and
   freezes an immutable split before candidate-specific tuning: at least 60%
   tuning queries and at least 40% untouched holdout queries.
3. Current keyword/navigation behavior is measurable as the baseline.
4. Two-user RLS isolation fixtures and tests exist.
5. Vector/retrieval work is explicitly promoted from the parked roadmap.

If these are absent, the next action is ordinary graph use—not embeddings.

## Decision under test

Does hybrid Postgres retrieval materially improve useful StallVix results over existing navigation and keyword search while preserving RLS, latency, cost, and maintainability?

## Compared candidates

Run the same labelled queries against:

1. Existing navigation/search behavior.
2. PostgreSQL full-text search.
3. pgvector semantic search.
4. Hybrid full-text + pgvector fusion.

Use the same immutable permissioned corpus snapshot and query split for every
candidate. Tune only on the tuning split. Compute Recall@5, the 15-point adoption
threshold, and the final verdict only on the untouched holdout split.

## Required controls

- All schema/index changes are forward migration files.
- No production apply is part of the experiment.
- Same embedding model and version for document and query vectors.
- Record model name, dimensions, chunking rule, normalization, and generated-at version.
- RLS applies to source text, metadata, and derived embeddings.
- No service-role key reaches browser/client code.
- Two synthetic users must be unable to retrieve each other's records through every search path.
- Benchmark generation and evaluation are repeatable from committed fixtures.

## Metrics

For each candidate record:

- Recall@5 against owner labels;
- mean reciprocal rank;
- zero-result rate;
- permission leaks;
- p50 and p95 database latency;
- index size;
- embedding generation count/cost estimate;
- operator effort and maintenance burden.

## Adoption threshold

Adopt hybrid retrieval only if all are true:

1. Recall@5 improves by at least 15 percentage points over keyword search.
2. p95 database query latency is below 250 ms on the test corpus.
3. Two-user RLS isolation passes with zero leaked result IDs.
4. Three repeated runs on the same snapshot produce identical ordered top-five
   result IDs for every holdout query (ranking-difference tolerance: zero).
   Resolve equal scores deterministically by stable result ID ascending after
   candidate score descending.
5. The added migration, indexing, re-embedding, and monitoring burden is accepted explicitly.

If hybrid misses any hard requirement, keep keyword/navigation search and record the failed hypothesis. Do not retain vector infrastructure merely because it is technically interesting.

## Failure probes

- query with no relevant result;
- ambiguous acronym;
- exact project/code identifier;
- semantically similar but unauthorized record;
- deleted or reclassified record;
- stale embedding model version;
- duplicate chunk/result;
- user with zero project access.

## Evidence

Return:

- immutable corpus/query snapshot IDs;
- migration diff if any;
- RLS test output;
- machine-readable per-query results;
- metric summary and cost estimate;
- adopt/reject verdict;
- rollback/removal plan.
- exact benchmark and RLS commands, exit codes, and links to machine-readable
  results in the Work Receipt.

Passing P4 authorizes only the selected retrieval slice. It does not authorize an autonomous Context Agent, RAG chatbot, or multi-agent routing.

If the same blocker repeats on a second attempt, stop, preserve the evidence,
and escalate to the owner before retrying.
