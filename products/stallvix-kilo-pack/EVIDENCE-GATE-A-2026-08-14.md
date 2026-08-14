# Gate A evidence — 2026-08-14

This record covers the source candidate and its exact StallVix consumer copy.
It does not claim an authenticated runtime Gate B pass.

## Locked revisions

- Source payload: Granaide `db7ec0b32972e0227a37ec3733b15aa670d78991`
- Consumer install: StallVix `f6e3904` on draft PR #69
- Source manifest: [`PAYLOAD-MANIFEST.json`](./PAYLOAD-MANIFEST.json)
- Product/install map: [`pack.json`](./pack.json)
- Consumer lock: [StallVix `GRANAIDE-KILO-PACK-LOCK.json`](https://github.com/saeedian2026-cmyk/StallVix/blob/codex/stallvix-kilo-test-a/docs/agent-work/GRANAIDE-KILO-PACK-LOCK.json)

## Source results

Run from the isolated Granaide source worktree at the payload revision:

| Command | Exit | Recorded result |
|---|---:|---|
| `npm run test:stallvix-kilo-pack` | 0 | 8/8 pass, including wrong-worktree launcher rejection |
| `npm run lint` | 0 | ESLint pass |
| `npm run build` | 0 | Next.js production compile and TypeScript pass |
| `git diff --check` | 0 | no whitespace errors |
| staged JWT/API-key-shaped scan | 0 | zero matches |

The test implementation is [`scripts/stallvix-kilo-pack.test.mjs`](../../scripts/stallvix-kilo-pack.test.mjs).

## Consumer results

Run from the isolated StallVix consumer worktree at `f6e3904`:

| Command | Exit | Recorded result |
|---|---:|---|
| `npm run test:kilo-install` | 0 | 4/4 pass; source commit, manifest, installed hashes, safe default, and launcher binding verified |
| `npm run test:kilo-policy` | 0 | Kilo 7.4.20; edit/bash/grep/task denied; representative sensitive reads denied; only external exception under `.kilo-runtime-data/kilo/tool-output/*` |
| `npm run typecheck` | 0 | TypeScript pass |
| `npm run lint` | 0 | pass with pre-existing warnings outside the candidate paths |
| staged JWT/API-key-shaped scan | 0 | zero matches |

StallVix draft PR #69 also has two successful `pgTAP against a from-scratch
migration replay` GitHub checks. The candidate makes no database changes; those
checks corroborate that the branch did not disturb the existing database lane.

## Not proved here

- credential rotation;
- P2 authenticated negative probes;
- same-session resume or incremental streaming;
- runtime proof for the newly bound launcher;
- bounded implementer authorization;
- pilot value or commercial readiness.

Those remain unchecked in [`RELEASE-CHECKLIST.md`](./RELEASE-CHECKLIST.md).
