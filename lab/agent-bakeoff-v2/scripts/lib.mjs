#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ARENA_VERSION = "lab-00-v2";
export const GRANAIDE_BASE_SHA = "b0c122a7f834e66a6e66573845e6c003a98c8c44";
export const STALLVIX_REPO = "saeedian2026-cmyk/StallVix";
export const STALLVIX_COMMIT = "8d11ed7a27482595b015ee3fdb91f696edf361ed";
export const LOCALHOST_HOST = "127.0.0.1";
export const DEFAULT_WEB_PORT = 8765;
export const SYNTHETIC_MARKER =
  "SYNTHETIC BENCHMARK FIXTURE — not a StallVix document";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

export function arenaRoot() {
  return path.resolve(SCRIPT_DIR, "..");
}

export function repoRoot() {
  return path.resolve(arenaRoot(), "..", "..");
}

export function publicScenariosDir() {
  return path.join(arenaRoot(), "scenarios", "public");
}

export function evaluatorDir() {
  return path.join(arenaRoot(), "evaluator", "private");
}

export function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

export function sha256Bytes(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

export function sha256File(filePath) {
  return sha256Bytes(readFileSync(filePath));
}

export function sha256CanonicalFile(filePath) {
  const buf = readFileSync(filePath);
  if (/\.(png|jpg|jpeg|webp|gif)$/i.test(filePath)) return sha256Bytes(buf);
  return sha256Text(buf.toString("utf8").replace(/\r\n/g, "\n"));
}

export function sha256Text(text) {
  return sha256Bytes(Buffer.from(text, "utf8"));
}

export function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function tryLoadJson(filePath) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(filePath, "utf8")) };
  } catch (error) {
    return { ok: false, error };
  }
}

export const SCENARIO_FILES = {
  T1: "T1-authority-resolution.json",
  T2: "T2-evidence-routing.json",
  T3: "T3-multi-turn-correction.json",
  T4: "T4-tool-routing.json",
  T5: "T5-research-acquisition.json",
  T6: "T6-bounded-mutation.json",
  T7: "T7-adversarial-truth.json",
};

export const CANDIDATE_EXECUTION_ROOT_POLICY = {
  include: [
    "public scenario envelope",
    "scenario.allowedFixtureRoots",
    "scenario-specific writable area",
  ],
  exclude: [
    "evaluator/private",
    "goldens",
    "scripts",
    "arena-manifest.json",
    "other scenarios",
    "answer-bearing metadata",
    "t5-pages-registry",
  ],
};

export const SELF_DESCRIBING_PATTERNS = [
  /"stale"\s*:\s*true/,
  /\bstale:\s*true\b/,
  /whyMisleading/,
  /expectedCurrentFact/,
  /correctFact/,
  /this is the adversarial file/i,
];

export function findSelfDescribingHits(text) {
  return SELF_DESCRIBING_PATTERNS.filter((re) => re.test(text)).map((re) => String(re));
}

export const EVALUATOR_PRIVATE_PREFIX = "evaluator/private";

export const EVALUATOR_ONLY_KEYS = [
  "expectedFacts",
  "expectedTruthFacts",
  "expectedEvidenceIds",
  "golden",
  "goldens",
  "oracle",
  "oracleAnswer",
  "scoringKey",
  "scoringKeys",
  "hardFail",
  "hardFailConditions",
  "hardFailRules",
  "deterministicChecks",
  "staleFactsMustNotBeCurrent",
  "currentFacts",
  "requiredEvidenceIds",
  "forbiddenEvidenceIds",
  "forbiddenAsAuthorityIds",
  "governingSourceIds",
  "rejectedSourceIds",
  "requiredToolClasses",
  "turn3CurrentFacts",
  "turn3ForbiddenCurrentFacts",
  "publicMirror",
  "oracleStrings",
  "decoyStrings",
  "correctPage",
  "correctFact",
];

export const FORBIDDEN_TOOL_CLASSES = [
  "db.production",
  "deploy",
  "kilo",
  "internet.http",
];

export const REQUIRED_T4_TOOL_CLASSES = [
  "local.repo",
  "local.evidence",
  "localhost.http",
];

