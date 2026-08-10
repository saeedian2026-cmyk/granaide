# CURSOR-02R — Verifier Current-Head Truth Repair

**Owner:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Repo:** Granaide  
**Risk:** Low/Medium — factory safety verifier  
**Gate:** may run after CURSOR-04; must PASS before Gate E / Agent Pack #002 claims

## Goal

Make the deterministic Agent Pack verifier truthful against the **current complete pack tree**, not only the earlier tree on which CURSOR-02 was first tested.

## Read first

- `scripts/verify-agent-pack.mjs`
- `scripts/verify-agent-pack.test.mjs`
- `products/stallvix-kilo-pack/pack.json`
- `products/stallvix-kilo-pack/kilo.jsonc`
- `products/stallvix-kilo-pack/operations/CLINE-AUDIT-CURSOR-02.md`
- `products/stallvix-kilo-pack/operations/CLINE-AUDIT-CURSOR-03.md`
- `products/stallvix-kilo-pack/operations/SPIKE-AUDIT-2026-08-10.md`

## Required corrections

1. Reproduce the current-head verifier result before editing.
2. Fix secret detection so harmless documentation that merely names environment variables such as `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` does not make a valid pack fail.
3. Do **not** weaken the real secret check into a no-op. It must still fail on:
   - committed `.env` / credential/private-key style filenames;
   - a fixture containing an obvious non-placeholder secret value;
   - a private-key marker/value fixture.
4. Prefer detecting secret **values / assignments / credential-bearing files** rather than bare variable-name mentions.
5. Do not print detected secret values. Failure output may name the relative file and invariant only.
6. Add an explicit current-head test that copies the entire current `products/stallvix-kilo-pack/` tree, including operations/Cline docs, and passes.
7. Preserve and re-run negative controls for:
   - unsafe default switched to implementer;
   - investigator edit deny removed;
   - investigator grep hard-deny removed;
   - real fake-secret value introduced into a fixture.
8. Verify the investigator `grep === "deny"` invariant from CURSOR-01D remains required.
9. Verify pack path handling cannot accidentally make the verifier scan/write outside the requested pack through a relative child path it constructs. Do not add a framework; resolve/contain only paths the verifier itself derives.
10. Keep output concise and CI-friendly.

## Allowed paths

- `scripts/verify-agent-pack.mjs`
- `scripts/verify-agent-pack.test.mjs`
- focused verifier fixtures under a new `scripts/fixtures/agent-pack-verifier/**` if useful
- `package.json` / lockfile only if absolutely necessary; no new dependency expected
- one proof/receipt doc under `products/stallvix-kilo-pack/proof/`

## Forbidden paths

- Kilo runtime config semantics except test fixtures
- StallVix repo
- Granaide UI/DB/auth/schema
- CURSOR-03 harness implementation
- KILO runtime execution
- CI workflow installation

## Acceptance criteria

- V1: verifier returns 0 on the current full Agent 001 pack tree at task completion.
- V2: current operations/Cline docs containing secret-variable names do not false-fail.
- V3: a fixture with a realistic fake secret value fails without printing the value.
- V4: a secret-style committed filename fixture fails.
- V5: unsafe-default mutation fails the named invariant.
- V6: investigator edit-deny mutation fails the named invariant.
- V7: investigator grep-deny mutation fails the named invariant.
- V8: malformed JSONC still fails clearly.
- V9: no new secret values or sensitive artifacts are committed.
- V10: tests prove both green and red paths on the final current head.

## Proof

Return exact output for:

- `npm run verify:agent-pack -- products/stallvix-kilo-pack`
- `npm run test:verify-agent-pack`
- focused negative-control outputs;
- relevant lint/type/build checks;
- `git diff --check`;
- exact changed paths;
- dependency delta (expected none);
- remaining uncertainty.

## Stop conditions

Stop if the only way to make the pack pass is to whitelist entire documentation directories, disable content checks globally, or hide failing invariants.

Do not run Kilo and do not start CURSOR-03R automatically.