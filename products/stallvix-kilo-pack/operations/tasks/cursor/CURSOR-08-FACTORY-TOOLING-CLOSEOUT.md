# CURSOR-08 — Factory Tooling Closeout

**Executor:** Cursor  
**Reviewer:** GPT Plus + Codex  
**Scope:** Granaide Agent #001 spike tooling only  
**Prerequisite:** Gate B closed and CURSOR-07 runtime-isolation decision recorded

## Why this packet exists

CURSOR-02 built the deterministic Agent Pack verifier and CURSOR-03 built the headless Kilo proof harness. Later review found that both need targeted repair. Running CURSOR-02R and CURSOR-03R as separate jobs adds coordination overhead, so this packet combines their required corrections into one bounded factory-tooling closeout.

The older CURSOR-02R and CURSOR-03R documents remain audit evidence. Do not execute them separately after this packet is adopted.

## Goal

Make the two reusable Granaide factory tools trustworthy enough for Agent Pack #002:

1. `scripts/verify-agent-pack.mjs`
2. `scripts/proof-kilo.mjs`

No StallVix product changes.

## Part A — verifier truthfulness

### C08-A1 Current-head valid-pack proof

Run the verifier against the current Agent #001 pack HEAD, not a historical fixture.

A valid current pack must PASS.

### C08-A2 Secret detection semantics

Fix bare-marker false positives. Documentation that names environment-variable identifiers such as `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` without secret values must not make a safe pack fail.

Secret scanning should distinguish likely **values/material** from variable-name prose. Preserve detection of obvious committed secrets/secret files.

Do not weaken the check by blanket-whitelisting all Markdown.

### C08-A3 Deterministic negative controls

Keep or add fixtures proving FAIL for at least:

- malformed JSONC;
- unsafe/wrong default agent;
- missing required hard deny;
- catch-all ordering that weakens a deny;
- actual secret-like committed value/file;
- false Test-A/Gate claim unsupported by receipt evidence.

### C08-A4 Output safety

Verifier output must never echo a detected secret value. Report path/check class only, with safe redaction.

## Part B — headless proof integrity

### C08-B1 Real incremental event capture

Replace any synchronous all-at-once process capture used as streaming proof with an implementation that records stdout/stderr/event lines as they arrive.

The receipt must distinguish:

- events observed before child completion;
- output parsed only after completion.

Only the first proves streaming.

### C08-B2 Session evidence

Use supported Kilo CLI/session surfaces to capture or accept a session id and resume the exact session when requested.

Do not infer continuity from similar text. Record the actual session identifier/mechanism.

### C08-B3 Environment minimization

Do not blindly pass the entire parent process environment if the harness can construct a smaller safe environment.

Never print full environment variables. Never persist provider/API secrets in receipts.

If Kilo requires inherited variables for execution, explicitly document which names/classes are passed and redact values.

### C08-B4 Portable receipts

Do not persist machine-specific absolute user paths as canonical proof when a repo-relative path or sanitized placeholder is sufficient.

### C08-B5 Git evidence completeness

External Git capture must report all relevant changed tracked/untracked paths for the job, not a truncated subset that could hide mutation.

Record baseline HEAD, ending HEAD, and status/diff facts separately from the agent's own claims.

### C08-B6 No permission bypass

Harness must not use `--auto`, `--dangerously-skip-permissions`, or any equivalent permission bypass for containment/write proof.

## Allowed changes

Expected:

- `scripts/verify-agent-pack.mjs`
- `scripts/verify-agent-pack.test.mjs`
- `scripts/proof-kilo.mjs`
- `scripts/proof-kilo.test.mjs`
- package metadata/lockfile only if genuinely required
- one concise receipt under the Agent #001 operations/proof area

Do not edit StallVix consumer files in this packet.

## Verification

Run the focused verifier and proof-harness tests plus relevant project checks.

Required evidence:

1. current Agent #001 pack PASS;
2. all named negative verifier controls FAIL for the intended reason;
3. secret-value redaction test;
4. streaming test proves events were received before process exit;
5. session-resume test proves exact session identity/continuation;
6. Git evidence test catches multiple changed/untracked paths;
7. environment/receipt tests prove no secret values are emitted.

## Acceptance

PASS only if both tools satisfy their parts in one commit series and the receipt states exact changed files, commands, outputs, limitations, and any deviation.

Do not claim Gate C or KILO-02 readiness from this packet alone. CURSOR-05 remains the next write-capability packet after GPT/Codex accepts CURSOR-08.

## Stop conditions

Stop if:

- a fix requires weakening Agent #001 containment;
- Kilo must be run with permission bypass flags;
- the task expands into StallVix app/product/database work;
- secret material appears in output;
- current Kilo CLI behavior contradicts the assumed harness interface and cannot be resolved narrowly.

Return evidence and STOP for GPT/Codex audit.