# Who does this step

Assign the **current** job to the stronger tool. Do not split the same edit across both.

## Codex is usually better

- Wide scan, audit, “where are we / what did we already try”
- Parallel experiments in **worktrees** without dirtying the main checkout
- Cloud / scheduled **automations** once a job already worked once
- CLI **`/review`** that must not touch the tree
- Codex-native plugins, `$skills`, connectors, `AGENTS.md` for the Codex stack
- `codex apply` to pull a cloud diff home
- Desktop **computer use / in-app browser** for a narrow GUI check Codex already has open

## Cursor is usually better

- Implementation **in the repo this chat is attached to**, following project rules already loaded here
- MCP this workspace already wired (GitHub, cross-repo search, docs, design systems)
- **Plan mode** for a design that will be executed in this Agent
- Opening / updating the **PR** that is the unit of work
- UI work that must land in **this** codebase’s existing components/design system
- Teaching Cursor-only surfaces: Customize scopes, skills-on-call, checkpoints

## UI / UX / QA split

| Job | Default owner |
| --- | --- |
| Visual QA in a browser Codex already has | Codex |
| Implement against existing components in this repo | Cursor |
| Design-system lookup via Figma/MCP **if connected here** | Cursor |
| Screenshot-driven “does this match” with no code change | Whoever has the running UI open — say which |
| Accessibility / copy / empty-error-loading states in code | Cursor |
| Exploratory click-through of a Codex-built preview | Codex |

If neither needs UI this step: write `UI: idle`.

## Default collaboration pattern

User pastes **one** Codex output into Cursor (this chat). Cursor runs the packet, locks one path, sends Codex 1–3 next searches + 1–2 clicks. Codex does that and stops. Repeat.

Do not let both tools implement the same files. One modifying owner per overlapping path.
