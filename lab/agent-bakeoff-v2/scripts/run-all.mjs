#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { arenaRoot, repoRoot } from "./lib.mjs";

const NODE = process.execPath;

function run(args) {
  execFileSync(NODE, args, { stdio: "inherit", cwd: repoRoot() });
}

run([path.join(arenaRoot(), "scripts", "verify-arena.mjs"), "--write-manifest"]);
run([path.join(arenaRoot(), "scripts", "verify-arena.mjs")]);
run([path.join(arenaRoot(), "scripts", "verify-public-safety.mjs")]);
run([path.join(arenaRoot(), "scripts", "serve-web-fixtures.mjs"), "--self-check"]);
run([path.join(arenaRoot(), "scripts", "run-negative-controls.mjs")]);
console.log("run-all: PASS");
