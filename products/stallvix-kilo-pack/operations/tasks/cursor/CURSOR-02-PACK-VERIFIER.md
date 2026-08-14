# CURSOR-02 — Build Deterministic Agent Pack Verifier

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repo:** Granaide  
**Risk:** Low/Medium  
**Gate:** starts after CURSOR-01 config shape is settled

## Goal

Create a deterministic verifier for Agent 001 so Granaide can prove a generated pack satisfies its own structural safety contract **before any runtime launches it**.

This is the first reusable Granaide factory primitive.

## Product intent

Today a human can read `kilo.jsonc` and hope it matches the docs. Granaide needs a machine-checkable step:

```text
Agent Pack -> verify-pack -> PASS/FAIL -> only then runtime proof
```

The verifier must test configuration and packaging facts, not model behavior.

## Required checks

At minimum, fail non-zero when any of these are false:

1. pack config parses successfully using a robust JSONC-capable approach;
2. required agents exist;
3. the investigator/read-only agent is the declared safe default;
4. investigator denies edit and Bash;
5. implementer has named hard-deny edit paths for migration/deploy/env/secrets;
6. permission rule ordering does not obviously end in a catch-all that weakens those denies;
7. required skills exist:
   - `stallvix-authority`
   - `stallvix-receipt`
   - `stallvix-safe-change`
8. required pack docs exist;
9. Test A exists and does not mark real Kilo enforcement PASS without a real Kilo receipt;
10. no committed file in the pack matches obvious secret-file names or contains obvious secret-key markers selected by the packet author;
11. pack version/name metadata is reportable so future Agent Pack #002 can use the same verifier contract.

## Implementation guidance

Prefer a small script + focused tests over a framework. Do not write a homegrown comment stripper if a small, maintained JSONC parser is materially safer; if adding a dependency, justify it and scope it narrowly.

Suggested interface, adaptable after repo inspection:

```bash
npm run verify:agent-pack -- products/stallvix-kilo-pack
```

Output should be concise and machine-readable enough for CI later, for example:

```text
PASS config.parse
PASS agent.default_safe
FAIL permissions.bash_deploy_deny
...
Agent Pack: FAIL (1/11 checks failed)
```

A JSON output mode is desirable if cheap, but not required for this packet.

## Allowed paths

- `products/stallvix-kilo-pack/**`
- `package.json` / lockfile only if a verifier dependency or script is justified
- focused verifier tests

## Forbidden

- Granaide app UI
- DB/auth/schema
- StallVix repo
- runtime Kilo execution
- CI workflow installation unless reviewer explicitly extends scope

## Acceptance

- V1: verifier returns 0 on the hardened valid pack.
- V2: a fixture or temporary mutation proves it returns non-zero when one hard-deny invariant is removed.
- V3: a fixture or temporary mutation proves it returns non-zero when the safe default changes to the implementer.
- V4: test/verification output identifies the failing invariant, not only generic parse failure.
- V5: no secret values are printed.
- V6: documentation shows how Agent Pack #002 could reuse the verifier.

## Proof

Return command output for:

- valid-pack PASS;
- at least two deliberate failing cases;
- tests/typecheck/lint relevant to the changed surface;
- `git diff --check`;
- changed paths and dependency delta.

A verifier that has never been observed failing does not satisfy this packet.