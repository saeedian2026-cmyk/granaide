# LAB-00-V2 RECEIPT

Experimental benchmark only. Zero authority over StallVix architecture, production, Granaide/Kilo, or any candidate framework. Does not continue PR #8 and does not rewrite PR #8 history.

## LAB-00-V2 RESULT

Branch: `agent-lab/lab-00-v2-benchmark-arena`  
Base SHA: `b0c122a7f834e66a6e66573845e6c003a98c8c44`  
Head SHA: (this branch commit; GitHub PR lists the exact SHA)  
PR: draft, opened after push  

Changed paths: `docs/agent-lab/LAB-00-V2-BENCHMARK-ARENA-CURSOR.md`, `lab/agent-bakeoff-v2/**` only.

Public/private StallVix publication check: PASS for committed bytes. No `stallvix-snapshot`. No StallVix document bodies. Provenance is repo name + pinned commit SHA + source path names only. `verify-public-safety.mjs` is a guardrail, not a confidentiality proof.

Synthetic-only committed fixture check: PASS. Candidate-visible corpus is purpose-built Northwind Harbor. Every synthetic doc carries `SYNTHETIC BENCHMARK FIXTURE — not a StallVix document`.

Candidate/evaluator separation: PASS. `scenarios/public/` vs `evaluator/private/`. Per-scenario execution root = envelope + allowed evidence + T6 writable area. T3 uses per-turn surfaces so later-turn files are absent until that turn (R1). No goldens, scorer scripts, arena manifest, or other scenarios in that root (V2-ADD-6).

Oracle leakage negative control: PASS (NC2). Copying T1 golden into a candidate bundle fails the bundle verifier. Restore green.

R1 T3 temporal isolation: PASS. Turn 1 surface cannot read correction/standup/berth files. Injecting correction into Turn 1 fails `verifyTurnSurface`. Building T3 without `{ turn }` is rejected.

R2 evaluator seal: PASS. Mutating evaluator-only `semanticQuality` in `scoring-keys.json` (no `publicMirror` change) fails verify-arena on evaluator hash drift. Restore green.

T1: synthetic locked spec, rules, backlog, research, history. Prompt does not name the governing files. Deterministic keys: governing sources + program code.

T2: Harbor Crane chain with similar finding, superseded receipt, and Dock Lighthouse cross-project record. Prompt does not label distractors.

T3 real multi-turn: three adapter turns. Turn 3 does not attach the correction. Corpus includes superseded state, locked correction, newer unofficial standup, and two same-date berth memos that disagree (V2-ADD-2). Recency without authority fails.

T4 actual tool trace: adapter schema `{tool,class,startedAt,completedAt,target,result}`. Required classes `local.repo`, `local.evidence`, `localhost.http`. Forbidden classes fail. Token file is HTTP-only, not in the T4 filesystem root.

T5 blind acquisition: localhost `127.0.0.1` pages p1–p6. Evaluator `t5-pages-registry.json` is not served (V2-ADD-4). Entrypoint does not identify the answering page.

T6 actual filesystem-delta enforcement: sealed baseline bytes, observed tree/symlink/hidden/traversal delta, ignore `mutationPaths`. Pipeline is snapshot → execute → delta → score → receipt → reset (V2-ADD-5). Reset before score is rejected.

T7 blind adversarial evidence: overlay prompt, unofficial spec, live-state file, contradictory receipt, legitimate intake note. Prompt does not call them malicious.

Schema validation: structural validate required fields, types, scenario id, evidence ids, tool traces, selected facts, T3 turns, T6 mutation result via observed delta.

Scorer malformed-input behavior: JSON/object/field errors return `{pass:false, malformed:true}` and exit 1. No crash.

Arena verifier: `node lab/agent-bakeoff-v2/scripts/verify-arena.mjs` → PASS. Includes publicMirror deep-compare (V2-ADD-1), self-describing-field scan (V2-ADD-3), T3 per-turn surfaces (R1), and public+evaluator hash seal (R2).

Public-safety verifier: `node lab/agent-bakeoff-v2/scripts/verify-public-safety.mjs` → PASS.

Negative controls: `node lab/agent-bakeoff-v2/scripts/run-negative-controls.mjs` → PASS, restore-to-green after each.

Root dependency diff: none. No `package.json` / lockfile change. Node built-ins only.

Forbidden-surface diff: none. Did not touch `products/stallvix-kilo-pack/**`, `src/**`, `public/**`, `supabase/**`, `.github/**`, StallVix repo, candidate repos, production data, or credentials.

Manual fixture review (operator): inspected every committed file under `lab/agent-bakeoff-v2/fixtures`, `scenarios/public`, and `evaluator/private`. No emails, no `.env*`, no PEM, no credential filenames, no Supabase project refs, no copied StallVix bodies. T5 registry stays evaluator-private. `.runtime-private/` is gitignored.

Remaining uncertainty:

- Goldens are in the public git tree. Adapter isolation is mechanical, not a human-clone confidentiality proof.
- T4 PASS path in negative controls injects adapter-shaped traces; it does not run a live candidate. Live HTTP self-check covers T5/T4 page fetch. `adapter-runtime.mjs` is the generic emitter for later candidates.
- `STALLVIX_GIT_DIR` was unset here, so the optional StallVix byte-collision check did not run.
- Regex public-safety scan cannot prove absence of all confidential information.

Verdict requested: **PASS**

LAB-01 not started. fast-agent / M-flow / DeepSeek / Scrapling / Kilo not installed or tested.
