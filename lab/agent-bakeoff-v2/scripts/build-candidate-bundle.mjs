#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  EVALUATOR_ONLY_KEYS,
  SCENARIO_FILES,
  arenaRoot,
  containsEvaluatorOnlyKeys,
  findSelfDescribingHits,
  loadJson,
  posixRel,
  publicScenariosDir,
  tryLoadJson,
  walkFiles,
} from "./lib.mjs";

const FORBIDDEN_REL_PARTS = [
  "evaluator/private",
  "evaluator\\private",
  "goldens",
  "scripts/",
  "scripts\\",
  "arena-manifest.json",
  "t5-pages-registry",
  ".runtime-private",
  "receipts/",
];

function otherScenarioFiles(scenarioId) {
  return Object.entries(SCENARIO_FILES)
    .filter(([id]) => id !== scenarioId)
    .map(([, file]) => file);
}

export function buildCandidateBundle({ outDir, scenarioId }) {
  mkdirSync(outDir, { recursive: true });
  const scenarioFile = SCENARIO_FILES[scenarioId];
  const envelope = loadJson(path.join(publicScenariosDir(), scenarioFile));
  writeFileSync(path.join(outDir, "scenario.json"), `${JSON.stringify(envelope, null, 2)}\n`);
  for (const rel of envelope.allowedFixtureRoots || []) {
    const src = path.join(arenaRoot(), rel);
    if (!existsSync(src)) {
      throw new Error(`allowedFixtureRoot missing: ${rel}`);
    }
    const dest = path.join(outDir, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
  }
  return { outDir, envelope };
}

export function verifyCandidateBundle(dir, scenarioId) {
  const failures = [];
  const envelope = loadJson(path.join(dir, "scenario.json"));
  const allowed = envelope.allowedFixtureRoots || [];
  const others = otherScenarioFiles(scenarioId || envelope.id);
  for (const abs of walkFiles(dir)) {
    const rel = posixRel(dir, abs).split(path.sep).join("/");
    for (const part of FORBIDDEN_REL_PARTS) {
      if (rel.includes(part.replaceAll("\\", "/")) || rel.includes(part)) {
        failures.push(`execution root contains forbidden path ${rel}`);
      }
    }
    if (rel === "arena-manifest.json") failures.push("execution root contains arena-manifest.json");
    if (others.some((name) => rel === name || rel.endsWith(`/${name}`))) {
      failures.push(`execution root contains another scenario ${rel}`);
    }
    if (rel !== "scenario.json") {
      const ok = allowed.some(
        (root) => rel === root || rel.startsWith(`${root.replace(/\/$/, "")}/`),
      );
      if (!ok) failures.push(`execution root contains file outside envelope/fixtures: ${rel}`);
    }
    const parsed = tryLoadJson(abs);
    const text = parsed.ok ? JSON.stringify(parsed.value) : readFileSync(abs, "utf8");
    if (parsed.ok) {
      const keys = containsEvaluatorOnlyKeys(parsed.value);
      if (keys.length) failures.push(`${rel} contains evaluator-only keys: ${keys.join(",")}`);
    } else {
      for (const key of EVALUATOR_ONLY_KEYS) {
        if (text.includes(`"${key}"`)) failures.push(`${rel} contains evaluator-only key ${key}`);
      }
    }
    const selfHits = findSelfDescribingHits(text);
    if (selfHits.length) failures.push(`${rel} contains self-describing field ${selfHits.join(",")}`);
  }
  if (!existsSync(path.join(dir, "scenario.json"))) {
    failures.push("execution root missing public scenario envelope");
  }
  return { ok: failures.length === 0, failures };
}

const invoked = process.argv[1] && path.basename(process.argv[1]).includes("build-candidate-bundle");
if (invoked) {
  const scenarioId = process.argv.includes("--scenario")
    ? process.argv[process.argv.indexOf("--scenario") + 1]
    : "T1";
  const outDir = process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : path.join(arenaRoot(), ".runtime-private", "candidate-bundle", scenarioId);
  rmSync(outDir, { recursive: true, force: true });
  const built = buildCandidateBundle({ outDir, scenarioId });
  const check = verifyCandidateBundle(built.outDir, scenarioId);
  if (!check.ok) {
    console.error(JSON.stringify(check, null, 2));
    process.exit(1);
  }
  console.log(`candidate-bundle: wrote ${outDir}`);
}
