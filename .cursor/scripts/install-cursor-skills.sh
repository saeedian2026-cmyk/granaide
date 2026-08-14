#!/usr/bin/env bash
set -euo pipefail

# Installs personal Cursor skills into ~/.cursor/skills/ on Cloud Agent VMs.
# Source priority:
#   1. github.com/saeedian2026-cmyk/cursor-skills (when that repo exists)
#   2. Checked-out files in this workspace (granaide)
#   3. Raw files from granaide master (works on any project's Cloud Environment)

SKILLS_HOME="${HOME}/.cursor/skills"
DEST="${SKILLS_HOME}/codex-cursor-apprentice"
CURSOR_SKILLS_REPO="https://github.com/saeedian2026-cmyk/cursor-skills.git"
GRANAIDE_RAW_BASE="https://raw.githubusercontent.com/saeedian2026-cmyk/granaide/master/cursor-skills/codex-cursor-apprentice"

install_from_cursor_skills_repo() {
  local tmp
  tmp="$(mktemp -d)"
  git clone --depth 1 "${CURSOR_SKILLS_REPO}" "${tmp}"
  mkdir -p "${SKILLS_HOME}"
  rm -rf "${DEST}"
  cp -r "${tmp}/codex-cursor-apprentice" "${SKILLS_HOME}/"
  rm -rf "${tmp}"
}

install_from_workspace() {
  local src="$1"
  mkdir -p "${SKILLS_HOME}"
  rm -rf "${DEST}"
  cp -r "${src}" "${SKILLS_HOME}/codex-cursor-apprentice"
}

install_from_granaide_raw() {
  mkdir -p "${DEST}"
  curl -fsSL "${GRANAIDE_RAW_BASE}/SKILL.md" -o "${DEST}/SKILL.md"
  curl -fsSL "${GRANAIDE_RAW_BASE}/catalog.md" -o "${DEST}/catalog.md"
  curl -fsSL "${GRANAIDE_RAW_BASE}/split.md" -o "${DEST}/split.md"
}

if git ls-remote --heads "${CURSOR_SKILLS_REPO}" HEAD >/dev/null 2>&1; then
  install_from_cursor_skills_repo
elif [ -d /workspace/cursor-skills/codex-cursor-apprentice ]; then
  install_from_workspace /workspace/cursor-skills/codex-cursor-apprentice
elif [ -d /workspace/.cursor/skills/codex-cursor-apprentice ]; then
  install_from_workspace /workspace/.cursor/skills/codex-cursor-apprentice
else
  install_from_granaide_raw
fi

test -f "${DEST}/SKILL.md"
echo "Installed codex-cursor-apprentice to ${DEST}"
