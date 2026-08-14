# Install the Granaide Trusted StallVix Worker

Version 0.1.0 is a source-locked candidate. Install the exact files declared in
[`pack.json`](./pack.json), verify them against
[`PAYLOAD-MANIFEST.json`](./PAYLOAD-MANIFEST.json), and activate them through the
shipped launcher. Copying some files or hand-merging agent definitions is not a
verified install.

## Boundary

The pack installs local Kilo configuration into a StallVix checkout. It does not
merge StallVix `main`, change Supabase/auth/RLS, embed Kilo in the web app, or
deploy anything.

The default agent is the read-only `stallvix-investigator`.
`stallvix-implementer` remains opt-in and requires separate owner approval for a
specific small job; installing the pack does not grant that authority.

## Prerequisites

- A clean, disposable StallVix worktree. Do not use the protected primary tree.
- Kilo Code CLI 7.4.20 (the tested version) available on `PATH`.
- PowerShell 7 (`pwsh`).
- Node/npm for the repository's verification commands.
- A source commit or release containing this exact candidate.

## Collision rule

Version 0.1.0 does not support automatic coexistence with another Kilo pack. If
the consumer already contains `.kilo/kilo.json`, `.kilo/kilo.jsonc`, any target
skill directory, `AGENTS.granaide-kilo.md`, or `run-stallvix-kilo.ps1`, stop.
Review or back up those files deliberately; do not overwrite or hand-merge them
and call the result source-locked.

## Exact install map

| Pack source | StallVix destination |
|---|---|
| `kilo.jsonc` | `.kilo/kilo.jsonc` |
| `AGENTS.md` | `AGENTS.granaide-kilo.md` |
| `run-stallvix-kilo.ps1` | `run-stallvix-kilo.ps1` |
| `skills/stallvix-authority/SKILL.md` | `.kilo/skills/stallvix-authority/SKILL.md` |
| `skills/stallvix-receipt/SKILL.md` | `.kilo/skills/stallvix-receipt/SKILL.md` |
| `skills/stallvix-safe-change/SKILL.md` | `.kilo/skills/stallvix-safe-change/SKILL.md` |

`AGENTS.granaide-kilo.md` supplements the consumer's real `AGENTS.md`; it never
replaces it.

## Install procedure

1. Record the source commit and consumer baseline SHA in the Work Receipt.
2. Confirm every destination in the map above is absent.
3. Create only the three destination skill directories and copy each mapped
   file byte-for-byte.
4. Add `.kilo-runtime-data/` to the consumer `.gitignore`. This directory holds
   Kilo's automatically allowed tool output inside the sanitized worktree.
5. Commit the installed candidate on a review branch so the diff is auditable.
6. Run the consumer's install-lock test (currently
   `npm run test:kilo-install`). It must verify the source commit, manifest, and
   normalized hashes.
7. Launch only from the StallVix worktree root:

   ```powershell
   pwsh ./run-stallvix-kilo.ps1 agent list
   ```

8. Confirm both primary agents appear, the investigator is the default, and the
   only effective external-directory exception resolves beneath
   `.kilo-runtime-data/kilo/tool-output/` in this worktree.
9. Run the full credential-safe P2 packet in
   [`packets/P2-FULL-TEST-A-CLOSEOUT.md`](./packets/P2-FULL-TEST-A-CLOSEOUT.md).
   Do not substitute model refusal for runtime denial.

## Acceptance

Installation is complete only when the consumer branch has:

- an exact manifest-verified payload from a recorded source commit;
- activation evidence from the required launcher;
- adversarial permission evidence classified by enforcement layer;
- a durable sanitized event log and complete Work Receipt;
- unchanged repository state for the read-only investigator job.

The current candidate has not yet passed that complete gate. See
[`RELEASE-CHECKLIST.md`](./RELEASE-CHECKLIST.md).

## Uninstall

From the consumer branch, remove only the six mapped destinations above and the
pack's `.kilo-runtime-data/` ignore entry. Delete `.kilo-runtime-data/` only after
confirming it contains no evidence the owner needs to retain. Keep the Work
Receipt and source-lock evidence as the audit record. StallVix application code
and its real `AGENTS.md` are untouched.
