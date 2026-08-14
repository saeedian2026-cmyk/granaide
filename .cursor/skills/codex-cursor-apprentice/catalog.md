# Lever catalogs (agent-only)

Pick **one** Codex row and **one** Cursor row that unlock **this step**. Do not paste this file to the user. Verify the live command/UI name before teaching it.

Official Codex docs: https://developers.openai.com/codex  
Official Cursor docs: https://cursor.com/docs

## Codex — surfaces (choose where the work lives)

| Lever | Teach when the step needs |
| --- | --- |
| ChatGPT desktop **Codex app** | Parallel threads, Git diffs, worktrees, automations, plugins, in-app browser |
| **CLI / TUI** (`codex`) | Keyboard-first, `/` commands, scripting, CI-shaped `codex exec` |
| **IDE extension** | Selected code + open files as context (`/ide`) |
| **Cloud** (`codex cloud`, `codex apply`) | Background/parallel repo tasks; bring a cloud diff home with `codex apply` |
| **GitHub @codex** | PR review / fix on GitHub without leaving the PR |

Worktrees (app): isolate an experiment from the current checkout. Handoff moves a chat between local and worktree. Cloud/local/worktree are **different rooms** — say which room this step uses.

## Codex — slash / CLI (high-leverage, often missed)

Prefer these over “just prompt harder”:

| Lever | Teach when |
| --- | --- |
| `/plan` | They want a plan **in Codex** (not Cursor Plan mode — different product) |
| `/goal` | Long task needs a persistent target Codex can track |
| `/review` or `codex review` | Need a second set of eyes **without** extra edits |
| `/diff` | Inspect what Codex changed before commit |
| `/skills` and `$skill-name` | Reuse a workflow; explicit `$` beats hoping for implicit load |
| `/plugins` / `codex plugin` | Install a bundled workflow (skills + connectors + MCP) |
| `/mcp` / `codex mcp` | See/add external tools; treat new MCP as powerful and review auth |
| `/apps` | Attach a connector as `$app-slug` in the prompt |
| `/init` | Scaffold `AGENTS.md` in this folder, then edit it to match reality |
| `/permissions` + sandbox flags | Tighten/loosen what runs without asking |
| `/agent` `/subagents` | Continue a spawned thread; only spawn subagents when the user asks — they are expensive |
| `/compact` | Long chat is burning context |
| `/fork` | Branch the chat to try an approach without losing the transcript |
| `/side` `/btw` | Side question without polluting the main thread |
| `/mention` | Pin files instead of restating paths |
| `/status` `/usage` | Model, approvals, token budget — catch silent limit hits |
| `codex doctor` | Install/auth/config is broken |
| Automations (app) | Same job should recur on a schedule **after** it worked once by hand |

Customization stack (teach the difference, not all at once): **AGENTS.md** (durable repo/global instructions) → **skills** (a workflow) → **plugins** (installable bundle) → **MCP/connectors** (outside systems) → **subagents** (parallel specialists).

`$skill-creator` / plugin creator: only when they are ready to **save** a workflow they already ran successfully by hand.

## Cursor — surfaces and modes (often confused with skills)

| Lever | Teach when |
| --- | --- |
| **Agent** mode | Implementation with tools |
| **Plan** mode | Design before code. Plan is a **mode** (next to Agent), not a skill. Do not hunt a `plan` skill. |
| **Ask** / **Debug** | Read-only or evidence-first debugging |
| **Cloud Agent** vs local | Isolated VM/PR work vs the user’s machine |
| **Customize** page | Plugins, MCP, skills, subagents, rules, commands, hooks — user / team / workspace **scope** |

## Cursor — skills, rules, MCP, plugins (pick one)

| Lever | Teach when |
| --- | --- |
| **Call a skill by name** (`/skill` or @) | Need a packaged workflow. Default: skills with `disable-model-invocation` wait to be named. |
| **Rules** vs **AGENTS.md** | Durable always-on policy, not a one-shot workflow |
| **User vs project vs team** skill/rule | Global habit vs this repo vs org |
| **MCP already connected** | GitHub, docs, design, search, browser — use the server that holds the **other** system of record |
| **Cross-repo search** (Tabnine / codebase-search if present) | The other repo is not in this workspace — **search it**, do not recode it here |
| **Context7** (if present) | Library/API truth this week, not training memory |
| **Browser MCP** | UI proof in a running app; not for guessing other repos |
| **Subagents** | Isolated explore/debug — only when this step needs a specialist, not a swarm |
| **Commands / hooks** | Repeatable slash or lifecycle automation they already do by hand |
| **@ files / @ git / @ docs** | Pin context instead of pasting walls |
| **Checkpoints / restore** | After a bad agent turn, rewind; don’t pile a second rewrite |
| **PR as the record** | Chat is not the artifact; branch + reviewable diff is |

## Outside tools

Name **at most one** third-party tool (and only if it unblocks this step). Park the rest. Do not open Figma/Sanity/Datadog/etc. because they exist.
