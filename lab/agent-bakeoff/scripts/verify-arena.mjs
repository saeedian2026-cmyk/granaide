#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  ARENA_VERSION,
  GRANAIDE_BASE_SHA,
  SCENARIO_REQUIRED_FIELDS,
  STALLVIX_COMMIT,
  arenaRoot,
  loadJson,
  looksLikeForbiddenSecretPath,
  posixRel,
  repoRoot,
  sha256File,
  walkFiles,
} from "./lib.mjs";

const SCENARIO_FILES = {
  T1: "T1-authority-resolution.json",
  T2: "T2-evidence-routing.json",
  T3: "T3-memory-correction.json",
  T4: "T4-tool-routing.json",
  T5: "T5-research-acquisition.json",
  T6: "T6-bounded-operator.json",
  T7: "T7-adversarial-truth.json",
};

const writeManifest = process.argv.includes("--write-manifest");
const negativeControl = process.argv.includes("--negative-control");
const errors = [];

function err(message) {
  errors.push(message);
  console.error(`verify-arena: ${message}`);
}

function ok(message) {
  console.log(`verify-arena: ${message}`);
}

function rel(p) {
  return posixRel(repoRoot(), p);
}

const root = arenaRoot();
const scenariosDir = path.join(root, "scenarios");
const goldensDir = path.join(root, "goldens");
const catalog = loadJson(path.join(goldensDir, "evidence-catalog.json"));

function verifyScenarios() {
  for (const [id, file] of Object.entries(SCENARIO_FILES)) {
    const full = path.join(scenariosDir, file);
    if (!existsSync(full)) {
      err(`missing scenario ${file}`);
      continue;
    }
    let data;
    try {
      data = loadJson(full);
    } catch (e) {
      err(`scenario ${file} does not parse: ${e.message}`);
      continue;
    }
    if (data.id !== id) err(`${file} id ${data.id} != ${id}`);
    for (const field of SCENARIO_REQUIRED_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        err(`${file} missing required field ${field}`);
      }
    }
    const goldenPath = path.join(goldensDir, `${id}.json`);
    if (!existsSync(goldenPath)) err(`missing golden ${id}.json`);
    else {
      try {
        loadJson(goldenPath);
      } catch (e) {
        err(`golden ${id}.json does not parse: ${e.message}`);
      }
    }
    const ids = [
      ...(data.expectedEvidenceIds || []),
      ...(data.deterministicChecks?.requiredEvidenceIds || []),
      ...(data.deterministicChecks?.forbiddenEvidenceIds || []),
    ];
    for (const evidenceId of ids) {
      const entry = catalog.evidence[evidenceId];
      if (!entry) {
        err(`${id} references unknown evidenceId ${evidenceId}`);
        continue;
      }
      const evidenceFile = path.join(repoRoot(), entry.path);
      if (!existsSync(evidenceFile)) {
        err(`${id} evidence ${evidenceId} path missing: ${entry.path}`);
      }
    }
    ok(`${id} parsed`);
  }
}

function verifySourceManifest() {
  const manifestPath = path.join(root, "source-manifest.json");
  if (!existsSync(manifestPath)) {
    err("missing source-manifest.json — run build-fixture.mjs");
    return;
  }
  const manifest = loadJson(manifestPath);
  if (manifest.stallvixCommit !== STALLVIX_COMMIT) {
    err(`source-manifest stallvixCommit ${manifest.stallvixCommit} != ${STALLVIX_COMMIT}`);
  }
  if (manifest.granaideBaseSha !== GRANAIDE_BASE_SHA) {
    err(`source-manifest granaideBaseSha mismatch`);
  }
  if (!manifest.entries?.length) err("source-manifest has no entries");
  for (const entry of manifest.entries || []) {
    const full = path.join(repoRoot(), entry.fixturePath);
    if (!existsSync(full)) {
      err(`source entry missing ${entry.fixturePath}`);
      continue;
    }
    const digest = sha256File(full);
    if (digest !== entry.sha256) {
      err(`hash mismatch ${entry.fixturePath} expected ${entry.sha256} got ${digest}`);
    }
    if (looksLikeForbiddenSecretPath(entry.fixturePath)) {
      err(`secret-like fixture path ${entry.fixturePath}`);
    }
  }
  ok(`source-manifest ${manifest.entries.length} hashes checked`);
}

function verifySyntheticMarkers() {
  const syntheticRoot = path.join(root, "fixtures", "synthetic");
  for (const file of walkFiles(syntheticRoot)) {
    const text = readFileSync(file, "utf8");
    if (!text.includes("SYNTHETIC")) {
      err(`synthetic fixture unmarked: ${rel(file)}`);
    }
  }
  ok("synthetic fixtures marked SYNTHETIC");
}

