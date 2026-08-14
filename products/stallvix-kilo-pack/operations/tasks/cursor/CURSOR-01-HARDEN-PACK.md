# CURSOR-01 — Harden Agent 001 Pack

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repo:** Granaide  
**Risk:** Medium — agent safety configuration  
**Gate:** first Cursor packet; required before real Kilo write-capable use

## Goal

Make the Granaide StallVix Kilo Executor Pack's **technical enforcement match its written safety claims**.

Do not expand Granaide product scope. This is a configuration/contract correction packet.

## Read first

- `products/stallvix-kilo-pack/kilo.jsonc`
- `products/stallvix-kilo-pack/AGENTS.md`
- `products/stallvix-kilo-pack/INSTALL.md`
- `products/stallvix-kilo-pack/PROOF-TEST-A.md`
- `products/stallvix-kilo-pack/operations/AGENT-001-COMMAND-CENTER.md`

Before editing, verify the exact current Kilo permission/config syntax against official Kilo documentation. Do not guess ordering or Bash-pattern semantics from memory.

## Required corrections

1. **Safe default agent**
   - real read-only investigator is the default;
   - it must be directly selectable in the installed Kilo UX if the docs tell the operator to select it.

2. **Ordered edit rules**
   - catch-all must not override more-specific allows/denies;
   - `src/**` and `docs/**` may remain the implementer's broad edit focus;
   - migrations, env/secrets, deploy config and other named forbidden paths must remain hard-denied after rule resolution.

3. **Bash enforcement**
   - encode explicit hard-deny patterns for destructive/forbidden classes supported by Kilo, including at minimum deploy, migration/apply, force-push/main-push and obvious secret-reading commands where practical;
   - safe verification commands may remain `ask` unless the pack has a narrower justified rule;
   - prompts remain defense-in-depth, not the only boundary.

4. **Sensitive reads**
   - if Kilo supports read-path rules separately, deny `.env*`, credential material and known secret-like local files at the runtime layer;
   - document any boundary Kilo cannot enforce on Windows instead of pretending it can.

5. **Docs synchronized**
   - `README.md`, `INSTALL.md`, `AGENTS.md` and Test A must describe the actual behavior after the config change;
   - correct any stale statement that Test A already proved real Kilo enforcement.

6. **Do not self-authorize**
   - no StallVix consumer sync in this packet;
   - no changes to Granaide DB/auth/app roadmap;
   - no production deploy.

## Allowed paths

- `products/stallvix-kilo-pack/kilo.jsonc`
- `products/stallvix-kilo-pack/README.md`
- `products/stallvix-kilo-pack/INSTALL.md`
- `products/stallvix-kilo-pack/AGENTS.md`
- `products/stallvix-kilo-pack/PROOF-TEST-A.md`
- focused tests/fixtures under `products/stallvix-kilo-pack/` if needed

## Forbidden paths

- `src/**`
- Supabase/schema/auth files
- unrelated Granaide docs
- StallVix repository

## Acceptance

- C1: investigator is the safe default and can be selected as documented.
- C2: a static inspection demonstrates no trailing wildcard weakens named hard-deny edit paths.
- C3: forbidden Bash classes are represented by runtime policy, not prose alone.
- C4: sensitive local credential paths are denied wherever Kilo supports it; unsupported limits are stated.
- C5: docs no longer claim real Test A PASS before Kilo runs.
- C6: diff contains only packet-owned files.

## Proof

Return:

- exact Kilo docs/sections consulted;
- before/after permission resolution explanation;
- `git diff --check`;
- any local syntax/config validation available;
- changed paths;
- remaining enforcement gaps.

Do **not** mark runtime containment PASS. That belongs to KILO-01.