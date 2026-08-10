# CURSOR-07 — Disposable DB Sandbox Capability

**Executor:** Cursor (repo implementation); operator owns any OS-level Docker install  
**Reviewer:** GPT Plus + Codex  
**Consumer:** StallVix  
**Purpose:** give Agent #001 and human operators a reproducible, disposable Supabase/Postgres proof environment without using production as the test bench  
**Gate:** independent infrastructure hardening; does not authorize KILO-02/KILO-03 or product feature work

## Why this exists

The Aug 10 CTO audit correctly identified an operational gap: DB work has often relied on rolled-back production probes because the Windows operator machine does not have a local Supabase/Docker loop.

Important correction: StallVix already has a Docker-backed GitHub Actions database test workflow. `.github/workflows/db-tests.yml` starts a local Supabase stack from an empty database and runs `supabase test db`. Therefore the missing capability is not "Docker testing exists nowhere"; it is "the disposable database proof loop is not standardized as a first-class operator/agent capability, and local parity is absent."

Granaide should solve the capability, not merely install Docker on one laptop.

## Architecture decision

Two equivalent execution modes:

```text
DB SANDBOX CONTRACT
        |
        +-- Mode A: GitHub Actions (canonical / always available)
        |      disposable runner
        |      Supabase local stack
        |      migrations replay from zero
        |      pgTAP
        |
        +-- Mode B: local Docker-compatible runtime (optional fast loop)
               same repo migrations
               same Supabase CLI version
               same pgTAP suite
```

Mode A is sufficient for safety and must remain available even when local Docker is absent. Mode B improves iteration speed but is not an Agent Pack portability requirement.

## Security boundary

The sandbox must never require or consume:

- production database password;
- Supabase service-role secret for the live project;
- `SUPABASE_ACCESS_TOKEN` unless a narrowly separate remote-management task explicitly requires it;
- `supabase db reset --linked`;
- `supabase test db --linked`;
- `supabase db push`;
- migration repair against production.

All default sandbox commands target the local ephemeral stack only.

## Required implementation

### C07-1 — Audit current DB workflow against current `main`

Inspect `.github/workflows/db-tests.yml` on current StallVix `main`.

Correct stale comments/claims, especially historical text saying `main` is 11 migrations behind production if that is no longer true.

Do not change migration semantics to make comments green.

### C07-2 — Pin the Supabase CLI version

The existing workflow uses `supabase/setup-cli@v1` with `version: latest`.

Replace `latest` with one explicit tested CLI version and record it in one canonical repo location so local and CI use the same version.

Do not silently upgrade the CLI as part of unrelated work.

### C07-3 — Define local/CI parity commands

Add a small documented command surface for:

1. start local DB stack;
2. replay/reset from zero;
3. run pgTAP;
4. stop/clean stack.

Commands must be local-only and must not use `--linked`.

Prefer one cross-platform repo entrypoint or package scripts over Windows-only shell logic where practical.

### C07-4 — Add a sandbox doctor/preflight

Provide a read-only preflight that reports:

- Docker-compatible runtime available: yes/no;
- Supabase CLI available + exact version;
- expected pinned version matches: yes/no;
- `supabase/config.toml` present: yes/no;
- migrations/tests directories present: yes/no;
- which mode is available: LOCAL, CI_ONLY, or BLOCKED.

The doctor must not start containers, connect to the linked project, print secrets, or mutate files.

### C07-5 — Prove from-scratch replay locally if runtime exists

If the execution machine already has a compatible Docker runtime, run the local sequence and capture:

- empty-stack start;
- migration replay/reset from zero;
- pgTAP result;
- clean stop.

If no compatible runtime exists, report `LOCAL_RUNTIME_ABSENT` and do not install Docker automatically. OS installation is operator-owned.

### C07-6 — Prove canonical GitHub Actions sandbox

Ensure the workflow remains manually dispatchable and runs on PR/push as intended.

Trigger or cite one fresh run from the implementation commit showing:

- local Supabase stack started on the ephemeral runner;
- migrations replayed;
- pgTAP ran;
- no production credentials were needed.

### C07-7 — Agent Pack capability contract

Document for Granaide/Agent #001:

`db.sandbox.test` = permission to request/use the disposable DB proof lane only.

It is NOT equivalent to:

- `db.production.read`;
- `db.production.write`;
- `migration.apply.production`;
- `service_role.use`.

This distinction is required for future job-scoped capability grants.

## Allowed StallVix paths

Narrow to what is required after inspection, expected candidates:

- `.github/workflows/db-tests.yml`
- `package.json` / lockfile only if needed for a pinned CLI or scripts
- one small sandbox doctor/runner under `scripts/`
- one DB sandbox contract/receipt under `docs/agent-work/` or `docs/audit/`

Do not edit migrations or pgTAP assertions unless the current suite itself is proven broken and GPT/Codex separately authorizes that repair.

## Forbidden

- production Supabase writes;
- `--linked` reset/test/push;
- changing RLS/schema/migrations;
- installing Docker Desktop automatically;
- changing Windows/WSL configuration;
- product/UI work;
- secrets in committed files or logs;
- weakening existing db-tests to obtain green.

## Acceptance

PASS only if:

1. current workflow comments describe current repository truth;
2. Supabase CLI version is pinned and shared by CI/local documentation;
3. local-only commands are deterministic and visibly exclude linked production;
4. doctor reports environment without mutation;
5. local proof is PASS or honestly `LOCAL_RUNTIME_ABSENT`;
6. a fresh GitHub Actions run proves the canonical disposable sandbox;
7. capability vocabulary distinguishes sandbox from production DB authority;
8. receipt states exact changed paths, commands, CI run, uncertainties.

## Docker Desktop operator note

If the operator later chooses local mode on Windows, use a supported Docker-compatible runtime. Supabase officially requires a Docker-API-compatible container runtime for the local stack; Docker Desktop is the preferred Windows option. Docker Desktop's WSL 2 backend requires supported Windows/WSL/virtualization prerequisites. Installation and OS configuration are a separate operator action, not part of this repo packet.

## Stop conditions

Stop immediately if:

- any command targets the linked/production database;
- Docker installation or Windows feature changes become necessary;
- current migration replay fails for a schema reason (return the failing migration; do not rewrite history blindly);
- secrets appear in output;
- the task expands into staging architecture or self-hosting.

Return the receipt and STOP for GPT/Codex audit.
