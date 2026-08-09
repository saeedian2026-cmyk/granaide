---
name: stallvix-authority
description: >-
  Load StallVix authority model (SPEC / SCOPE / BACKLOG / AGENTS) before any
  investigation or implementation. Use when starting StallVix work, checking
  whether a task is authorized, or resolving conflicts between research and
  product truth. Prevents treating Observatory or Backlog as implementation authority.
metadata:
  category: stallvix
  product: granaide-stallvix-kilo-pack
  source:
    repository: granaide
    path: products/stallvix-kilo-pack/skills/stallvix-authority
---

# StallVix authority

## Compact rule

```text
SPEC.md     = what the product is / may become          (durable)
SCOPE.md    = what may be worked on NOW                 (human-first execution)
BACKLOG.md  = what may be considered later              (not authorization)
AGENTS.md   = how workers must behave                   (execution contract)
```

A valid SPEC requirement is **not** automatically active work. A Backlog item is **not** authorization. Observatory research (including StallVix PR #35) has **zero** implementation authority until owner/Claude promotes a slice into SCOPE/task packets.

## Procedure

1. Read `SPEC.md` for durable product constraints relevant to the job.
2. If `SCOPE.md` exists, confirm the job is in **Now** — not Parked/Rejected.
3. Read `AGENTS.md` (repo) plus pack `AGENTS.md` for forbidden paths and evidence rules.
4. If `CURRENT_STATE.md` exists, treat it as operational truth for sequencing (e.g. graph-before-Kilo-embed).
5. State in one short paragraph: authorized? blocked? parked?

## Kilo position

Kilo is a **Level-C replaceable executor** (live workspace). StallVix owns identity, RBAC, evidence, and graph. Do not invent Kilo-owned durable memory as product truth.
