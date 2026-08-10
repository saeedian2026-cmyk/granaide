# CURSOR-04 — Consumer CURSOR-01D Sync + Activation Attestation

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repos:** Granaide source + StallVix consumer spike branch  
**Risk:** Low/Medium — runtime configuration sync only  
**Gate:** required before final Gate B retry; KILO-02 remains blocked

## Goal

Make the pushed StallVix consumer run the exact audited CURSOR-01D source policy, then prove activation without running containment.

## Read first

- `products/stallvix-kilo-pack/kilo.jsonc`
- `products/stallvix-kilo-pack/AGENTS.md`
- `products/stallvix-kilo-pack/operations/tasks/cursor/CURSOR-01D-GREP-HARD-DENY.md`
- `products/stallvix-kilo-pack/operations/tasks/kilo/KILO-01R-ACTIVATED-CONTAINMENT.md`
- `products/stallvix-kilo-pack/operations/SPIKE-AUDIT-2026-08-10.md`

Consumer target:

- repo: `saeedian2026-cmyk/StallVix`
- branch/worktree: `spike/granaide-kilo-pack-v0` / `C:\w\svx-kilo`
- current pushed baseline at audit: `6e3aaf880d09ca1826fdaddc768c579e950d6a54`

## Required changes

1. Fetch/reset only the dedicated StallVix spike worktree to the pushed spike branch state. Do not mix in `main` feature work.
2. Sync the current Granaide CURSOR-01D source policy into the consumer:
   - `.kilo/kilo.jsonc`
   - `AGENTS.granaide-kilo.md`
   - current KILO-01R/KILO-01F local packet only if the operator packet requires a mirrored consumer copy.
3. Investigator must resolve to:
   - default + primary;
   - `edit: deny`;
   - `bash: deny`;
   - `grep: deny`;
   - `external_directory: deny`;
   - `task: deny`;
   - sensitive direct-read denies preserved.
4. Do not alter the implementer in this packet except for bytes already present in the audited source commit. Gate-C redesign belongs to CURSOR-05.
5. Preserve prior FAIL receipts; do not rewrite history to imply earlier runs used CURSOR-01D.
6. Commit and push the StallVix spike sync.
7. Start a fresh Kilo CLI process only for activation checks, not adversarial probes.
8. Capture:
   - `kilo --version` (or the exact command needed on this workstation);
   - `kilo agent list` relevant rows;
   - `kilo config check` if supported by installed 7.4.20;
   - exact canonical config path;
   - source and consumer blob/hash comparison for `kilo.jsonc`.
9. Close the activation process after capture. Do not run KILO-01F.

## Allowed paths

Granaide: read-only for this packet.

StallVix spike branch only:

- `.kilo/kilo.jsonc`
- `AGENTS.granaide-kilo.md`
- `docs/agent-work/KILO-01F-GATE-B-FINAL.md` only if supplied by operator for local execution
- one packet-specific activation receipt under `docs/agent-work/`

## Forbidden paths

- StallVix `src/**`
- `supabase/**`
- auth/RLS/schema/migrations
- deploy config/actions
- unrelated StallVix docs
- Granaide source edits
- Kilo adversarial probe execution
- KILO-02 / KILO-03

## Acceptance criteria

- C1: pushed StallVix consumer config is byte-identical to the audited Granaide CURSOR-01D source config.
- C2: no competing `.kilo/kilo.json` or other divergent project config remains.
- C3: activation output shows `stallvix-investigator (primary)` from a fresh Kilo process.
- C4: config bytes contain investigator hard-deny for edit/bash/grep/external_directory/task.
- C5: prior KILO-01/KILO-01R failure evidence remains unchanged.
- C6: consumer diff contains packet-owned configuration/receipt files only.
- C7: exact consumer commit SHA is pushed and returned.

## Proof

Return:

- Granaide source ref + `kilo.jsonc` blob/hash;
- StallVix consumer ref + matching blob/hash;
- exact changed paths;
- `kilo --version` output;
- relevant `kilo agent list` output;
- `kilo config check` output or `UNSUPPORTED`;
- canonical config path;
- `git diff --check`;
- remaining uncertainty.

## Stop conditions

Stop immediately if:

- the consumer has unrelated dirty changes that would be overwritten;
- source and consumer cannot be made byte-identical without redesigning policy;
- Kilo does not load the synced agent in a fresh process;
- the task would require StallVix product/DB/auth/deploy changes.

Do not run KILO-01F. Return to GPT Plus + Codex for byte audit.