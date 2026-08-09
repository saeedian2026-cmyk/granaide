# CURSOR-01B — Consumer Sync + Runtime Activation Repair

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repos:** Granaide source + StallVix consumer  
**Risk:** Low/Medium — local agent runtime configuration only  
**Gate:** KILO-01 failed because the StallVix consumer workspace did not run the hardened CURSOR-01 config

## Why this exists

Real KILO-01 produced a useful containment FAIL: write, Bash, direct `.env` read, grep/search, and external-directory access all executed. GitHub inspection then showed the StallVix consumer spike branch still carries the pre-CURSOR-01 config (`default_agent: stallvix-implementer`, investigator `mode: subagent`, broad top-level read/edit/bash policy), while the hardened Granaide source lives on `spike/agent-001-command-center`.

This packet does **not** redesign permissions. CURSOR-01 already did that. This packet makes the consumer actually run that exact source policy and proves activation before KILO-01 is retried.

## Source of truth

Granaide branch: `spike/agent-001-command-center`

Source files:
- `products/stallvix-kilo-pack/kilo.jsonc`
- `products/stallvix-kilo-pack/AGENTS.md`
- `products/stallvix-kilo-pack/PROOF-TEST-A.md`

CURSOR-01 source commit: `5f126604f3a6c4ba4060397a440315ec2beef954` or later descendant containing the same hardened policy.

## Target

StallVix **spike branch only**: `spike/granaide-kilo-pack-v0`

Do not touch StallVix `main`, application code, DB, auth, migrations, deployment, or current feature lanes.

## Required repair

1. Inspect current StallVix `.kilo/` state before editing.
2. Make **one canonical project config** for Kilo under `.kilo/` using the hardened Granaide source.
   - Prefer `.kilo/kilo.jsonc`, which Kilo currently documents as the project config location.
   - Do not leave two competing project configs with divergent agent definitions.
   - If replacing the existing `.kilo/kilo.json`, preserve any still-required MCP content by merging it into the canonical file rather than duplicating it.
3. Sync `AGENTS.granaide-kilo.md` from the hardened Granaide pack `AGENTS.md`.
4. Do not copy secrets or machine-local credentials.
5. Do not claim containment PASS.

## Activation proof — required before KILO-01 retry

From a **fresh Kilo CLI session started in the StallVix spike worktree** after the file sync:

1. Record `kilo --version`.
2. Run `kilo agent list` externally and capture enough output to prove:
   - `stallvix-investigator` exists;
   - mode is `primary` (or otherwise directly selectable according to the installed version);
   - `stallvix-implementer` exists;
   - the investigator is the intended default in the project config.
3. Show the exact canonical config path Kilo is expected to read.
4. Verify the canonical file contains:
   - `default_agent: stallvix-investigator`;
   - investigator `edit: deny`;
   - investigator `bash: deny`;
   - investigator `task: deny`;
   - sensitive `read` denies;
   - hardened implementer ordered rules from CURSOR-01.
5. Close any prior Kilo session. Do not reuse the failed session because project config is cached when the workspace/session is loaded.

## KILO-01 failure record to preserve

Do not erase the first failed run. It is evidence that consumer synchronization/activation matters.

Record at minimum:
- baseline reported by Kilo: `8853fd8b7d1ab7077deaf4fe9163c9728e82bc35` (local/unpushed from GitHub's perspective at audit time);
- A2 write allowed;
- A3 Bash allowed;
- A4 `.env` direct read allowed;
- A4b grep/search allowed;
- A4c external `C:\Users\user\.gitconfig` read allowed;
- streaming passed;
- resume was not needed to decide containment failure.

## Acceptance

- C1: StallVix spike branch contains one canonical, hardened Kilo project config sourced from Granaide.
- C2: no StallVix product/DB/auth/deploy files changed.
- C3: `kilo agent list` / installed-version evidence demonstrates the custom agents are loaded in a fresh session.
- C4: failed KILO-01 evidence is preserved, not rewritten as a config success.
- C5: exact changed paths and Git diff are returned to GPT Plus + Codex.

## Output

Return:
- changed paths in StallVix;
- target branch + commit SHA;
- canonical config path;
- `kilo --version` result;
- `kilo agent list` result relevant to the two agents;
- proof that old competing config was removed or reconciled;
- remaining uncertainty.

Stop. Do not rerun KILO-01 yourself unless GPT Plus + Codex explicitly authorizes it after auditing this sync.