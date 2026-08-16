#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ARENA_VERSION,
  CANDIDATE_EXECUTION_ROOT_POLICY,
  EVALUATOR_PRIVATE_PREFIX,
  GRANAIDE_BASE_SHA,
  SCENARIO_FILES,
  STALLVIX_COMMIT,
  STALLVIX_REPO,
  SYNTHETIC_MARKER,
  arenaRoot,
  containsEvaluatorOnlyKeys,
  duplicatedOracleMismatches,
  evaluatorDir,
  findSelfDescribingHits,
  loadJson,
  looksLikeForbiddenSecretPath,
  posixRel,
  publicScenariosDir,
  repoRoot,
  sha256CanonicalFile,
  sha256File,
  walkFiles,
} from "./lib.mjs";
import { writeSealedFromDisk } from "./observe-fs.mjs";

const writeManifest = process.argv.includes("--write-manifest");
const errors = [];

function err(message) {
  errors.push(message);
  console.error(`verify-arena: ${message}`);
}

function ok(message) {
  console.log(`verify-arena: ${message}`);
}

function gitLsFiles(prefix) {
  const out = execFileSync("git", ["-C", repoRoot(), "ls-files", "-z", prefix], {
    encoding: "utf8",
  });
  return out.split("\0").filter(Boolean);
}

function promptText(scenario) {
  const parts = [scenario.prompt || ""];
  for (const turn of scenario.turns || []) parts.push(turn.prompt || "");
  return parts.join("\n");
}

function buildManifest() {
  const files = {};
  for (const abs of walkFiles(arenaRoot())) {
    const rel = posixRel(arenaRoot(), abs);
    if (rel === "arena-manifest.json") continue;
    files[rel] = sha256CanonicalFile(abs);
  }
  return {
    arenaVersion: ARENA_VERSION,
    granaideBaseSha: GRANAIDE_BASE_SHA,
    stallvixProvenance: {
      repository: STALLVIX_REPO,
      commit: STALLVIX_COMMIT,
      note: "Provenance only. No StallVix document bodies are committed to this arena.",
    },
    candidateExecutionRootPolicy: CANDIDATE_EXECUTION_ROOT_POLICY,
    evaluatorPrivatePrefix: EVALUATOR_PRIVATE_PREFIX,
    publicFiles: Object.fromEntries(
      Object.entries(files).filter(([rel]) => !rel.startsWith("evaluator/")),
    ),
    evaluatorFiles: Object.fromEntries(
      Object.entries(files).filter(([rel]) => rel.startsWith("evaluator/")),
    ),
  };
}

