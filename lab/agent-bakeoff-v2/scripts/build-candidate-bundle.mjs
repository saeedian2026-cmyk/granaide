#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  EVALUATOR_ONLY_KEYS,
  SCENARIO_FILES,
  arenaRoot,
  containsEvaluatorOnlyKeys,
  evidenceRefsForTurn,
  findSelfDescribingHits,
  futureEvidencePaths,
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

function loadEnvelope(scenarioId) {
  const scenarioFile = SCENARIO_FILES[scenarioId];
  return loadJson(path.join(publicScenariosDir(), scenarioFile));
}

function copyEvidenceRefs(outDir, refs) {
  for (const ref of refs) {
    if (!ref?.path) continue;
    const src = path.join(arenaRoot(), ref.path);
    if (!existsSync(src)) {
      throw new Error(`evidence path missing: ${ref.path}`);
    }
    const dest = path.join(outDir, ref.path);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
}

export function buildTurnSurface({ outDir, scenarioId, turn, envelope }) {
  const full = envelope || loadEnvelope(scenarioId);
  if (full.mode !== "multi-turn") {
    throw new Error(`${scenarioId} is not multi-turn`);
  }
  const current = (full.turns || []).find((t) => t.turn === turn);
  if (!current) throw new Error(`${scenarioId} missing turn ${turn}`);
  mkdirSync(outDir, { recursive: true });
  const refs = evidenceRefsForTurn(full, turn);
  const turnEnvelope = {
    id: full.id,
    title: full.title,
    arenaVersion: full.arenaVersion,
    mode: "multi-turn",
    turn,
    objective: full.objective,
    prompt: current.prompt,
    evidenceRefs: refs,
    conversationState: (full.turns || [])
      .filter((t) => t.turn < turn)
      .map((t) => ({
        turn: t.turn,
        prompt: t.prompt,
        evidenceRefIds: (t.evidenceRefs || []).map((r) => r.id),
      })),
    outputNotes: full.outputNotes,
  };
  writeFileSync(path.join(outDir, "scenario.json"), `${JSON.stringify(turnEnvelope, null, 2)}\n`);
  copyEvidenceRefs(outDir, refs);
  return { outDir, envelope: turnEnvelope, turn };
}

export function verifyTurnSurface(dir, scenarioId, turn) {
  const failures = [];
  const full = loadEnvelope(scenarioId);
  const allowedPaths = new Set(evidenceRefsForTurn(full, turn).map((r) => r.path));
  const futurePaths = futureEvidencePaths(full, turn);
  const futureBases = new Set(futurePaths.map((p) => p.split("/").pop()));
  if (!existsSync(path.join(dir, "scenario.json"))) {
    failures.push(`turn ${turn} missing public scenario envelope`);
    return { ok: false, failures };
  }
  const surface = loadJson(path.join(dir, "scenario.json"));
  for (const ref of surface.evidenceRefs || []) {
    if (futurePaths.includes(ref.path)) {
      failures.push(`turn ${turn} envelope lists future evidence ${ref.path}`);
    }
  }
  for (const abs of walkFiles(dir)) {
    const rel = posixRel(dir, abs).split(path.sep).join("/");
    if (rel === "scenario.json") continue;
    if (futurePaths.includes(rel) || futureBases.has(path.basename(abs))) {
      failures.push(`turn ${turn} filesystem contains future evidence ${rel}`);
    }
    if (!allowedPaths.has(rel)) {
      failures.push(`turn ${turn} filesystem contains file outside this turn's evidence: ${rel}`);
    }
  }
  const base = verifyCandidateBundle(dir, scenarioId, { turn, allowedPaths: [...allowedPaths] });
  failures.push(...base.failures);
  return { ok: failures.length === 0, failures };
}

export function buildCandidateBundle({ outDir, scenarioId, turn }) {
  mkdirSync(outDir, { recursive: true });
  const envelope = loadEnvelope(scenarioId);
  if (envelope.mode === "multi-turn") {
    if (turn == null) {
      throw new Error("multi-turn scenarios require per-turn surfaces; pass { turn }");
    }
    return buildTurnSurface({ outDir, scenarioId, turn, envelope });
  }
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

export function verifyCandidateBundle(dir, scenarioId, options = {}) {
  const failures = [];
  const envelope = loadJson(path.join(dir, "scenario.json"));
  const allowedRoots = envelope.allowedFixtureRoots || [];
  const allowedPaths = new Set(options.allowedPaths || []);
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
      const okRoot = allowedRoots.some(
        (root) => rel === root || rel.startsWith(`${root.replace(/\/$/, "")}/`),
      );
      const okPath = allowedPaths.has(rel);
      if (options.turn != null) {
        if (!okPath) failures.push(`execution root contains file outside envelope/fixtures: ${rel}`);
      } else if (!okRoot) {
        failures.push(`execution root contains file outside envelope/fixtures: ${rel}`);
      }
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
  const turn = process.argv.includes("--turn")
    ? Number(process.argv[process.argv.indexOf("--turn") + 1])
    : undefined;
  const outDir = process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : path.join(arenaRoot(), ".runtime-private", "candidate-bundle", scenarioId);
  rmSync(outDir, { recursive: true, force: true });
  const built = buildCandidateBundle({ outDir, scenarioId, turn });
  const check =
    turn != null
      ? verifyTurnSurface(built.outDir, scenarioId, turn)
      : verifyCandidateBundle(built.outDir, scenarioId);
  if (!check.ok) {
    console.error(JSON.stringify(check, null, 2));
    process.exit(1);
  }
  console.log(`candidate-bundle: wrote ${outDir}`);
}
