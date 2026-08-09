---
name: stallvix-receipt
description: >-
  Emit a structured StallVix-compatible Work Receipt after investigation or
  implementation. Use at end of every material StallVix Kilo job. Aligns with
  StallVix docs/agent-work/RECEIPT_TEMPLATE.md so facts can later Record-to-Console.
metadata:
  category: stallvix
  product: granaide-stallvix-kilo-pack
  source:
    repository: granaide
    path: products/stallvix-kilo-pack/skills/stallvix-receipt
---

# StallVix Work Receipt

Receipts record **what actually happened**, not what was intended. SCOPE = authorization; RECEIPT = reality.

## Template

```markdown
# Work Receipt

- `packet_id`: (job id or Test A)
- `executor`: kilo / stallvix-investigator | stallvix-implementer
- `capability_grant`: read-only | src+docs edit | (list)
- `branch`:
- `baseline_sha`:
- `ending_sha`: (same as baseline if read-only)
- `pushed`: yes/no
- `pull_request`: (omit if none)

## Result by acceptance ID

| ID | Result (PASS / FAIL / UNVERIFIED) | Evidence |
| --- | --- | --- |
|  |  |  |

## Changed paths

- (none for read-only) or `git diff --name-only <baseline>..<ending>`

## Commands run

| Command | Result |
| --- | --- |
|  |  |

## Working tree

- clean / has uncommitted changes:

## Remaining uncertainty

-

## Reusable lesson found

-
```

## Rules

1. Prefer PASS/FAIL with paths and command results over narrative claims.
2. Never claim deploy, migration, or production proof without command evidence.
3. If no files changed, say so explicitly.
4. For Test A, save under `products/stallvix-kilo-pack/proof/TEST-A-YYYY-MM-DD.md` when working from Granaide, or an agreed StallVix evidence path when installed.