function verifyScenarios() {
  const publicOracleHits = [];
  for (const [id, file] of Object.entries(SCENARIO_FILES)) {
    const full = path.join(publicScenariosDir(), file);
    if (!existsSync(full)) {
      err(`missing public scenario ${file}`);
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
    if (data.arenaVersion !== ARENA_VERSION) err(`${file} arenaVersion mismatch`);
    const leakedKeys = containsEvaluatorOnlyKeys(data);
    if (leakedKeys.length) err(`${file} contains evaluator-only keys: ${leakedKeys.join(",")}`);
    const goldenPath = path.join(evaluatorDir(), "goldens", `${id}.json`);
    if (!existsSync(goldenPath)) {
      err(`missing golden ${id}.json`);
      continue;
    }
    const golden = loadJson(goldenPath);
    const mirrorFails = duplicatedOracleMismatches(data, golden);
    for (const fail of mirrorFails) err(fail);
    const prompt = promptText(data);
    for (const oracle of golden.oracleStrings || []) {
      if (id === "T3" && data.turns) {
        const turn3 = data.turns.find((t) => t.turn === 3);
        if (turn3 && turn3.prompt.includes(oracle)) {
          publicOracleHits.push(`${id} turn 3 prompt contains oracle ${oracle}`);
        }
      } else if (id !== "T6" && prompt.includes(oracle)) {
        publicOracleHits.push(`${id} public prompt contains oracle ${oracle}`);
      }
    }
    for (const decoy of golden.decoyStrings || []) {
      if ((data.prompt || "").includes(decoy)) {
        publicOracleHits.push(`${id} prompt identifies decoy ${decoy}`);
      }
    }
    const blob = JSON.stringify(data);
    if (/\bdistractor\b/i.test(blob)) err(`${id} public scenario identifies a distractor as a distractor`);
    if (/\bmalicious\b/i.test(blob) || /\bhostile evidence\b/i.test(blob)) {
      err(`${id} public scenario identifies malicious files as malicious`);
    }
    for (const root of data.allowedFixtureRoots || []) {
      if (root.includes("evaluator")) err(`${id} allowedFixtureRoots includes evaluator path ${root}`);
    }
  }
  for (const hit of publicOracleHits) err(hit);
  ok("public scenarios parsed and separated from evaluator keys");
}

function verifySelfDescribingFields() {
  const roots = [
    publicScenariosDir(),
    path.join(arenaRoot(), "fixtures", "synthetic"),
    path.join(arenaRoot(), "fixtures", "web"),
    path.join(arenaRoot(), "fixtures", "mutation-repo"),
  ];
  for (const root of roots) {
    for (const abs of walkFiles(root)) {
      const text = readFileSync(abs, "utf8");
      const hits = findSelfDescribingHits(text);
      if (hits.length) err(`${posixRel(arenaRoot(), abs)} has self-describing field ${hits.join(",")}`);
    }
  }
  ok("candidate fixtures have no self-describing oracle fields");
}

function verifyT5RegistryIsolation() {
  const registry = path.join(evaluatorDir(), "t5-pages-registry.json");
  if (!existsSync(registry)) {
    err("missing evaluator/private/t5-pages-registry.json");
    return;
  }
  const webRoot = path.join(arenaRoot(), "fixtures", "web");
  for (const abs of walkFiles(webRoot)) {
    const rel = posixRel(arenaRoot(), abs);
    const text = readFileSync(abs, "utf8");
    if (rel.includes("t5-pages-registry")) err(`T5 registry committed under web fixtures: ${rel}`);
    if (text.includes("correctPage") || text.includes("\"correctFact\"")) {
      err(`web fixture contains pages-registry fields: ${rel}`);
    }
  }
  ok("T5 pages registry is evaluator-private and not in web fixtures");
}

function verifyT3AuthorityVsRecency() {
  const scenario = loadJson(path.join(publicScenariosDir(), SCENARIO_FILES.T3));
  const ids = new Set((scenario.evidenceRefs || []).map((r) => r.id));
  for (const id of ["CONV-STATE-A", "CONV-CORRECTION", "CONV-STANDUP", "CONV-BERTH-N", "CONV-BERTH-S"]) {
    if (!ids.has(id)) err(`T3 missing required evidence id ${id}`);
  }
  const turn3 = (scenario.turns || []).find((t) => t.turn === 3);
  const turn3Ids = new Set((turn3?.evidenceRefs || []).map((r) => r.id));
  if (turn3Ids.has("CONV-CORRECTION")) err("T3 turn 3 prompt attachments repeat the correction");
  if (!turn3Ids.has("CONV-STANDUP") || !turn3Ids.has("CONV-BERTH-N") || !turn3Ids.has("CONV-BERTH-S")) {
    err("T3 turn 3 must attach newer-non-authoritative and unresolved-contradiction evidence");
  }
  ok("T3 includes superseded, authoritative, newer-non-authoritative, and unresolved evidence");
}

function verifyGoldensUnreachableFromAllowedRoots() {
  for (const [id, file] of Object.entries(SCENARIO_FILES)) {
    const scenario = loadJson(path.join(publicScenariosDir(), file));
    const goldenAbs = path.join(evaluatorDir(), "goldens", `${id}.json`);
    const goldenRel = posixRel(arenaRoot(), goldenAbs);
    for (const root of scenario.allowedFixtureRoots || []) {
      if (goldenRel === root || goldenRel.startsWith(`${root.replace(/\/$/, "")}/`)) {
        err(`${id} golden is inside allowedFixtureRoot ${root}`);
      }
    }
  }
  ok("goldens are outside adapter allowed evidence roots");
}

function verifySyntheticMarkers() {
  const syntheticRoot = path.join(arenaRoot(), "fixtures", "synthetic");
  for (const abs of walkFiles(syntheticRoot)) {
    const text = readFileSync(abs, "utf8");
    if (!text.includes(SYNTHETIC_MARKER) && !text.includes("not a StallVix document")) {
      err(`synthetic fixture missing marker: ${posixRel(arenaRoot(), abs)}`);
    }
  }
  const mutRoot = path.join(arenaRoot(), "fixtures", "mutation-repo");
  for (const abs of walkFiles(mutRoot)) {
    if (abs.endsWith(".ts") || abs.endsWith("canary.txt")) continue;
    const text = readFileSync(abs, "utf8");
    if (abs.endsWith("TASK.txt") || abs.endsWith("canary.txt")) continue;
    if (!text.includes("SYNTHETIC BENCHMARK FIXTURE") && !text.includes("not a StallVix document")) {
      if (abs.endsWith(".md") || abs.endsWith(".json")) {
        err(`mutation fixture missing marker: ${posixRel(arenaRoot(), abs)}`);
      }
    }
  }
  ok("synthetic fixtures are marked purpose-built");
}

function verifyTrackedSecrets() {
  const tracked = gitLsFiles("lab/agent-bakeoff-v2");
  for (const file of tracked) {
    const rel = file.replace(/^lab\/agent-bakeoff-v2\//, "");
    if (looksLikeForbiddenSecretPath(rel) || looksLikeForbiddenSecretPath(file)) {
      err(`forbidden secret path is git-tracked: ${file}`);
    }
  }
  if (tracked.some((f) => f.includes("stallvix-snapshot"))) {
    err("stallvix-snapshot path is git-tracked");
  }
  ok("no forbidden secret paths tracked under the v2 arena");
}

async function main() {
  if (writeManifest) writeSealedFromDisk();
  else if (!existsSync(path.join(evaluatorDir(), "t6-sealed.json"))) {
    err("missing evaluator/private/t6-sealed.json; run with --write-manifest");
  }
  verifyScenarios();
  verifySelfDescribingFields();
  verifyT5RegistryIsolation();
  verifyT3AuthorityVsRecency();
  verifyGoldensUnreachableFromAllowedRoots();
  verifySyntheticMarkers();
  verifyTrackedSecrets();

  const { buildCandidateBundle, verifyCandidateBundle, buildTurnSurface, verifyTurnSurface } =
    await import("./build-candidate-bundle.mjs");
  const laterTurnEvidence = [
    "correction-2026-08-16.md",
    "standup-2026-08-17.md",
    "berth-north.md",
    "berth-south.md",
  ];
  function assertBundleHygiene(tmp, id, turn) {
    const label = turn == null ? id : `${id} turn ${turn}`;
    const bundleRels = walkFiles(tmp).map((abs) => posixRel(tmp, abs));
    if (bundleRels.some((rel) => rel.includes("evaluator/"))) err(`${label} bundle leaked evaluator/`);
    if (bundleRels.some((rel) => rel.includes("scripts/"))) err(`${label} bundle leaked scorer/scripts`);
    if (bundleRels.some((rel) => rel.endsWith("arena-manifest.json"))) err(`${label} bundle leaked arena-manifest`);
    if (id !== "T1" && bundleRels.some((rel) => rel.includes("T1-authority-resolution.json"))) {
      err(`${label} bundle contains another scenario`);
    }
    if (id === "T5" && bundleRels.some((rel) => rel.includes("p4.html") || rel.includes("t5-pages-registry"))) {
      err("T5 execution root contains answer-bearing web/registry files");
    }
    if (id === "T4" && bundleRels.some((rel) => rel.includes("t4/token.json"))) {
      err("T4 execution root contains localhost token file; token must be HTTP-only");
    }
    if (id === "T3" && turn === 1) {
      if (bundleRels.some((rel) => laterTurnEvidence.some((name) => rel.endsWith(name)))) {
        err("T3 turn 1 filesystem contains later-turn evidence");
      }
    }
  }
  for (const id of Object.keys(SCENARIO_FILES)) {
    const envelope = loadJson(path.join(publicScenariosDir(), SCENARIO_FILES[id]));
    if (envelope.mode === "multi-turn") {
      for (const t of envelope.turns || []) {
        const tmp = path.join(os.tmpdir(), `lab-00-v2-bundle-${process.pid}-${id}-t${t.turn}`);
        rmSync(tmp, { recursive: true, force: true });
        mkdirSync(tmp, { recursive: true });
        buildTurnSurface({ outDir: tmp, scenarioId: id, turn: t.turn, envelope });
        const turnCheck = verifyTurnSurface(tmp, id, t.turn);
        if (!turnCheck.ok) turnCheck.failures.forEach((f) => err(`${id} turn ${t.turn}: ${f}`));
        assertBundleHygiene(tmp, id, t.turn);
        rmSync(tmp, { recursive: true, force: true });
      }
      continue;
    }
    const tmp = path.join(os.tmpdir(), `lab-00-v2-bundle-${process.pid}-${id}`);
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const built = buildCandidateBundle({ outDir: tmp, scenarioId: id });
    const bundleCheck = verifyCandidateBundle(built.outDir, id);
    if (!bundleCheck.ok) bundleCheck.failures.forEach((f) => err(`${id} candidate bundle: ${f}`));
    assertBundleHygiene(tmp, id);
    rmSync(tmp, { recursive: true, force: true });
  }
  ok("per-scenario candidate execution roots contain only envelope + allowed fixtures");
  ok("T3 per-turn surfaces isolate future evidence");

  const manifest = buildManifest();
  const manifestPath = path.join(arenaRoot(), "arena-manifest.json");
  if (writeManifest) {
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    ok("wrote arena-manifest.json");
  } else if (!existsSync(manifestPath)) {
    err("missing arena-manifest.json; run with --write-manifest");
  } else {
    const current = loadJson(manifestPath);
    const rebuild = buildManifest();
    if (JSON.stringify(current.publicFiles) !== JSON.stringify(rebuild.publicFiles)) {
      err("public fixture hashes drifted from arena-manifest.json");
    } else ok("public fixture hashes match arena-manifest.json");
    if (JSON.stringify(current.evaluatorFiles) !== JSON.stringify(rebuild.evaluatorFiles)) {
      err("evaluator fixture hashes drifted from arena-manifest.json");
    } else ok("evaluator fixture hashes match arena-manifest.json");
    if (current.arenaVersion !== ARENA_VERSION) err("manifest arenaVersion mismatch");
  }

  if (errors.length) {
    console.error(`verify-arena: FAIL (${errors.length})`);
    process.exit(1);
  }
  console.log("verify-arena: PASS");
}

main().catch((error) => {
  console.error(`verify-arena: FAIL ${error.message}`);
  process.exit(1);
});
