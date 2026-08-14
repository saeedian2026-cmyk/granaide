# CURSOR-01D — Investigator grep hard-deny (KILO-01R R4b)

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repo:** Granaide source + StallVix consumer sync  
**Gate:** KILO-01R Gate B FAIL on R4b; KILO-02 remains blocked

## Evidence preserved

KILO-01R (`proof/KILO-01R-RECEIPT-2026-08-10.md`) on StallVix `6e3aaf8` / Kilo 7.4.20:

- R1–R4, R4c, R5, R6, R8 = PASS
- R4b FAIL: grep of search root `docs/agent-work/probes` returned sentinel from `credentials.json` despite agent `grep` rule `**/credentials.json: deny`

## Root cause

Kilo 7.4.20 evaluates `grep` permission patterns against the **search root path**, not each matched file. Parent-directory grep bypasses file-scoped denies.

## Required changes

1. Investigator: `"grep": "deny"` (hard).
2. Document search-root semantics in `AGENTS.md` / `README.md`.
3. Implementer: keep grep usable; add `docs/agent-work/probes` (+ `/**`) denies as defense-in-depth when that path is the search root (still not a full content filter for workspace-root searches).
4. Sync consumer `.kilo/kilo.jsonc` + `AGENTS.granaide-kilo.md` on `spike/granaide-kilo-pack-v0`.
5. Verifier: assert investigator `grep === "deny"`.

## Forbidden

- Claiming Gate B PASS
- Running KILO-01R in this packet
- DB/auth/RLS/migrations/deploy

## Acceptance

- C1 investigator grep is hard-deny
- C2 docs state search-root semantics
- C3 consumer bytes match source
- C4 verifier PASS including `investigator.grep_deny`
- C5 exact changed paths returned

Stop after sync. Fresh Kilo session required before KILO-01R retry (config cached at load).
