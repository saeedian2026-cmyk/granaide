#!/usr/bin/env bash
# Local-fixture tests for install-cursor-skills.sh. No live remote, no real ~/.cursor/skills.
set -u

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
INSTALL="${SCRIPT_DIR}/install-cursor-skills.sh"
LOCK="${SCRIPT_DIR}/cursor-skills.lock"
ROOT="$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)"
GOOD="${ROOT}/cursor-skills/codex-cursor-apprentice"

pass=0
fail=0

ok() { echo "PASS $1"; pass=$((pass + 1)); }
bad() { echo "FAIL $1"; fail=$((fail + 1)); }

run_install() {
  env -u SKILL_INSTALL_FAIL_AFTER -u SKILL_INSTALL_SOURCE_COMMIT \
    SKILL_INSTALL_HOME="$1" \
    SKILL_INSTALL_SOURCE_DIR="$2" \
    SKILL_INSTALL_LOCK="${3:-$LOCK}" \
    bash "$INSTALL"
}

# --- 5. source-policy: installer/lock must not use moving refs or unpinned clone
policy_hits="$(
  grep -nE 'git clone|--depth 1|/master/|/main/|/HEAD/' "$INSTALL" "$LOCK" || true
)"
if [[ -n "$policy_hits" ]]; then
  echo "$policy_hits"
  bad "I4 source-policy"
else
  ok "I4 source-policy"
fi
if grep -qE 'commit=[0-9a-f]{40}' "$LOCK"; then
  ok "I1 lock commit sha"
else
  bad "I1 lock commit sha"
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# --- 1. exact fixture + hashes match -> success
home1="${WORKDIR}/home1"
if out="$(run_install "$home1" "$GOOD" 2>&1)" && [[ "$out" == PASS* ]] && [[ -f "${home1}/codex-cursor-apprentice/SKILL.md" ]]; then
  ok "T1 happy path"
else
  echo "$out"
  bad "T1 happy path"
fi

# --- 7. second identical run -> idempotent
if out="$(run_install "$home1" "$GOOD" 2>&1)" && [[ "$out" == PASS* ]]; then
  ok "T7 idempotent"
else
  echo "$out"
  bad "T7 idempotent"
fi

# --- 2. one-byte mutation in SKILL.md -> fail, old dest remains
home2="${WORKDIR}/home2"
mkdir -p "${home2}/codex-cursor-apprentice"
printf 'PRIOR\n' > "${home2}/codex-cursor-apprentice/SKILL.md"
printf 'PRIOR\n' > "${home2}/codex-cursor-apprentice/catalog.md"
printf 'PRIOR\n' > "${home2}/codex-cursor-apprentice/split.md"
mut="${WORKDIR}/mut"
mkdir -p "$mut"
cp "$GOOD/SKILL.md" "$GOOD/catalog.md" "$GOOD/split.md" "$mut/"
printf 'x' >> "${mut}/SKILL.md"
if run_install "$home2" "$mut" >/dev/null 2>&1; then
  bad "T2 mutation should fail"
else
  got="$(tr -d '\n\r' < "${home2}/codex-cursor-apprentice/SKILL.md")"
  if [[ "$got" == "PRIOR" ]]; then
    ok "T2 mutation preserves dest"
  else
    bad "T2 dest changed"
  fi
fi

# --- 3. missing catalog.md -> fail
home3="${WORKDIR}/home3"
mkdir -p "${home3}/codex-cursor-apprentice"
printf 'PRIOR\n' > "${home3}/codex-cursor-apprentice/SKILL.md"
miss="${WORKDIR}/miss"
mkdir -p "$miss"
cp "$GOOD/SKILL.md" "$GOOD/split.md" "$miss/"
if run_install "$home3" "$miss" >/dev/null 2>&1; then
  bad "T3 missing catalog should fail"
else
  got="$(tr -d '\n\r' < "${home3}/codex-cursor-apprentice/SKILL.md")"
  if [[ "$got" == "PRIOR" ]]; then
    ok "T3 missing catalog preserves dest"
  else
    bad "T3 dest changed"
  fi
fi

# --- 4. wrong source commit -> fail
home4="${WORKDIR}/home4"
if SKILL_INSTALL_HOME="$home4" SKILL_INSTALL_SOURCE_DIR="$GOOD" SKILL_INSTALL_LOCK="$LOCK" \
     SKILL_INSTALL_SOURCE_COMMIT="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
     bash "$INSTALL" >/dev/null 2>&1; then
  bad "T4 wrong commit should fail"
else
  ok "T4 wrong commit"
fi

badlock="${WORKDIR}/bad.lock"
sed 's/^commit=.*/commit=master/' "$LOCK" > "$badlock"
if SKILL_INSTALL_HOME="$home4" SKILL_INSTALL_SOURCE_DIR="$GOOD" SKILL_INSTALL_LOCK="$badlock" \
     bash "$INSTALL" >/dev/null 2>&1; then
  bad "T4 branch lock should fail"
else
  ok "T4 branch lock"
fi

# --- 6. partial download -> dest unchanged
home6="${WORKDIR}/home6"
mkdir -p "${home6}/codex-cursor-apprentice"
printf 'PRIOR\n' > "${home6}/codex-cursor-apprentice/SKILL.md"
if SKILL_INSTALL_HOME="$home6" SKILL_INSTALL_SOURCE_DIR="$GOOD" SKILL_INSTALL_LOCK="$LOCK" \
     SKILL_INSTALL_FAIL_AFTER=1 bash "$INSTALL" >/dev/null 2>&1; then
  bad "T6 partial should fail"
else
  got="$(tr -d '\n\r' < "${home6}/codex-cursor-apprentice/SKILL.md")"
  if [[ "$got" == "PRIOR" ]]; then
    ok "T6 partial preserves dest"
  else
    bad "T6 dest changed"
  fi
fi

echo "RESULT pass=${pass} fail=${fail}"
[[ "$fail" -eq 0 ]]
