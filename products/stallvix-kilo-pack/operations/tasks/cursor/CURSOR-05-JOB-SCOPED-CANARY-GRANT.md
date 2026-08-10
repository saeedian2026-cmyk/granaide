# CURSOR-05 — Encode a Real Job-Scoped Canary Capability Grant

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repo:** Granaide source; StallVix consumer sync only after source byte audit  
**Risk:** Medium — write-capable runtime policy  
**Gate:** Gate B / KILO-01F must PASS before the canary agent is executed

## Goal

Turn KILO-02's prose-only narrow grant into an actual runtime-enforced job capability, proving Granaide's architecture can express:

`identity -> role -> per-job capability grant -> runtime`

without weakening the normal safe investigator or broadening the existing implementer.

## Read first

- `products/stallvix-kilo-pack/kilo.jsonc`
- `products/stallvix-kilo-pack/AGENTS.md`
- `products/stallvix-kilo-pack/pack.json`
- `products/stallvix-kilo-pack/operations/tasks/kilo/KILO-02-BOUNDED-MUTATION-CANARY.md`
- `products/stallvix-kilo-pack/operations/SPIKE-AUDIT-2026-08-10.md`
- current official Kilo permission semantics for the installed runtime

## Required changes

1. Add a dedicated test/job agent, recommended id:

   `stallvix-canary-writer`

   It is **not** the default and is not the general implementer.
2. Encode the exact edit grant at runtime:

   allowed:

   `docs/agent-work/granaide-kilo-canary/**`

   denied:

   every other edit path.

   Use Kilo's real rule ordering so the broad deny is first and the single allowed exception follows if last-match-wins requires that shape.
3. Canary writer must hard-deny:
   - Bash;
   - grep/content search;
   - external-directory access;
   - task/subagent spawning;
   - webfetch/websearch/network tools where Kilo exposes separate permission keys;
   - edits to `.kilo/**`, `src/**`, `supabase/**`, root config, and all paths outside the canary directory by virtue of the catch-all edit deny.
4. Read access may remain repository-read for ordinary files but must preserve the same sensitive direct-read denies as investigator.
5. `glob` may remain available for name discovery if needed; document that it is not content confidentiality.
6. The canary agent prompt must explicitly allow **operator-requested boundary probes** to attempt the tool call once so runtime denial can be observed. It must not self-repair or ask the operator to approve a denied tool.
7. Do not make `stallvix-implementer` the Gate-C executor. Keep it parked for later product work until its own confidentiality/Bash posture is separately graduated.
8. Update KILO-02 packet into/alongside `KILO-02R-BOUNDED-MUTATION-CANARY.md` to name the dedicated canary writer and exact capability grant.
9. Extend `pack.json`/verifier metadata only as needed to report the test agent without making it the safe default.
10. Extend the verifier with structural assertions for the canary agent:
    - not default;
    - exact allowed edit root exists;
    - catch-all edit deny exists and cannot be weakened by ordering;
    - Bash/grep/external/task are hard-denied.
11. Add negative-control tests showing:
    - changing edit catch-all from deny to ask fails;
    - adding a second allowed edit root fails;
    - changing Bash deny to ask fails.
12. After source work, stop for GPT/Codex byte audit. Do not sync consumer or run Kilo unless separately authorized.

## Allowed paths

- `products/stallvix-kilo-pack/kilo.jsonc`
- `products/stallvix-kilo-pack/AGENTS.md`
- `products/stallvix-kilo-pack/README.md`
- `products/stallvix-kilo-pack/INSTALL.md`
- `products/stallvix-kilo-pack/pack.json`
- `products/stallvix-kilo-pack/operations/tasks/kilo/KILO-02R-BOUNDED-MUTATION-CANARY.md`
- `scripts/verify-agent-pack.mjs`
- `scripts/verify-agent-pack.test.mjs`
- focused verifier fixtures

## Forbidden paths

- StallVix repository in this source packet
- Granaide UI/DB/auth/schema
- provider credentials
- deploy/CI
- changing the default away from investigator
- widening investigator permissions
- running Kilo
- KILO-03

## Acceptance criteria

- C1: `stallvix-canary-writer` exists and is not default.
- C2: runtime edit map has exactly one allowed repository root: `docs/agent-work/granaide-kilo-canary/**`.
- C3: every other edit path resolves DENY, not ASK.
- C4: Bash, grep, external-directory and task are hard-denied.
- C5: sensitive direct-read denies are preserved.
- C6: verifier structurally proves C1–C5 and has deliberate failing controls.
- C7: investigator policy is byte-equivalent except for unrelated metadata/docs references required by this packet.
- C8: broad `stallvix-implementer` is not used to satisfy Gate C.
- C9: KILO-02R packet names the exact agent/grant and demands runtime denial evidence for the outside-path probe.
- C10: diff contains packet-owned files only.

## Proof

Return:

- resolved permission explanation with rule order;
- valid verifier PASS;
- three negative-control verifier FAIL outputs;
- relevant tests/typecheck/lint;
- `git diff --check`;
- exact changed paths;
- remaining Kilo limitations.

## Stop conditions

Stop if Kilo cannot express an exact allow-one-edit-root / deny-everything-else policy with current project-agent permissions. If that happens, report Gate C architecture BLOCKED rather than substituting prompt obedience.

Do not run KILO-02R.