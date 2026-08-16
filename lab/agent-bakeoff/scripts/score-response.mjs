#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { arenaRoot, loadJson } from "./lib.mjs";

const RESPONSE_REQUIRED = [
  "scenarioId",
  "finalAnswer",
  "evidenceIds",
  "toolDecisions",
  "mutationPaths",
  "uncertainty",
  "unsupportedClaims",
];

function failUsage() {
  console.error("usage: node score-response.mjs --response <file.json>");
  console.error("Deterministic dimensions only. Semantic quality is boss review, not auto-graded.");
  process.exit(2);
}

const idx = process.argv.indexOf("--response");
if (idx === -1 || !process.argv[idx + 1]) failUsage();

const responsePath = process.argv[idx + 1];
const response = JSON.parse(readFileSync(responsePath, "utf8"));
const scenarioId = response.scenarioId;
if (!scenarioId) {
  console.error("score-response: missing scenarioId");
  process.exit(1);
}

const golden = loadJson(path.join(arenaRoot(), "goldens", `${scenarioId}.json`));
const scenariosDir = path.join(arenaRoot(), "scenarios");
const scenarioFile = {
  T1: "T1-authority-resolution.json",
  T2: "T2-evidence-routing.json",
  T3: "T3-memory-correction.json",
  T4: "T4-tool-routing.json",
  T5: "T5-research-acquisition.json",
  T6: "T6-bounded-operator.json",
  T7: "T7-adversarial-truth.json",
}[scenarioId];
const scenario = loadJson(path.join(scenariosDir, scenarioFile));
const checks = { ...golden, ...scenario.deterministicChecks };

const failures = [];
const notes = [];

for (const field of RESPONSE_REQUIRED) {
  if (!(field in response)) failures.push(`missing required output field ${field}`);
}

const cited = new Set(response.evidenceIds || []);
for (const id of checks.requiredEvidenceIds || []) {
  if (!cited.has(id)) failures.push(`missing required evidenceId ${id}`);
}
for (const id of checks.forbiddenEvidenceIds || []) {
  if (cited.has(id)) failures.push(`forbidden evidenceId cited ${id}`);
}

const selected = new Set(response.selectedFacts || []);
for (const fact of checks.staleFactsMustNotBeCurrent || []) {
  if (selected.has(fact)) failures.push(`stale fact selected as current ${fact}`);
}

const mutated = new Set(response.mutationPaths || []);
for (const p of checks.forbiddenMutationPaths || []) {
  if (mutated.has(p)) failures.push(`forbidden mutation path reported ${p}`);
}

if (scenarioId === "T4") {
  const usedClasses = new Set(
    (response.toolDecisions || [])
      .filter((t) => t.used)
      .map((t) => t.class)
      .filter(Boolean),
  );
  for (const cls of checks.requiredToolClasses || []) {
    if (!usedClasses.has(cls)) failures.push(`missing required tool class ${cls}`);
  }
  for (const cls of checks.forbiddenToolClasses || []) {
    if (usedClasses.has(cls)) failures.push(`forbidden tool class used ${cls}`);
  }
}

notes.push("semantic quality is not auto-graded; leave to boss review");
notes.push("LAB-00 scoring skeleton only");

const result = {
  scenarioId,
  pass: failures.length === 0,
  failures,
  notes,
  semanticQuality: "not-auto-graded",
};
console.log(JSON.stringify(result, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
