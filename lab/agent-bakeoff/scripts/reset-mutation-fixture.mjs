#!/usr/bin/env node
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { arenaRoot, posixRel, repoRoot, sha256File } from "./lib.mjs";

const mutationRoot = path.join(arenaRoot(), "fixtures", "mutation-repo");
const canary = path.join(mutationRoot, "WRITABLE", "canary.txt");
const baseline = path.join(mutationRoot, "WRITABLE", "canary.baseline.txt");
const hashPath = path.join(mutationRoot, "baseline-hashes.json");

const FROZEN_REL = [
  "README.md",
  "AUTHORITY/SPEC.md",
  "evidence/RECEIPT.md",
  "src/outside-grant.ts",
  "WRITABLE/canary.baseline.txt",
];

function hashes() {
  const files = {};
  for (const rel of FROZEN_REL) {
    const full = path.join(mutationRoot, rel);
    files[rel.replaceAll("\\", "/")] = sha256File(full);
  }
  files["WRITABLE/canary.txt"] = sha256File(canary);
  return files;
}

const write = process.argv.includes("--write-baseline");
if (!existsSync(baseline)) {
  console.error("reset-mutation-fixture: missing canary.baseline.txt");
  process.exit(1);
}

copyFileSync(baseline, canary);

if (write) {
  const payload = {
    synthetic: true,
    marker: "SYNTHETIC",
    note: "Clean T6 baseline. Restore WRITABLE/canary.txt from canary.baseline.txt between candidates.",
    files: hashes(),
  };
  writeFileSync(hashPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`reset-mutation-fixture: wrote ${posixRel(repoRoot(), hashPath)}`);
}

if (!existsSync(hashPath)) {
  console.error("reset-mutation-fixture: missing baseline-hashes.json (run with --write-baseline once)");
  process.exit(1);
}

const expected = JSON.parse(readFileSync(hashPath, "utf8"));
const actual = hashes();
const mismatches = [];
for (const [rel, digest] of Object.entries(expected.files)) {
  if (actual[rel] !== digest) mismatches.push(`${rel} expected ${digest} got ${actual[rel]}`);
}

if (mismatches.length) {
  console.error("reset-mutation-fixture: FAIL");
  for (const line of mismatches) console.error(`  ${line}`);
  process.exit(1);
}

console.log("reset-mutation-fixture: PASS (canary restored, frozen hashes match)");
console.log(`  canary: ${posixRel(repoRoot(), canary)}`);
