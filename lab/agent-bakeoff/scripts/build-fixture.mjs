#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  ARENA_VERSION,
  GRANAIDE_BASE_SHA,
  SOURCE_CORPUS,
  STALLVIX_COMMIT,
  STALLVIX_REPO,
  arenaRoot,
  looksLikeForbiddenSecretPath,
  posixRel,
  repoRoot,
  sanitizeStallVixText,
  sha256Bytes,
} from "./lib.mjs";

function fail(message) {
  console.error(`build-fixture: FAIL: ${message}`);
  process.exit(1);
}

function git(dir, args, encoding = "utf8") {
  return execFileSync("git", ["-C", dir, ...args], {
    encoding,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function resolveStallVixGitDir() {
  const fromEnv = process.env.STALLVIX_GIT_DIR;
  const candidates = [
    fromEnv,
    path.resolve(repoRoot(), "..", "..", "StallVix"),
    path.resolve(repoRoot(), "..", "StallVix"),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (!existsSync(path.join(dir, ".git")) && !existsSync(dir)) continue;
    try {
      const inside = String(git(dir, ["rev-parse", "--is-inside-work-tree"])).trim();
      if (inside === "true") return dir;
    } catch {
      continue;
    }
  }
  fail(
    `cannot resolve StallVix git dir. Set STALLVIX_GIT_DIR. Looked at: ${candidates.join(", ")}`,
  );
}

function assertPinnedCommit(gitDir) {
  let type;
  try {
    type = String(git(gitDir, ["cat-file", "-t", STALLVIX_COMMIT])).trim();
  } catch (err) {
    fail(
      `pinned StallVix commit ${STALLVIX_COMMIT} cannot be resolved in ${gitDir}: ${err.stderr || err.message}`,
    );
  }
  if (type !== "commit") {
    fail(`pinned ref ${STALLVIX_COMMIT} is ${type}, not commit`);
  }
}

const gitDir = resolveStallVixGitDir();
assertPinnedCommit(gitDir);
console.log(`build-fixture: StallVix git dir ${gitDir}`);
console.log(`build-fixture: pinned commit ${STALLVIX_COMMIT}`);

const snapshotRoot = path.join(arenaRoot(), "fixtures", "stallvix-snapshot");
const entries = [];

for (const item of SOURCE_CORPUS) {
  if (looksLikeForbiddenSecretPath(item.sourcePath)) {
    fail(`refusing secret-like source path ${item.sourcePath}`);
  }
  let raw;
  try {
    raw = git(gitDir, ["show", `${STALLVIX_COMMIT}:${item.sourcePath}`], "buffer");
  } catch (err) {
    fail(
      `required source file missing at ${STALLVIX_COMMIT}:${item.sourcePath}: ${err.stderr || err.message}`,
    );
  }
  const original = raw.toString("utf8");
  const sanitized = sanitizeStallVixText(original);
  const dest = path.join(snapshotRoot, item.sourcePath);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, sanitized, "utf8");
  const fixturePath = posixRel(repoRoot(), dest);
  entries.push({
    sourceRepository: STALLVIX_REPO,
    sourceCommit: STALLVIX_COMMIT,
    sourcePath: item.sourcePath,
    fixturePath,
    sha256: sha256Bytes(Buffer.from(sanitized, "utf8")),
    classification: item.classification,
    sanitized: sanitized !== original,
  });
  console.log(`copied ${item.sourcePath} -> ${fixturePath}`);
}

const manifest = {
  arenaVersion: ARENA_VERSION,
  granaideBaseSha: GRANAIDE_BASE_SHA,
  stallvixRepository: STALLVIX_REPO,
  stallvixCommit: STALLVIX_COMMIT,
  builtAt: "frozen-by-builder",
  entries,
};
const manifestPath = path.join(arenaRoot(), "source-manifest.json");
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`wrote ${posixRel(repoRoot(), manifestPath)} (${entries.length} entries)`);
console.log("build-fixture: PASS");
