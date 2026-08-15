#!/usr/bin/env bash
# Install codex-cursor-apprentice from one immutable Granaide commit.
# Hashes are verified before the destination is replaced. Fail closed.
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
LOCK="${SKILL_INSTALL_LOCK:-${SCRIPT_DIR}/cursor-skills.lock}"

die() {
  echo "FAIL $*" >&2
  exit 1
}

[[ -f "$LOCK" ]] || die "missing lock"

REPO=""
COMMIT=""
PREFIX=""
HASH_SKILL=""
HASH_CATALOG=""
HASH_SPLIT=""

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" ]] && continue
  [[ "${line:0:1}" == "#" ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  case "$key" in
    repo) REPO="$val" ;;
    commit) COMMIT="$val" ;;
    prefix) PREFIX="$val" ;;
    SKILL.md) HASH_SKILL="$val" ;;
    catalog.md) HASH_CATALOG="$val" ;;
    split.md) HASH_SPLIT="$val" ;;
    *) die "unknown lock key" ;;
  esac
done < "$LOCK"

[[ "$COMMIT" =~ ^[0-9a-f]{40}$ ]] || die "lock commit is not an immutable sha"
[[ -n "$REPO" && -n "$PREFIX" && -n "$HASH_SKILL" && -n "$HASH_CATALOG" && -n "$HASH_SPLIT" ]] || die "incomplete lock"

if [[ -n "${SKILL_INSTALL_SOURCE_COMMIT:-}" && "${SKILL_INSTALL_SOURCE_COMMIT}" != "$COMMIT" ]]; then
  die "source commit mismatch"
fi

SKILLS_HOME="${SKILL_INSTALL_HOME:-${HOME}/.cursor/skills}"
DEST="${SKILLS_HOME}/codex-cursor-apprentice"
URL_BASE="https://raw.githubusercontent.com/${REPO}/${COMMIT}/${PREFIX}"

assert_immutable_url() {
  local url="$1"
  local expected="https://raw.githubusercontent.com/${REPO}/${COMMIT}/"
  [[ "$url" == "${expected}"* ]] || die "fetch URL is not the pinned commit"
}

hash_file() {
  sed $'1s/^\xef\xbb\xbf//' "$1" | tr -d '\r' | sha256sum | awk '{print $1}'
}

expected_for() {
  case "$1" in
    SKILL.md) echo "$HASH_SKILL" ;;
    catalog.md) echo "$HASH_CATALOG" ;;
    split.md) echo "$HASH_SPLIT" ;;
    *) die "unexpected file" ;;
  esac
}

STAGE=""
PREV=""
cleanup() {
  local ec=$?
  rm -rf "${STAGE:-}"
  if [[ -n "${PREV:-}" && -d "$PREV" && ! -e "$DEST" ]]; then
    mv "$PREV" "$DEST"
  fi
  exit "$ec"
}
trap cleanup EXIT

STAGE="$(mktemp -d)"
WORK="${STAGE}/incoming"
mkdir -p "$WORK"

fetch_one() {
  local name="$1"
  local out="${WORK}/${name}"
  if [[ -n "${SKILL_INSTALL_SOURCE_DIR:-}" ]]; then
    [[ -f "${SKILL_INSTALL_SOURCE_DIR}/${name}" ]] || die "missing ${name}"
    cp "${SKILL_INSTALL_SOURCE_DIR}/${name}" "$out"
  else
    local url="${URL_BASE}/${name}"
    assert_immutable_url "$url"
    curl -fsSL "$url" -o "$out" || die "http fetch ${name}"
    [[ -s "$out" ]] || die "empty ${name}"
  fi
}

FETCHED=0
for name in SKILL.md catalog.md split.md; do
  if [[ -n "${SKILL_INSTALL_FAIL_AFTER:-}" && "$FETCHED" -ge "${SKILL_INSTALL_FAIL_AFTER}" ]]; then
    die "injected partial fetch"
  fi
  fetch_one "$name"
  FETCHED=$((FETCHED + 1))
done

for name in SKILL.md catalog.md split.md; do
  got="$(hash_file "${WORK}/${name}")"
  want="$(expected_for "$name")"
  [[ "$got" == "$want" ]] || die "hash mismatch ${name}"
done

mkdir -p "$SKILLS_HOME"
NEXT="${STAGE}/next"
rm -rf "$NEXT"
cp -R "$WORK" "$NEXT"

if [[ -e "$DEST" ]]; then
  PREV="${DEST}.ds03-prev.$$"
  rm -rf "$PREV"
  mv "$DEST" "$PREV"
fi
mv "$NEXT" "$DEST"
rm -rf "$PREV"
PREV=""

echo "PASS commit=${COMMIT} dest=${DEST}"