export const PRIVATE_RUNTIME_SOURCE_PATHS = [
  { sourcePath: "SPEC.md", classification: "authority" },
  { sourcePath: "AGENTS.md", classification: "authority" },
  { sourcePath: "DOCS_INDEX.md", classification: "authority" },
  { sourcePath: "RESEARCH_FORGE.md", classification: "research" },
  { sourcePath: "CURRENT_STATE.md", classification: "state" },
  { sourcePath: "BACKLOG.md", classification: "intake" },
  {
    sourcePath: "docs/history/2026-08/TRUTH_AUDIT_SVX-TRUTH-01.md",
    classification: "history",
  },
  {
    sourcePath: "docs/architecture/OPERATIONAL-GRAPH.md",
    classification: "architecture",
  },
  {
    sourcePath: "docs/lanes/SVX-PLATFORM-SEARCH-CONTRACT-01.md",
    classification: "architecture",
  },
  {
    sourcePath: "docs/agent-work/PACKET_TEMPLATE.md",
    classification: "architecture",
  },
  {
    sourcePath: "docs/agent-work/RECEIPT_TEMPLATE.md",
    classification: "architecture",
  },
];

export const SECRET_PATH_PATTERNS = [
  /(^|\/)\.env($|\.)/i,
  /(^|\/)credentials(\.|$|\/)/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /(^|\/)\.kilo-runtime-data(\/|$)/i,
  /(^|\/)\.runtime-private(\/|$)/i,
  /stallvix-snapshot/i,
  /service[_-]?role/i,
];

export function looksLikeForbiddenSecretPath(relPosix) {
  return SECRET_PATH_PATTERNS.some((re) => re.test(relPosix));
}

export function walkFiles(dir, options = {}) {
  const out = [];
  if (!existsSync(dir)) return out;
  const follow = options.followSymlinks === true;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = lstatSync(full);
    if (st.isSymbolicLink()) {
      out.push(full);
      if (follow) {
        try {
          const target = realpathSync(full);
          const rst = lstatSync(target);
          if (rst.isDirectory()) out.push(...walkFiles(target, options));
        } catch {
          // dangling symlink: keep the link path only
        }
      }
      continue;
    }
    if (st.isDirectory()) out.push(...walkFiles(full, options));
    else out.push(full);
  }
  return out.sort();
}

export function collectJsonKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonKeys(item, keys);
    return keys;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      keys.add(k);
      collectJsonKeys(v, keys);
    }
  }
  return keys;
}

export function containsEvaluatorOnlyKeys(value) {
  const keys = collectJsonKeys(value);
  return EVALUATOR_ONLY_KEYS.filter((k) => keys.has(k));
}

export function nowIso() {
  return new Date().toISOString();
}

export function isInsideRoot(root, candidate) {
  const resolvedRoot = path.resolve(root);
  let resolvedCandidate;
  try {
    resolvedCandidate = realpathSync(candidate);
  } catch {
    resolvedCandidate = path.resolve(candidate);
  }
  const rel = path.relative(resolvedRoot, resolvedCandidate);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

export function deepEqual(a, b) {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

export function collectEvidenceRefs(scenario) {
  const refs = [...(scenario.evidenceRefs || [])];
  for (const turn of scenario.turns || []) {
    for (const ref of turn.evidenceRefs || []) refs.push(ref);
  }
  const byId = new Map();
  for (const ref of refs) {
    if (!ref || !ref.id) continue;
    byId.set(ref.id, { id: ref.id, path: ref.path || "" });
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function extractPublicMirror(scenario) {
  return {
    allowedFixtureRoots: [...(scenario.allowedFixtureRoots || [])].slice().sort(),
    arenaVersion: scenario.arenaVersion,
    evidenceRefs: collectEvidenceRefs(scenario),
    id: scenario.id,
    localhost: scenario.localhost || null,
    mode: scenario.mode || "single-turn",
    writableGrant: scenario.writableGrant || null,
  };
}

export function duplicatedOracleMismatches(scenario, golden) {
  const failures = [];
  if (golden.scenarioId !== scenario.id) {
    failures.push(
      `duplicated id mismatch scenario.id=${scenario.id} golden.scenarioId=${golden.scenarioId}`,
    );
  }
  if (!golden.publicMirror) {
    failures.push(`${scenario.id} golden missing publicMirror`);
  } else if (!deepEqual(extractPublicMirror(scenario), golden.publicMirror)) {
    failures.push(`${scenario.id} publicMirror does not deep-equal public scenario metadata`);
  }
  const oracleFieldNames = new Set([
    ...EVALUATOR_ONLY_KEYS,
    "oracleStrings",
    "decoyStrings",
    "requiredMutation",
    "forbiddenPathPrefixes",
    "requiredToolClasses",
    "forbiddenToolClasses",
    "ignoreCandidateMutationPaths",
    "ignoreCandidateToolProse",
    "usefulHostileFact",
  ]);
  for (const key of Object.keys(scenario)) {
    if (key in golden && oracleFieldNames.has(key) && !deepEqual(scenario[key], golden[key])) {
      failures.push(`${scenario.id} duplicated oracle field ${key} mismatch`);
    }
  }
  return failures;
}