function verifyNoSecrets() {
  const fixturesRoot = path.join(root, "fixtures");
  for (const file of walkFiles(fixturesRoot)) {
    const relPath = posixRel(fixturesRoot, file);
    if (looksLikeForbiddenSecretPath(relPath)) {
      err(`forbidden secret-like path ${relPath}`);
    }
  }
  ok("no secret-like fixture paths");
}

function verifyMutationBaseline() {
  const hashPath = path.join(root, "fixtures", "mutation-repo", "baseline-hashes.json");
  if (!existsSync(hashPath)) {
    err("missing mutation baseline-hashes.json — run reset-mutation-fixture.mjs --write-baseline");
    return;
  }
  const expected = loadJson(hashPath);
  for (const [relPath, digest] of Object.entries(expected.files || {})) {
    const full = path.join(root, "fixtures", "mutation-repo", relPath);
    if (!existsSync(full)) {
      err(`mutation baseline file missing ${relPath}`);
      continue;
    }
    const actual = sha256File(full);
    if (actual !== digest) err(`mutation hash mismatch ${relPath}`);
  }
  ok("mutation baseline hashes match");
}

function immutableFiles() {
  return walkFiles(root).filter((file) => {
    const relPath = posixRel(root, file);
    if (relPath.startsWith("receipts/")) return false;
    if (relPath === "arena-manifest.json") return false;
    if (relPath === "fixtures/mutation-repo/WRITABLE/canary.txt") return false;
    return true;
  });
}

function verifyArenaManifest() {
  const files = immutableFiles().map((file) => ({
    path: rel(file),
    sha256: sha256File(file),
  }));
  const manifestPath = path.join(root, "arena-manifest.json");
  const payload = {
    arenaVersion: ARENA_VERSION,
    granaideBaseSha: GRANAIDE_BASE_SHA,
    stallvixCommit: STALLVIX_COMMIT,
    note: "Immutable arena artifacts. Benchmark changes after candidate testing begins require a new arena version, not silent edits. receipts/ are excluded.",
    files,
  };
  if (writeManifest) {
    writeFileSync(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    ok(`wrote arena-manifest.json (${files.length} files)`);
    return;
  }
  if (!existsSync(manifestPath)) {
    err("missing arena-manifest.json — run verify-arena.mjs --write-manifest");
    return;
  }
  const sealed = loadJson(manifestPath);
  if (sealed.arenaVersion !== ARENA_VERSION) err("arenaVersion drift");
  if (sealed.stallvixCommit !== STALLVIX_COMMIT) err("arena stallvixCommit drift");
  const sealedMap = new Map(sealed.files.map((f) => [f.path, f.sha256]));
  const liveMap = new Map(files.map((f) => [f.path, f.sha256]));
  for (const [p, digest] of liveMap) {
    if (!sealedMap.has(p)) err(`arena-manifest missing ${p}`);
    else if (sealedMap.get(p) !== digest) err(`arena-manifest hash mismatch ${p}`);
  }
  for (const p of sealedMap.keys()) {
    if (!liveMap.has(p)) err(`arena-manifest extra ${p}`);
  }
  ok(`arena-manifest covers ${files.length} immutable artifacts`);
}

function restoreAndMutate() {
  const manifest = loadJson(path.join(root, "source-manifest.json"));
  const target = path.join(repoRoot(), manifest.entries[0].fixturePath);
  const original = readFileSync(target);
  writeFileSync(target, Buffer.concat([original, Buffer.from("X")]));
  const digest = sha256File(target);
  const failed = digest !== manifest.entries[0].sha256;
  writeFileSync(target, original);
  return { target: rel(target), failed };
}

verifyScenarios();
verifySourceManifest();
verifySyntheticMarkers();
verifyNoSecrets();
verifyMutationBaseline();
verifyArenaManifest();

if (errors.length) {
  console.error(`verify-arena: FAIL (${errors.length})`);
  process.exit(1);
}

ok("PASS");

if (negativeControl) {
  const result = restoreAndMutate();
  if (!result.failed) {
    console.error(`verify-arena: negative-control did not detect mutation of ${result.target}`);
    process.exit(1);
  }
  console.log(`verify-arena: negative-control FAIL observed on ${result.target} (restored)`);
  const second = [];
  const prevErr = err;
  // re-run hash check after restore by comparing source-manifest again
  const manifest = loadJson(path.join(root, "source-manifest.json"));
  for (const entry of manifest.entries) {
    const full = path.join(repoRoot(), entry.fixturePath);
    if (sha256File(full) !== entry.sha256) second.push(entry.fixturePath);
  }
  void prevErr;
  if (second.length) {
    console.error("verify-arena: restore did not return hashes to green");
    process.exit(1);
  }
  console.log("verify-arena: negative-control restored; hashes green");
}
