# cursor-skills

Personal Cursor Agent skills, installed on Cloud Agent VMs via environment setup.

## Skills

| Skill | Invoke | Purpose |
| --- | --- | --- |
| `codex-cursor-apprentice` | `/codex-cursor-apprentice` | Dual Codex + Cursor learn-as-you-go loop for the current goal |

## Cloud Agent install (every project)

Add to each repo's **Cloud Agent environment** install script:

```bash
npm ci
bash .cursor/scripts/install-cursor-skills.sh
```

Copy `.cursor/scripts/install-cursor-skills.sh` from [granaide](https://github.com/saeedian2026-cmyk/granaide) into each repo, or keep one shared environment and reuse the same install block.

The script installs into `~/.cursor/skills/` on the VM so skills work across Cloud chats even when they are not committed under that repo.

## Standalone repo (optional)

This folder mirrors what lives in `github.com/saeedian2026-cmyk/cursor-skills`.

Until that repo exists, the install script uses checked-out granaide files or raw GitHub URLs from granaide `master`.

To publish the standalone repo once:

1. Create an empty public repo named `cursor-skills` on GitHub.
2. Push this folder:

```bash
cd cursor-skills
git init
git add .
git commit -m "Initial cursor-skills"
git branch -M main
git remote add origin https://github.com/saeedian2026-cmyk/cursor-skills.git
git push -u origin main
```

After push, the install script auto-switches to the dedicated repo.

## Windows / Chrome

Cloud Agents do not sync `%USERPROFILE%\.cursor\skills\` from your PC. Environment install is the global path for browser-only use.
