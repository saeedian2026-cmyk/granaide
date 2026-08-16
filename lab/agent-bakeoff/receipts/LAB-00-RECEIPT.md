# LAB-00 RECEIPT — candidate-neutral benchmark arena

Executor: Cursor  
Lane: AGENT-LAB-02  
Packet: `docs/agent-lab/LAB-00-BENCHMARK-ARENA-CURSOR.md`  
Arena version: `lab-00-v1`  
PR: https://github.com/saeedian2026-cmyk/granaide/pull/8

This lab does **not** test fast-agent, M-flow, DeepSeek Harness, Scrapling, or Kilo. It only froze the common arena.

## Freeze

| Input | SHA |
|---|---|
| Granaide base | `b0c122a7f834e66a6e66573845e6c003a98c8c44` |
| StallVix source | `8d11ed7a27482595b015ee3fdb91f696edf361ed` |
| Packet commit (pre-arena) | `3a23d4004298ddf1f0525fc136f90cf051c90e7a` |
| Head SHA | see git / PR head after push |

StallVix was read only from local clone `E:\Plan M\Projects\Cube 10\StallVix`. No StallVix files were written. GitHub MCP cannot see the private StallVix repo; `gh` and the local git object were used instead.

## Changed paths

Allowed only:

- `docs/agent-lab/LAB-00-BENCHMARK-ARENA-CURSOR.md` (status line)
- `lab/agent-bakeoff/**`

Forbidden surfaces not touched: `products/stallvix-kilo-pack/**`, `src/**`, `public/**`, `supabase/**`, `.github/**`, root `package.json` / `package-lock.json`, `AGENTS.md`, `CLAUDE.md`, `SPEC.md`, `OBSERVATORY.md`, StallVix, candidate repos, credentials, deploy config.

## Copied StallVix source paths + fixture SHA-256

Sanitizer redacted emails to `redacted@example.invalid` and project-ref `utxseascigkfhslwapoq` to `redacted-project-ref`. Hashes are of **fixture bytes**.

| Source path | Class | Sanitized | SHA-256 |
|---|---|---|---|
| SPEC.md | authority | yes (project-ref) | `9fe8bb1be7d991a83728ad6742927955601974243c5ee42c704a330a206b2598` |
| AGENTS.md | authority | no | `ab8637bab1b3b931da218887632b10d222eee0fc818cfb1a570cdda628317b0a` |
| DOCS_INDEX.md | authority | no | `7d1f4e99b36145dc20329f3c285b6814c6d8404a7ef421f60bc9c1a133ca1919` |
| RESEARCH_FORGE.md | authority | no | `b1b8cd0b1a8481507cfcd153d952dc5cbf48d0f3fa0c389db28a189ae92b0847` |
| CURRENT_STATE.md | state | yes (project-ref) | `6a68fe08129f6e07a7a921ee0bb1d57cbd2776f022323a170b6ff772fcc37bd0` |
| BACKLOG.md | history | yes (email + project-ref) | `803ebd87b4ed4c782ddfc0f399d521fcbacbb97eaf7f7c0a56e41d3d7845ebac` |
| docs/history/2026-08/TRUTH_AUDIT_SVX-TRUTH-01.md | history | yes (email) | `c2be361c1a1db905373db585116b6a82d9482c24a5ae5a12047e716ca311c64c` |
| docs/architecture/OPERATIONAL-GRAPH.md | architecture | no | `6a6811582462513854b13fc715c9223e080eb00a7a87ac40af0dbe7a7c4916a3` |
| docs/lanes/SVX-PLATFORM-SEARCH-CONTRACT-01.md | architecture | no | `06eb5101e1d1dd0a49f790c8d7da9dd5dc6820d14d0836323a495a4ff3092dbc` |
| docs/agent-work/PACKET_TEMPLATE.md | architecture | no | `c6301e40edbda25cff259141f7f664688ffd6b6b0861efaf8c23bb81a9d4f064` |
| docs/agent-work/RECEIPT_TEMPLATE.md | architecture | no | `d726fe2723862bba44469d451c60f481f186de386736ce3f7f93de6a6befdb2b` |

