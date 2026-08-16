import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STALLVIX_COMMIT = "8d11ed7a27482595b015ee3fdb91f696edf361ed";
export const GRANAIDE_BASE_SHA = "b0c122a7f834e66a6e66573845e6c003a98c8c44";
export const STALLVIX_REPO = "saeedian2026-cmyk/StallVix";
export const ARENA_VERSION = "lab-00-v1";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

export function arenaRoot() {
  return path.resolve(SCRIPT_DIR, "..");
}

export function repoRoot() {
  return path.resolve(arenaRoot(), "..", "..");
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

export function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function walkFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out.sort();
}

export function sanitizeStallVixText(text) {
  let out = text.replace(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    "redacted@example.invalid",
  );
  out = out.replace(/\butxseascigkfhslwapoq\b/g, "redacted-project-ref");
  return out;
}

export const SOURCE_CORPUS = [
  { sourcePath: "SPEC.md", classification: "authority" },
  { sourcePath: "AGENTS.md", classification: "authority" },
  { sourcePath: "DOCS_INDEX.md", classification: "authority" },
  { sourcePath: "RESEARCH_FORGE.md", classification: "authority" },
  { sourcePath: "CURRENT_STATE.md", classification: "state" },
  { sourcePath: "BACKLOG.md", classification: "history" },
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

export const SCENARIO_REQUIRED_FIELDS = [
  "id",
  "objective",
  "candidatePrompt",
  "allowedEvidenceRoots",
  "forbiddenAssumptions",
  "expectedEvidenceIds",
  "expectedTruthFacts",
  "hardFailConditions",
  "deterministicChecks",
  "humanReviewRubric",
];

export const FORBIDDEN_FIXTURE_PATTERNS = [
  /(^|\/)\.env($|\.)/i,
  /(^|\/)\.env\./i,
  /(^|\/)credentials(\.|$|\/)/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /(^|\/)\.kilo-runtime-data(\/|$)/i,
]

export function looksLikeForbiddenSecretPath(relPosix) {
  return FORBIDDEN_FIXTURE_PATTERNS.some((re) => re.test(relPosix));
}
