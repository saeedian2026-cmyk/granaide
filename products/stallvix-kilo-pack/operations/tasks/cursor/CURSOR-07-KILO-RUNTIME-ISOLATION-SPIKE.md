# CURSOR-07 — Kilo Runtime Isolation Spike

**Executor:** Cursor  
**Reviewer/operator:** GPT Plus + Codex  
**Project:** Granaide Agent #001 spike only  
**Consumer:** StallVix spike checkout as test subject only  
**Gate:** independent containment hardening; does not authorize KILO-02/KILO-03 or unrelated StallVix work

## Goal

Evaluate whether Agent #001 can gain a stronger **operating-system isolation boundary** than native Kilo-on-Windows permissions, without changing StallVix product/data-model work.

This packet is about the executor runtime only.

## Why this exists

Current Kilo documentation says:

- Kilo sandboxing is not available on Windows;
- permissions and sandboxing are separate controls;
- Kilo's sandbox is primarily a write/network boundary and does not by itself block filesystem reads;
- for stronger confidentiality, run Kilo under a separate OS account, container, or virtual machine that cannot read sensitive host files.

Agent #001 currently runs on Windows, so its proven safety boundary is Kilo's application-level permission system. The spike should test whether a Linux/containerized executor can add a real host boundary while keeping Kilo replaceable.

## Architecture question

Determine which of these is the smallest viable Agent #001 runtime boundary:

```text
A. Native Windows Kilo
   Kilo permissions only

B. Linux/WSL Kilo
   Kilo permissions + Linux Kilo sandbox if enforceable

C. Linux container executor
   container filesystem/process boundary
   + Kilo permissions
   + Kilo Linux sandbox if enforceable inside the container

D. Separate VM / OS identity
   strongest isolation, highest operational cost
```

Do not preselect Docker as the winner. Docker is one candidate runtime boundary.

## Required work

### C07-1 — Capability matrix

Document current facts for A–D:

- can Kilo CLI run there;
- can Kilo's own sandbox be enabled;
- host filesystem visibility;
- writable surface;
- network-control options;
- persistence/session behavior;
- operator friction;
- portability for future Agent Packs.

Use official Kilo and runtime documentation for claims that are not directly tested.

### C07-2 — Safe container prototype if Docker-compatible runtime already exists

If a Docker-compatible Linux runtime is already installed, build/run a minimal disposable prototype.

Hard requirements:

- do **not** mount the user's home directory;
- do **not** mount Docker socket;
- do **not** mount production secrets;
- do **not** expose Supabase/service-role/deploy credentials;
- do **not** mount the real StallVix worktree read-write for the first proof;
- use either a disposable repo copy or a read-only bind mount for the first proof;
- container root filesystem should be read-only where practical, with only explicit temporary writable locations;
- no privileged container.

If no compatible runtime is installed, report `CONTAINER_RUNTIME_ABSENT`. Do not install Docker/WSL or change Windows features automatically.

### C07-3 — Host-confidentiality probe

From inside the isolated runtime, prove the executor cannot read arbitrary host-only files that are visible to the normal Windows user.

Use harmless targets only. Never probe real secrets.

Examples of acceptable proof shape:

- host path is not mounted / does not exist inside the executor;
- a deliberately created harmless host sentinel outside the exposed workspace cannot be read;
- the executor cannot see the Windows user home unless explicitly mounted.

PASS requires an OS/runtime boundary, not a prompt refusal.

### C07-4 — Workspace read/write boundary

For read-only mode:

- Kilo can inspect the intended repo snapshot;
- host repo cannot be mutated.

For a future write-capable mode, design but do not yet authorize one of:

1. disposable clone/volume where Kilo writes and operator imports reviewed diff; or
2. narrowly mounted writable canary directory.

Do not give the container broad read-write access to the primary checkout during this packet.

### C07-5 — Kilo-in-Linux sandbox test

If Kilo CLI runs inside the Linux/container candidate, test whether Kilo's own sandbox can actually initialize there.

Record exact result:

- `KILO_SANDBOX_ACTIVE`, or
- `KILO_SANDBOX_UNSUPPORTED_IN_CONTAINER`, or
- exact failure reason.

Do not add container privileges merely to force Bubblewrap/sandbox success. A security feature that requires weakening the container does not count as a win without separate review.

### C07-6 — Network boundary

Document what network access the executor actually needs for model/provider operation and what can be denied.

Do not claim provider traffic is blocked if Kilo must reach a remote model provider.

At minimum distinguish:

- provider/model inference traffic;
- arbitrary shell-originated outbound traffic;
- GitHub access;
- MCP/tool traffic.

Do not add broad credentials just to make the prototype convenient.

### C07-7 — Granaide runtime contract

Produce a short recommendation for Agent Pack runtime tiers, for example:

```text
Tier 0 — native permissions only
Tier 1 — isolated OS identity/container + permissions
Tier 2 — isolated runtime + Kilo sandbox + restricted network
```

The names may change. The important result is a portable capability contract that does not make Kilo itself the security boundary.

## Forbidden scope

- StallVix DB/data model, migrations, RLS, pgTAP, Supabase testing;
- StallVix UI/product feature work;
- KILO-02/KILO-03 execution;
- Docker/WSL installation or Windows feature changes;
- privileged containers;
- Docker socket mounts;
- host-home mounts;
- real-secret probes;
- production credentials;
- broad host worktree read-write mounts.

## Acceptance

Return:

1. A–D capability matrix;
2. whether a container runtime was already available;
3. exact prototype commands/files if a prototype ran;
4. host-confidentiality probe result;
5. host-repo mutation proof;
6. Kilo CLI + Kilo sandbox result inside candidate runtime;
7. network-boundary findings;
8. recommended Granaide runtime tier for Agent #001;
9. exact uncertainties and operational cost;
10. no unrelated StallVix changes.

Do not claim Docker/containers are mandatory unless the evidence proves they are the best fit. Stop for GPT/Codex architecture verdict.