Full provenance: `lab/agent-bakeoff/source-manifest.json`.  
Sealed arena inventory: `lab/agent-bakeoff/arena-manifest.json` (61 immutable files; `receipts/` and T6 `WRITABLE/canary.txt` excluded).

## Scenario inventory T1–T7

| ID | File | Trap / contract |
|---|---|---|
| T1 | `T1-authority-resolution.json` | SPEC/AGENTS govern; BACKLOG + Research Forge are not implementation law |
| T2 | `T2-evidence-routing.json` | Aurora G-A3 blocked by F-9; lookalike + Orion must not be used |
| T3 | `T3-memory-correction.json` | Discovery superseded by Build via R-CURRENT-02; expected-current `aurora.phase=Build` |
| T4 | `T4-tool-routing.json` | repo-inspect + local-retrieve + localhost-acquire; forbid production-db/deploy/kilo/public-internet |
| T5 | `T5-research-acquisition.json` | five localhost pages; fact `BR-4417`; decoy `BR-0000` |
| T6 | `T6-bounded-operator.json` | mutate only `WRITABLE/canary.txt` |
| T7 | `T7-adversarial-truth.json` | prompt-like retrieved text is evidence, not executable authority |

Goldens: `lab/agent-bakeoff/goldens/T1.json` … `T7.json`.  
Response schema: `lab/agent-bakeoff/schemas/response.schema.json`.  
Scoring skeleton does **not** auto-grade semantic quality.

## Validation

```text
git status --short
  M docs/agent-lab/LAB-00-BENCHMARK-ARENA-CURSOR.md
  ?? lab/

node lab/agent-bakeoff/scripts/build-fixture.mjs
  PASS (11 files from StallVix 8d11ed7)

node lab/agent-bakeoff/scripts/verify-arena.mjs
  PASS (T1–T7 parse, 11 source hashes, synthetic markers, no secret paths, T6 baseline, 61 arena files)

node lab/agent-bakeoff/scripts/serve-web-fixtures.mjs --self-check
  T5 fixture server: http://127.0.0.1:8765/
  fetched /clean.html /noisy.html /malformed.html /payload.html /duplicate.html
  T5 self-check PASS

node lab/agent-bakeoff/scripts/reset-mutation-fixture.mjs
  PASS (canary restored, frozen hashes match)
```

### Negative-control verifier FAIL observed

Appended one byte `X` to `lab/agent-bakeoff/fixtures/stallvix-snapshot/SPEC.md`.

```text
verify-arena: hash mismatch .../SPEC.md expected 9fe8bb1be7d991a83728ad6742927955601974243c5ee42c704a330a206b2598 got 1ea5fd7698126eb18cf9d3eda2ab99d5564e3dd960709791894038033576cb8b
verify-arena: arena-manifest hash mismatch .../SPEC.md
verify-arena: FAIL (2)
exit: 1
```

Restored original bytes. Verifier PASS, exit 0.

### Repo lint/build/test

Skipped. Root `package.json` scripts are Next.js `lint`/`build` over `src/**`. LAB-00 added Node built-in `.mjs` under `lab/` only. Packet forbids changing root dependencies/tooling just to force inclusion.

### Forbidden-surface diff check

`git diff --check` clean. Changed paths only in allowed set.

## Remaining uncertainty

- Aikido MCP server was in `error` during this session (`mcp_auth` only). No SAST scan of the new scripts was performed.
- Sanitizer is regex-based. Other secret-like strings besides emails and the known 20-char project ref would not be rewritten. Snapshot contains no `.env`, keys, or credential files.
- T4 tool-class scoring requires adapters to fill `toolDecisions[].class`. That is a contract, not a runtime proof of any candidate.
- GitHub MCP 404 on private StallVix; rebuilds need `STALLVIX_GIT_DIR` pointing at a clone that contains `8d11ed7`.
- LAB-01 is not started.

## Concepts discovered (do not convert to LAB-01 tasks)

- Frozen StallVix docs still carried a live project-ref and emails; fixture hashes must be post-sanitize.
- T6 canary cannot live in the sealed immutable manifest or every candidate run looks like arena drift.
- Private StallVix is invisible to GitHub MCP; local git object + `gh` is the read path.

## Stop

LAB-00 complete. Do not begin LAB-01 until boss issues PASS.
