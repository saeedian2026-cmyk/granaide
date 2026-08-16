#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  arenaRoot,
  looksLikeForbiddenSecretPath,
  posixRel,
  repoRoot,
  sha256File,
  walkFiles,
} from "./lib.mjs";

const errors = [];

function err(message) {
  errors.push(message);
  console.error(`verify-public-safety: ${message}`);
}

function ok(message) {
  console.log(`verify-public-safety: ${message}`);
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SUPABASE_HOST = /[a-z0-9-]+\.supabase\.co/i;
const JWTISH = /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./;
const KEYISH = /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/;
const PEM = /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/;
const STALLVIX_COPY = /stallvix-snapshot/i;

function gitLsFiles(prefix) {
  const out = execFileSync("git", ["-C", repoRoot(), "ls-files", "-z", prefix], {
    encoding: "utf8",
  });
  return out.split("\0").filter(Boolean);
}

function scanText(rel, text) {
  if (EMAIL.test(text)) err(`${rel} matches email pattern`);
  if (SUPABASE_HOST.test(text)) err(`${rel} matches Supabase project host`);
  if (JWTISH.test(text)) err(`${rel} matches JWT/token-like material`);
  if (KEYISH.test(text)) err(`${rel} matches obvious API key pattern`);
  if (PEM.test(text)) err(`${rel} matches PEM/private-key material`);
  if (STALLVIX_COPY.test(text) || STALLVIX_COPY.test(rel)) {
    err(`${rel} references stallvix-snapshot copy path`);
  }
}

function optionalStallVixHashCollision() {
  const stallvixDir = process.env.STALLVIX_GIT_DIR;
  if (!stallvixDir) {
    ok("STALLVIX_GIT_DIR unset; skipped local StallVix byte-collision check");
    return;
  }
  if (!existsSync(stallvixDir)) {
    err(`STALLVIX_GIT_DIR does not exist: ${stallvixDir}`);
    return;
  }
  const hashes = new Map();
  for (const abs of walkFiles(stallvixDir)) {
    if (abs.includes(`${path.sep}.git${path.sep}`)) continue;
    hashes.set(sha256File(abs), posixRel(stallvixDir, abs));
  }
  for (const abs of walkFiles(arenaRoot())) {
    const hit = hashes.get(sha256File(abs));
    if (hit) err(`${posixRel(arenaRoot(), abs)} byte-matches StallVix file ${hit}`);
  }
  ok("no committed arena file byte-matches the local StallVix checkout");
}

const tracked = gitLsFiles("lab/agent-bakeoff-v2");
for (const file of tracked) {
  if (looksLikeForbiddenSecretPath(file)) err(`tracked forbidden filename ${file}`);
  if (file.includes(".runtime-private")) err(`tracked private runtime path ${file}`);
  const abs = path.join(repoRoot(), file);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, "utf8");
  scanText(file, text);
}

optionalStallVixHashCollision();

console.log(
  "verify-public-safety: this regex/static scan is a guardrail, not a confidentiality proof.",
);

if (errors.length) {
  console.error(`verify-public-safety: FAIL (${errors.length})`);
  process.exit(1);
}
console.log("verify-public-safety: PASS");
