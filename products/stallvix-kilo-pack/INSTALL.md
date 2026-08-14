# Install — StallVix Kilo Executor Pack

Plain English first, then commands.

## What “install” means (and what it does *not*)

**Install = copy config into your StallVix folder so Kilo reads it.**

You are **not**:
- merging into StallVix `main`
- changing Supabase / auth / RLS
- “turning on Kilo inside the StallVix web app”
- deploying anything

Think of it like copying a **recipe card** into the kitchen where Kilo cooks. StallVix the product stays the restaurant OS; this pack only tells the Kilo chef how to behave in that kitchen.

```text
Granaide repo                          StallVix repo
products/stallvix-kilo-pack/   --->    .kilo/ + skills  (copy)
     (product you sell/own)            (consumer install, local)
```

After copy, when you open **StallVix** in Kilo, the **default agent is `stallvix-investigator`** (read-only, primary). You can also select `stallvix-implementer` (allowed-path edits) from the agent picker — do that only after Gate B / KILO-01.

## Prerequisites

- StallVix clone on disk (e.g. `E:\Plan M\Projects\Cube 10\StallVix`)
- Kilo Code app/CLI that loads project `kilo.json` / `kilo.jsonc` and skills under `.kilo/skills/`
- Node/npm (Context7 MCP uses `npx`)

## Step-by-step (Windows-friendly)

Set paths once (PowerShell):

```powershell
$PACK = "E:\Plan M\Projects\Cube 10\Granaide\products\stallvix-kilo-pack"
$SVX  = "E:\Plan M\Projects\Cube 10\StallVix"
```

### 1) Ensure StallVix has a `.kilo` folder

```powershell
New-Item -ItemType Directory -Force -Path "$SVX\.kilo\skills" | Out-Null
```

### 2) Copy the agent config

If StallVix has **no** `kilo.json` / `kilo.jsonc` yet:

```powershell
Copy-Item "$PACK\kilo.jsonc" "$SVX\.kilo\kilo.jsonc"
```

If StallVix **already** has `.kilo\kilo.json` (Context7 may already be there):

- Do **not** blind-overwrite if you customized it.
- Open both files and **merge**: keep one `context7` MCP block; add the two agents (`stallvix-implementer`, `stallvix-investigator`) from the pack.
- Session junk like `agent-manager.json` stays; leave it alone.

### 3) Copy the three skills

```powershell
Copy-Item -Recurse "$PACK\skills\stallvix-authority"   "$SVX\.kilo\skills\"
Copy-Item -Recurse "$PACK\skills\stallvix-receipt"     "$SVX\.kilo\skills\"
Copy-Item -Recurse "$PACK\skills\stallvix-safe-change" "$SVX\.kilo\skills\"
```

Skills = on-demand playbooks (authority, receipts, safe-change). Same idea as Sanity’s agent-skills folders.

### 4) Add the Kilo worker contract (do not overwrite StallVix AGENTS.md)

StallVix already has the real `AGENTS.md`. This pack ships a **Kilo supplement**:

```powershell
Copy-Item "$PACK\AGENTS.md" "$SVX\AGENTS.granaide-kilo.md"
```

Never silently replace StallVix `AGENTS.md`.

### 5) Open StallVix in Kilo and smoke-check

Install `run-stallvix-kilo.ps1` as `scripts/run-granaide-kilo.ps1`, add `.kilo-runtime-data/` to the consumer `.gitignore`, and launch this pack through that script from the StallVix worktree root. The launcher places Kilo's automatically allowed tool-output directory inside the sanitized worktree instead of the user's home directory.

1. Open the **StallVix** folder in Kilo (not Granaide). Reload / start a **fresh** session if config was already cached.
2. Run `pwsh scripts/run-granaide-kilo.ps1 agent list` and confirm **both** agents appear as primary: `stallvix-investigator` (default) and `stallvix-implementer`. Confirm the effective tool-output exception resolves under `.kilo-runtime-data/` in this worktree.
3. Activation attestation (`kilo agent list`) is required before containment probes — copy alone is not install.
4. Run the live read-only Test A in [`PROOF-TEST-A.md`](./PROOF-TEST-A.md); record the baseline SHA and verify `git status` is unchanged by the agent.
5. Only after the owner accepts a complete Work Receipt may the implementer be selected for a separately authorized small `src/**` / `docs/**` job.

## Done vs not done

| Done after install | Still NOT done |
|--------------------|----------------|
| Kilo can load StallVix-specific agents locally | StallVix control plane / embedded Kilo server |
| Skills teach authority + receipts | Graph Context Resolver |
| You can run read-only Test A | Any merge to StallVix `main` without owner OK |

## Uninstall

Delete the copied skills, remove pack agents from `.kilo` config (or delete `kilo.jsonc` if it was only from this pack), delete `AGENTS.granaide-kilo.md`. StallVix app code untouched.

## Owner decisions later

1. **Consumer PR** — optional: commit the installed `.kilo` bits on a StallVix branch (owner-approved).
2. **Embed** — still PARKED until ordinary graph population (Topics/Workstreams/receipts) is real.
