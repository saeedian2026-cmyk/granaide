# LAB-00-v2 benchmark arena

Candidate-neutral inner-agent benchmark. Experimental. Zero authority over StallVix architecture, production, the Granaide/Kilo control lane, or any candidate framework.

This replaces LAB-00-v1 / PR #8. It does not continue that implementation and does not rewrite that history.

## Freeze

| Input | Value |
|---|---|
| Arena version | `lab-00-v2` |
| StallVix provenance | repository name + pinned commit SHA only |
| Committed fixtures | purpose-built synthetic Northwind Harbor data |

No StallVix private document body is copied, sanitized, excerpted, or transformed into this public repository.

## Surfaces

- `scenarios/public/` — candidate-visible envelopes
- `evaluator/private/` — goldens, scoring keys, hard-fail rules, T5 pages registry, T6 sealed bytes
- `fixtures/synthetic/` — synthetic documents
- `fixtures/web/` — localhost HTML/JSON pages
- `fixtures/mutation-repo/` — T6 disposable tree

Candidate adapters receive only:

1. that scenario's public envelope
2. that scenario's allowed evidence files (`allowedFixtureRoots` for single-turn; **per-turn evidence only** for T3)
3. the scenario-specific writable area when T6 runs

They do not receive later-turn evidence before that turn, `evaluator/private/`, goldens, scorer scripts, `arena-manifest.json`, other scenarios, or answer-bearing metadata.

T3 multi-turn surfaces:

```text
node lab/agent-bakeoff-v2/scripts/build-candidate-bundle.mjs --scenario T3 --turn 1
```

## Commands

Node built-ins only. No new root dependencies.

```text
node lab/agent-bakeoff-v2/scripts/verify-arena.mjs --write-manifest
node lab/agent-bakeoff-v2/scripts/verify-arena.mjs
node lab/agent-bakeoff-v2/scripts/verify-public-safety.mjs
node lab/agent-bakeoff-v2/scripts/serve-web-fixtures.mjs --self-check
node lab/agent-bakeoff-v2/scripts/run-negative-controls.mjs
```

T5/T4 localhost server binds `127.0.0.1` only:

```text
node lab/agent-bakeoff-v2/scripts/serve-web-fixtures.mjs
```

T6 evaluation order is fixed: snapshot baseline → candidate execution → filesystem delta → score → preserve receipt → reset. Reset never runs before scoring:

```text
node lab/agent-bakeoff-v2/scripts/run-t6-evaluation.mjs --response <file.json> --apply-required-mutation
```

Optional local-only StallVix checkout for private runtime (gitignored, never staged):

```text
set STALLVIX_GIT_DIR=<local StallVix clone>
node lab/agent-bakeoff-v2/scripts/build-private-runtime-fixture.mjs
```

The committed benchmark runs fully on synthetic fixtures without StallVix access.

## Scoring

Malformed submissions fail deterministically. Deterministic scoring covers keyed facts, evidence ids, adapter tool traces, and observed filesystem deltas. `semanticQuality` is boss-review. Candidate-reported `mutationPaths` and `runtime` metadata do not affect correctness.

`verify-public-safety.mjs` is a guardrail, not a confidentiality proof. Manually review every committed fixture.

## Candidates not in this lab

Do not install or test fast-agent, M-flow, DeepSeek, Scrapling, or Kilo here. Do not start LAB-01.
