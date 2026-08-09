---
name: stallvix-safe-change
description: >-
  Enforce StallVix safe-change discipline for Kilo implementer jobs: one modifying
  owner, allowed paths, stop conditions, and verification commands. Use before
  editing StallVix code or docs. Blocks migrations, auth, deploy, and main pushes.
metadata:
  category: stallvix
  product: granaide-stallvix-kilo-pack
  source:
    repository: granaide
    path: products/stallvix-kilo-pack/skills/stallvix-safe-change
---

# StallVix safe change

## Before any edit

1. Confirm job is authorized (`stallvix-authority` skill).
2. Confirm you are the **only** modifying owner on overlapping paths.
3. Inspect current files — do not invent structure.
4. State intended change + likely files in one short note.

## Allowed by default (implementer)

- `src/**`
- `docs/**`

Narrow further if the task packet specifies `allowed_paths`.

## Always forbidden

- `supabase/migrations/**`
- Auth / RLS redesign
- `wrangler.toml` and deploy actions
- `.env`, `.env.*`, secrets
- Push to `main` / force push
- Supabase service-role usage
- Unrelated cleanup or redesign

## Stop conditions

- Scope or authority unclear
- Two failed attempts on the same blocker
- Required change needs a forbidden path → escalate; do not “just do it”
- Observatory/research cited as if it were SCOPE

## After edits

1. Run declared checks (`npm run typecheck`, `npm run lint`, `npm test` as relevant).
2. Inspect diff — no secret leakage.
3. Emit Work Receipt (`stallvix-receipt` skill).
4. Do not merge, deploy, or invent the next task unless the owner asked.
