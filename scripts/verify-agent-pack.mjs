#!/usr/bin/env node
/**
 * Deterministic Agent Pack verifier (CURSOR-02).
 * Usage: node scripts/verify-agent-pack.mjs <pack-dir> [--json]
 * Exit 0 = all checks PASS. Non-zero = one or more FAIL.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseJsonc } from "jsonc-parser";

const SECRET_NAME_RE =
  /(^|[/\\])(\.env($|\.)|.*credentials\.json$|.*\.pem$|.*\.key$|id_rsa$|id_ed25519$)/i;
const SECRET_MARKER_RE =
  /\b(SUPABASE_SERVICE_ROLE|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|PRIVATE_KEY|BEGIN (RSA |OPENSSH )?PRIVATE KEY)\b/;

const IMPLEMENTER_EDIT_DENY_NEEDLES = [
  "supabase/migrations/**",
  "wrangler.toml",
  ".env",
  "**/credentials.json",
];

const IMPLEMENTER_BASH_DENY_NEEDLES = [
  "git push",
  "wrangler",
  "supabase db",
  "supabase migration",
];

/** @typedef {{ id: string, ok: boolean, detail?: string }} CheckResult */

function usage() {
  console.error("Usage: node scripts/verify-agent-pack.mjs <pack-dir> [--json]");
  process.exit(2);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Kilo rule: last matching pattern wins (object insertion order). */
function catchAllWeakensDenies(rules) {
  if (!isPlainObject(rules)) return false;
  const keys = Object.keys(rules);
  if (keys.length < 2) return false;
  const last = keys[keys.length - 1];
  if (last !== "*") return false;
  const earlierHasDeny = keys.slice(0, -1).some((k) => rules[k] === "deny");
  return earlierHasDeny && (rules["*"] === "allow" || rules["*"] === "ask");
}

function walkFiles(root, out = []) {
  if (!exists(root)) return out;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * @param {string} packDir
 * @returns {{ results: CheckResult[], meta: Record<string, string>, failed: number }}
 */
export function verifyAgentPack(packDir) {
  /** @type {CheckResult[]} */
  const results = [];
  const meta = {
    packDir: path.resolve(packDir),
    name: "",
    version: "",
  };

  const push = (id, ok, detail) => {
    results.push({ id, ok: Boolean(ok), detail });
  };

  const packJsonPath = path.join(packDir, "pack.json");
  const configPath = path.join(packDir, "kilo.jsonc");
  let packMeta = null;
  let config = null;

  if (!exists(packJsonPath)) {
    push("pack.metadata", false, "missing pack.json");
  } else {
    try {
      packMeta = JSON.parse(readText(packJsonPath));
      meta.name = String(packMeta.name || "");
      meta.version = String(packMeta.version || "");
      const ok = Boolean(packMeta.name && packMeta.version && packMeta.safe_default_agent);
      push(
        "pack.metadata",
        ok,
        ok
          ? `${packMeta.name}@${packMeta.version}`
          : "pack.json missing name/version/safe_default_agent",
      );
    } catch (err) {
      push("pack.metadata", false, `pack.json parse error: ${err.message}`);
    }
  }

  if (!exists(configPath)) {
    push("config.parse", false, "missing kilo.jsonc");
  } else {
    const raw = readText(configPath);
    const errors = [];
    config = parseJsonc(raw, errors, { allowTrailingComma: true });
    if (errors.length) {
      push(
        "config.parse",
        false,
        errors.map((e) => `${e.error} @${e.offset}`).join("; "),
      );
      config = null;
    } else if (!isPlainObject(config)) {
      push("config.parse", false, "config root is not an object");
      config = null;
    } else {
      push("config.parse", true);
    }
  }

  const requiredAgents = packMeta?.required_agents || [
    "stallvix-investigator",
    "stallvix-implementer",
  ];
  const safeDefault = packMeta?.safe_default_agent || "stallvix-investigator";
  const agents = config?.agent && isPlainObject(config.agent) ? config.agent : null;

  if (!agents) {
    push("agents.required", false, "no agent map");
  } else {
    const missing = requiredAgents.filter((a) => !agents[a]);
    push(
      "agents.required",
      missing.length === 0,
      missing.length ? `missing: ${missing.join(", ")}` : requiredAgents.join(", "),
    );
  }

  if (!config) {
    push("agent.default_safe", false, "no config");
  } else {
    const def = config.default_agent;
    push(
      "agent.default_safe",
      def === safeDefault,
      `default_agent=${def ?? "<missing>"}; expected=${safeDefault}`,
    );
  }

  const invPerm = agents?.[safeDefault]?.permission;
  if (!invPerm) {
    push("investigator.edit_deny", false, "investigator permission missing");
    push("investigator.bash_deny", false, "investigator permission missing");
    push("investigator.grep_deny", false, "investigator permission missing");
  } else {
    push(
      "investigator.edit_deny",
      invPerm.edit === "deny",
      `edit=${JSON.stringify(invPerm.edit)}`,
    );
    push(
      "investigator.bash_deny",
      invPerm.bash === "deny",
      `bash=${JSON.stringify(invPerm.bash)}`,
    );
    push(
      "investigator.grep_deny",
      invPerm.grep === "deny",
      `grep=${JSON.stringify(invPerm.grep)}`,
    );
  }

  const implementerName =
    requiredAgents.find((a) => a !== safeDefault) || "stallvix-implementer";
  const implEdit = agents?.[implementerName]?.permission?.edit;
  if (!isPlainObject(implEdit)) {
    push(
      "implementer.edit_hard_deny",
      false,
      "implementer edit rules missing/object expected",
    );
  } else {
    const missingKeys = IMPLEMENTER_EDIT_DENY_NEEDLES.filter((needle) => {
      if (implEdit[needle] === "deny") return false;
      if (needle === ".env") {
        return !(
          implEdit[".env"] === "deny" ||
          implEdit["**/.env"] === "deny" ||
          implEdit[".env.*"] === "deny"
        );
      }
      return true;
    });
    push(
      "implementer.edit_hard_deny",
      missingKeys.length === 0,
      missingKeys.length ? `missing deny: ${missingKeys.join(", ")}` : "ok",
    );
  }

  const implBash = agents?.[implementerName]?.permission?.bash;
  if (!isPlainObject(implBash)) {
    push(
      "implementer.bash_hard_deny",
      false,
      "implementer bash rules missing/object expected",
    );
  } else {
    const missing = IMPLEMENTER_BASH_DENY_NEEDLES.filter(
      (needle) =>
        !Object.entries(implBash).some(
          ([k, v]) => v === "deny" && k.toLowerCase().includes(needle.toLowerCase()),
        ),
    );
    push(
      "implementer.bash_hard_deny",
      missing.length === 0,
      missing.length ? `missing deny class: ${missing.join(", ")}` : "ok",
    );
  }

  let orderOk = true;
  let orderDetail = "ok";
  if (isPlainObject(implEdit) && catchAllWeakensDenies(implEdit)) {
    orderOk = false;
    orderDetail = "implementer.edit ends with catch-all that weakens prior denies";
  } else if (isPlainObject(implBash) && catchAllWeakensDenies(implBash)) {
    orderOk = false;
    orderDetail = "implementer.bash ends with catch-all that weakens prior denies";
  }
  push("permissions.ordering", orderOk, orderDetail);

  const requiredSkills =
    packMeta?.required_skills || [
      "stallvix-authority",
      "stallvix-receipt",
      "stallvix-safe-change",
    ];
  const missingSkills = requiredSkills.filter(
    (s) => !exists(path.join(packDir, "skills", s, "SKILL.md")),
  );
  push(
    "skills.required",
    missingSkills.length === 0,
    missingSkills.length ? `missing: ${missingSkills.join(", ")}` : requiredSkills.join(", "),
  );

  const requiredDocs =
    packMeta?.required_docs || [
      "README.md",
      "INSTALL.md",
      "AGENTS.md",
      "PROOF-TEST-A.md",
    ];
  const missingDocs = requiredDocs.filter((d) => !exists(path.join(packDir, d)));
  push(
    "docs.required",
    missingDocs.length === 0,
    missingDocs.length ? `missing: ${missingDocs.join(", ")}` : requiredDocs.join(", "),
  );

  const proofPath = path.join(packDir, "PROOF-TEST-A.md");
  if (!exists(proofPath)) {
    push("proof.test_a_honesty", false, "PROOF-TEST-A.md missing");
  } else {
    const text = readText(proofPath);
    const gateBPassed = /\|\s*Real Kilo runtime[^\n]*\|\s*\*\*PASSED\*\*/i.test(text);
    const standInOk = /does not prove|NOT PASSED|PENDING — needs real Kilo/i.test(text);
    push(
      "proof.test_a_honesty",
      !gateBPassed && standInOk,
      gateBPassed
        ? "PROOF-TEST-A claims Real Kilo PASSED"
        : standInOk
          ? "honest Gate B status"
          : "PROOF-TEST-A missing honest NOT PASSED / does-not-prove language",
    );
  }

  const files = walkFiles(packDir);
  const secretHits = [];
  for (const file of files) {
    const rel = path.relative(packDir, file).replace(/\\/g, "/");
    if (SECRET_NAME_RE.test(rel)) {
      secretHits.push(`name:${rel}`);
      continue;
    }
    if (/\.(png|jpg|jpeg|gif|webp|pdf|zip|gz|woff2?)$/i.test(rel)) continue;
    let body;
    try {
      body = readText(file);
    } catch {
      continue;
    }
    if (SECRET_MARKER_RE.test(body)) {
      secretHits.push(`marker:${rel}`);
    }
  }
  push(
    "secrets.none",
    secretHits.length === 0,
    secretHits.length ? secretHits.slice(0, 5).join("; ") : "ok",
  );

  const failed = results.filter((r) => !r.ok).length;
  return { results, meta, failed };
}

export function formatText(report) {
  const lines = report.results.map(
    (r) => `${r.ok ? "PASS" : "FAIL"} ${r.id}${r.detail ? ` — ${r.detail}` : ""}`,
  );
  const total = report.results.length;
  const failed = report.failed;
  const status = failed === 0 ? "PASS" : "FAIL";
  lines.push(
    "",
    `Agent Pack: ${status} (${failed === 0 ? total : total - failed}/${total} checks passed)${
      report.meta.name ? ` — ${report.meta.name}@${report.meta.version}` : ""
    }`,
  );
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.includes("-h") || args.includes("--help")) usage();
  const jsonMode = args.includes("--json");
  const packArg = args.find((a) => !a.startsWith("--"));
  const packDir = path.resolve(packArg || "");
  if (!packArg || !exists(packDir)) {
    console.error(`Pack directory not found: ${packDir}`);
    process.exit(2);
  }

  const report = verifyAgentPack(packDir);
  if (jsonMode) {
    console.log(JSON.stringify({ ...report, ok: report.failed === 0 }, null, 2));
  } else {
    console.log(formatText(report));
  }
  process.exit(report.failed === 0 ? 0 : 1);
}

const isDirectRun =
  process.argv[1] &&
  path.normalize(path.resolve(process.argv[1])) ===
    path.normalize(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main();
}
