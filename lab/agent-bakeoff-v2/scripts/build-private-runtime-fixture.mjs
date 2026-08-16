#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  PRIVATE_RUNTIME_SOURCE_PATHS,
  STALLVIX_COMMIT,
  STALLVIX_REPO,
  arenaRoot,
} from "./lib.mjs";

function fail(message) {
  console.error(`build-private-runtime-fixture: ${message}`);
  process.exit(1);
}

const stallvixDir = process.env.STALLVIX_GIT_DIR;
if (!stallvixDir) fail("STALLVIX_GIT_DIR is required for the optional private runtime fixture");
if (!existsSync(stallvixDir)) fail(`STALLVIX_GIT_DIR does not exist: ${stallvixDir}`);

const head = execFileSync("git", ["-C", stallvixDir, "rev-parse", STALLVIX_COMMIT], {
  encoding: "utf8",
}).trim();
if (head !== STALLVIX_COMMIT) fail(`pinned commit ${STALLVIX_COMMIT} not resolvable`);

const outDir = path.join(arenaRoot(), ".runtime-private", "stallvix", STALLVIX_COMMIT);
mkdirSync(outDir, { recursive: true });

const entries = [];
for (const item of PRIVATE_RUNTIME_SOURCE_PATHS) {
  const body = execFileSync("git", ["-C", stallvixDir, "show", `${STALLVIX_COMMIT}:${item.sourcePath}`], {
    encoding: "utf8",
  });
  const dest = path.join(outDir, item.sourcePath);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, body, "utf8");
  entries.push({
    sourceRepository: STALLVIX_REPO,
    sourceCommit: STALLVIX_COMMIT,
    sourcePath: item.sourcePath,
    localPath: path.relative(arenaRoot(), dest).split(path.sep).join("/"),
    classification: item.classification,
    committed: false,
  });
}

writeFileSync(
  path.join(arenaRoot(), ".runtime-private", "manifest.json"),
  `${JSON.stringify({ localOnly: true, committed: false, entries }, null, 2)}\n`,
);

console.log(`build-private-runtime-fixture: wrote ${outDir}`);
console.log("This directory is gitignored and must never be staged.");
