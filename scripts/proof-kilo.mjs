#!/usr/bin/env node
/**
 * Headless Kilo proof harness (CURSOR-03).
 *
 * Captures operator-side Git facts + kilo run output into a proof bundle.
 * Does not install Kilo. Does not mutate StallVix beyond what the agent does
 * during a live run (operator Git capture only).
 *
 * Usage:
 *   npm run proof:kilo -- --help
 *   npm run proof:kilo -- --workspace <path> --agent <name> --prompt-file <path>
 *   npm run proof:kilo -- --mock-fixture <json-events-file> ...
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SECRET_RE =
  /\b((?:sk|pk|rk|api|key|token|secret|password)[-_]?[a-z0-9]*\s*[=:]\s*)([^\s"'\\]+)/gi;
const KEYISH_RE =
  /\b(SUPABASE_SERVICE_ROLE|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY)=([^\s]+)/gi;

function printHelp() {
  console.log(`Headless Kilo proof harness (CURSOR-03)

Usage:
  node scripts/proof-kilo.mjs --workspace <dir> --agent <name> --prompt-file <path> [options]

Required (except --help):
  --workspace <dir>       Consumer repo (e.g. StallVix worktree)
  --agent <name>          Agent id (e.g. stallvix-investigator)
  --prompt-file <path>    Prompt text file OR markdown job packet

Options:
  --pack-dir <dir>        Pack root for proof output (default: products/stallvix-kilo-pack)
  --timeout-ms <n>        Kill kilo after N ms (default: 120000)
  --format <default|json> Passed to kilo run (default: json)
  --mock-fixture <file>   Skip live kilo; parse fixture events instead
  --kilo-bin <path>       Explicit kilo binary (else PATH / KILO_BIN)
  --dry-git-only          Capture Git facts only; do not invoke kilo
  --help                  Show this help (no Kilo required)

Exit codes:
  0  harness completed and wrote bundle
  1  harness/runtime failure
  2  usage / KILO_NOT_AVAILABLE
`);
}

function parseArgs(argv) {
  const out = {
    workspace: null,
    agent: null,
    promptFile: null,
    packDir: "products/stallvix-kilo-pack",
    timeoutMs: 120_000,
    format: "json",
    mockFixture: null,
    kiloBin: process.env.KILO_BIN || null,
    dryGitOnly: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--help":
      case "-h":
        out.help = true;
        break;
      case "--workspace":
        out.workspace = next();
        break;
      case "--agent":
        out.agent = next();
        break;
      case "--prompt-file":
        out.promptFile = next();
        break;
      case "--pack-dir":
        out.packDir = next();
        break;
      case "--timeout-ms":
        out.timeoutMs = Number(next());
        break;
      case "--format":
        out.format = next();
        break;
      case "--mock-fixture":
        out.mockFixture = next();
        break;
      case "--kilo-bin":
        out.kiloBin = next();
        break;
      case "--dry-git-only":
        out.dryGitOnly = true;
        break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return out;
}

function redact(text) {
  if (!text) return text;
  return String(text)
    .replace(SECRET_RE, "$1***REDACTED***")
    .replace(KEYISH_RE, "$1=***REDACTED***");
}

function runGit(cwd, args) {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
  };
}

export function captureGitFacts(workspace) {
  const branch = runGit(workspace, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const head = runGit(workspace, ["rev-parse", "HEAD"]);
  const dirty = runGit(workspace, ["status", "--porcelain"]);
  const dirtyPaths = dirty.ok
    ? dirty.stdout
        .split("\n")
        .map((l) => l.trimEnd())
        .filter(Boolean)
        .map((l) => l.slice(3).trim())
    : [];
  return {
    branch: branch.ok ? branch.stdout : null,
    head: head.ok ? head.stdout : null,
    dirtyPaths,
    captureError:
      branch.ok && head.ok && dirty.ok
        ? null
        : redact([branch.stderr, head.stderr, dirty.stderr].filter(Boolean).join(" | ")),
  };
}

export function resolveKiloBin(explicit) {
  if (explicit) {
    if (!fs.existsSync(explicit)) {
      return { ok: false, code: "KILO_NOT_AVAILABLE", detail: `kilo bin not found: ${explicit}` };
    }
    return { ok: true, bin: explicit };
  }
  const which = spawnSync(process.platform === "win32" ? "where" : "which", ["kilo"], {
    encoding: "utf8",
    windowsHide: true,
  });
  const first = (which.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find(Boolean);
  if (!first) {
    return {
      ok: false,
      code: "KILO_NOT_AVAILABLE",
      detail: "kilo not found on PATH; install CLI or pass --kilo-bin / KILO_BIN",
    };
  }
  return { ok: true, bin: first };
}

export function parseKiloJsonEvents(stdout) {
  const events = [];
  const lines = String(stdout || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        events.push(JSON.parse(trimmed));
      } catch {
        events.push({ type: "raw_line", text: redact(trimmed) });
      }
    } else {
      events.push({ type: "raw_line", text: redact(trimmed) });
    }
  }
  const session =
    events.find((e) => e.sessionID || e.sessionId || e.session_id)?.sessionID ||
    events.find((e) => e.sessionID || e.sessionId || e.session_id)?.sessionId ||
    events.find((e) => e.session_id)?.session_id ||
    null;
  return { events, sessionId: session };
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function writeBundle(packDir, bundle) {
  const dir = path.join(packDir, "proof", "harness");
  fs.mkdirSync(dir, { recursive: true });
  const base = `PROOF-${stamp()}`;
  const jsonPath = path.join(dir, `${base}.json`);
  const mdPath = path.join(dir, `${base}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(bundle, null, 2), "utf8");
  const md = [
    `# ${base}`,
    "",
    `- agent: \`${bundle.runtime.agent}\``,
    `- workspace: \`${bundle.workspace}\``,
    `- kilo: \`${bundle.runtime.kiloVersion || "n/a"}\``,
    `- session: \`${bundle.runtime.sessionId || "n/a"}\``,
    `- exit: \`${bundle.runtime.exitCode}\``,
    `- before HEAD: \`${bundle.git.before.head}\``,
    `- after HEAD: \`${bundle.git.after.head}\``,
    `- changed paths: ${(bundle.git.changedPaths || []).join(", ") || "(none)"}`,
    `- error: ${bundle.error || "(none)"}`,
    "",
    "Git facts and transcript captured by Granaide harness (operator process), not agent narrative.",
    "",
  ].join("\n");
  fs.writeFileSync(mdPath, md, "utf8");
  return { jsonPath, mdPath };
}

function changedPaths(before, after) {
  const a = new Set(before.dirtyPaths || []);
  const b = new Set(after.dirtyPaths || []);
  const out = new Set();
  for (const p of b) if (!a.has(p)) out.add(p);
  for (const p of a) if (!b.has(p)) out.add(p);
  if (before.head && after.head && before.head !== after.head) {
    out.add(`HEAD:${before.head.slice(0, 7)}→${after.head.slice(0, 7)}`);
  }
  return [...out].sort();
}

export function runProof(opts) {
  const workspace = path.resolve(opts.workspace);
  const packDir = path.resolve(opts.packDir);
  const promptFile = path.resolve(opts.promptFile);
  if (!fs.existsSync(workspace)) {
    return { ok: false, exitCode: 1, error: `workspace not found: ${workspace}` };
  }
  if (!fs.existsSync(promptFile)) {
    return { ok: false, exitCode: 1, error: `prompt-file not found: ${promptFile}` };
  }

  const prompt = fs.readFileSync(promptFile, "utf8");
  const before = captureGitFacts(workspace);

  /** @type {any} */
  let runtime = {
    agent: opts.agent,
    kiloBin: null,
    kiloVersion: null,
    sessionId: null,
    exitCode: null,
    format: opts.format,
    mode: opts.mockFixture ? "mock" : opts.dryGitOnly ? "dry-git-only" : "kilo-run",
    stdout: "",
    stderr: "",
    events: [],
  };

  let error = null;

  if (opts.dryGitOnly) {
    runtime.exitCode = 0;
  } else if (opts.mockFixture) {
    const fixturePath = path.resolve(opts.mockFixture);
    if (!fs.existsSync(fixturePath)) {
      return { ok: false, exitCode: 1, error: `mock fixture not found: ${fixturePath}` };
    }
    const raw = fs.readFileSync(fixturePath, "utf8");
    runtime.stdout = redact(raw);
    const parsed = parseKiloJsonEvents(raw);
    runtime.events = parsed.events;
    runtime.sessionId = parsed.sessionId;
    runtime.exitCode = 0;
    runtime.kiloVersion = "mock";
  } else {
    const resolved = resolveKiloBin(opts.kiloBin);
    if (!resolved.ok) {
      return {
        ok: false,
        exitCode: 2,
        error: resolved.code,
        detail: resolved.detail,
        git: { before },
      };
    }
    runtime.kiloBin = resolved.bin;
    const ver = spawnSync(resolved.bin, ["--version"], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 15_000,
    });
    runtime.kiloVersion = redact((ver.stdout || ver.stderr || "").trim()) || null;

    const args = [
      "run",
      "--format",
      opts.format,
      "--agent",
      opts.agent,
      "--dir",
      workspace,
      prompt,
    ];
    const run = spawnSync(resolved.bin, args, {
      encoding: "utf8",
      windowsHide: true,
      timeout: opts.timeoutMs,
      env: {
        ...process.env,
        // Do not dump env into bundle; keep process env for auth if already configured.
      },
    });
    runtime.exitCode = run.status;
    runtime.stdout = redact(run.stdout || "");
    runtime.stderr = redact(run.stderr || "");
    if (opts.format === "json") {
      const parsed = parseKiloJsonEvents(run.stdout || "");
      runtime.events = parsed.events.map((e) =>
        typeof e === "object" ? JSON.parse(redact(JSON.stringify(e))) : e,
      );
      runtime.sessionId = parsed.sessionId;
    }
    if (run.error?.code === "ETIMEDOUT") {
      error = `timeout after ${opts.timeoutMs}ms`;
    } else if (run.status !== 0) {
      error = `kilo run exited ${run.status}`;
    }
  }

  const after = captureGitFacts(workspace);
  const bundle = {
    schema: "granaide.kilo-proof-bundle/v0",
    createdAt: new Date().toISOString(),
    workspace,
    promptFile,
    git: {
      before,
      after,
      changedPaths: changedPaths(before, after),
    },
    runtime: {
      ...runtime,
      // Keep event count small in summary path; full events stay in JSON.
      eventCount: runtime.events?.length || 0,
    },
    error,
    notes: {
      serveVsRun:
        "Primary path is `kilo run` (one-shot). `kilo serve` is a long-lived HTTP/SSE server for attach/clients; use serve when an external client must stream events across multiple prompts. This harness uses run by default.",
      gitAuthority: "before/after Git facts come from the operator harness, not agent text.",
    },
  };

  const paths = writeBundle(packDir, bundle);
  return {
    ok: error == null && (runtime.exitCode === 0 || opts.dryGitOnly || opts.mockFixture),
    exitCode: error ? 1 : runtime.exitCode === 0 || opts.mockFixture || opts.dryGitOnly ? 0 : 1,
    bundle,
    paths,
    error: error || (bundle.error ?? null),
  };
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    printHelp();
    process.exit(2);
  }
  if (opts.help) {
    printHelp();
    process.exit(0);
  }
  if (!opts.workspace || !opts.agent || !opts.promptFile) {
    console.error("Missing required --workspace / --agent / --prompt-file");
    printHelp();
    process.exit(2);
  }

  const result = runProof(opts);
  if (result.error === "KILO_NOT_AVAILABLE") {
    console.error(`KILO_NOT_AVAILABLE: ${result.detail || ""}`.trim());
    if (result.git?.before) {
      console.error(
        `git.before head=${result.git.before.head} branch=${result.git.before.branch}`,
      );
    }
    process.exit(2);
  }

  if (result.paths) {
    console.log(`proof bundle: ${result.paths.jsonPath}`);
    console.log(`proof summary: ${result.paths.mdPath}`);
  }
  if (!result.ok) {
    console.error(result.error || "proof harness failed");
    process.exit(result.exitCode || 1);
  }
  console.log("proof harness OK");
  process.exit(0);
}

const isDirectRun =
  process.argv[1] &&
  path.normalize(path.resolve(process.argv[1])) ===
    path.normalize(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main();
}
