# Codex work packet

- `id`:
- `goal`:
- `owner`:
- `reviewer`:
- `risk`:
- `baseline`: <branch>@<commit-sha>
- `branch`:

## Scope

- `allowed_paths`:
- `forbidden_paths`:

## Acceptance

Give each item a stable ID so the receipt can reference it instead of restating it.

- `D1`:
- `D2`:

## Proof

- Command:
- Expected result:

## Stop conditions

-

## Standing rules

Codex never merges its own work, never touches `supabase/migrations/**`, auth code,
`wrangler.toml`, or any deploy step, and never commits to `main` — see `AGENTS.md`, "Codex
lanes" and "Delivery harness". Do not restate these here.

- `overrides` (leave blank unless this packet explicitly grants an exception):
