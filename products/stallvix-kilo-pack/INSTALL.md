# Install — StallVix Kilo Executor Pack

Install this Granaide pack into a local StallVix checkout so Kilo loads the agents, skills, and Context7 MCP.

**Do not** put secrets in these files. **Do not** treat install as StallVix product “Kilo integration” (that remains parked until ordinary graph population).

## Prerequisites

- StallVix clone (e.g. `E:\Plan M\Projects\Cube 10\StallVix`)
- Kilo Code (desktop or CLI) that reads project `kilo.json` / `kilo.jsonc` and Agent Skills
- Node/npm available for Context7 MCP (`npx -y @upstash/context7-mcp`)

## Steps

1. From the StallVix repo root, ensure `.kilo/` exists (create if missing).

2. Copy pack config (merge carefully if StallVix already has `.kilo/kilo.json`):

```bash
# From Granaide repo
PACK="products/stallvix-kilo-pack"
SVX="/path/to/StallVix"

cp "$PACK/kilo.jsonc" "$SVX/.kilo/kilo.jsonc"
# Or merge agents + mcp.context7 into existing kilo.json / kilo.jsonc manually.
```

3. Copy skills into StallVix `.kilo/skills/` (or project skills path Kilo discovers):

```bash
mkdir -p "$SVX/.kilo/skills"
cp -R "$PACK/skills/stallvix-authority" "$SVX/.kilo/skills/"
cp -R "$PACK/skills/stallvix-receipt" "$SVX/.kilo/skills/"
cp -R "$PACK/skills/stallvix-safe-change" "$SVX/.kilo/skills/"
```

4. Place the distilled worker contract where Kilo will load it (project root preferred):

```bash
cp "$PACK/AGENTS.md" "$SVX/AGENTS.granaide-kilo.md"
# Keep StallVix AGENTS.md as canonical. Use AGENTS.granaide-kilo.md as Kilo supplement,
# or paste the Hard rules section into a Kilo-only rules file — do not silently overwrite AGENTS.md.
```

5. Open StallVix in Kilo. Confirm agents appear: `stallvix-implementer`, `stallvix-investigator`.

6. Run **Test A** before any write job: see [`PROOF-TEST-A.md`](./PROOF-TEST-A.md).

## Merge notes (existing StallVix `.kilo/kilo.json`)

StallVix may already define Context7 MCP. Prefer **one** Context7 entry. Keep Granaide agents as additive. Do not delete operator session files such as `agent-manager.json`.

## Uninstall

Remove copied skills, `kilo.jsonc` agents block (or file), and `AGENTS.granaide-kilo.md`. Leave StallVix product code untouched.

## After install (owner decision)

- Consumer PR into StallVix: optional, owner-approved, docs/config only.
- Embedded control plane / job dispatch: still PARKED per OBS PR #35 packet 003.
